from typing import Optional

import asyncpg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.schemas import MovieSubmission, VoteSubmission, SubmissionLockUpdate
from db.config import DB_CONFIG

app = FastAPI(
    title="API of Movies",
    description="Objectively the best way to rate movies ever",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pool: Optional[asyncpg.pool.Pool] = None


def _movie_record(record: asyncpg.Record) -> dict:
    return {
        "id": record["id"],
        "title": record["title"],
        "director": record["director"],
        "submitted_by": record["submitted_by"],
        "submitted_at": record["submitted_at"].isoformat() if record["submitted_at"] else None,
        "is_watched": record["is_watched"],
        "is_selected": record["is_selected"],
        "watch_date": record["watch_date"].isoformat() if record["watch_date"] else None,
    }


def _vote_record(record: asyncpg.Record) -> dict:
    return {
        "id": record["id"],
        "movie_id": record["movie_id"],
        "reviewer_name": record["reviewer_name"],
        "score_story": record["score_story"],
        "score_characters": record["score_characters"],
        "score_cinematography": record["score_cinematography"],
        "score_overall": record["score_overall"],
        "submitted_at": record["submitted_at"].isoformat() if record["submitted_at"] else None,
    }


@app.on_event("startup")
async def startup():
    global pool
    pool = await asyncpg.create_pool(**DB_CONFIG)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO contest_settings (setting_key, setting_value)
            VALUES ('submissions_open', 'true')
            ON CONFLICT (setting_key) DO NOTHING
            """
        )


@app.on_event("shutdown")
async def shutdown():
    global pool
    if pool:
        await pool.close()


@app.get("/api/movies")
async def list_movies(pending_only: bool = False):
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")

    condition = "WHERE is_watched = FALSE" if pending_only else ""
    query = f"SELECT * FROM contest_movies {condition} ORDER BY submitted_at DESC"
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
    return [_movie_record(row) for row in rows]


@app.post("/api/movies")
async def submit_movie(payload: MovieSubmission):
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")

    async with pool.acquire() as conn:
        submission_open = await conn.fetchval(
            "SELECT setting_value FROM contest_settings WHERE setting_key = 'submissions_open'"
        )
        if submission_open != "true":
            raise HTTPException(status_code=403, detail="Submissions are currently closed")

        movie_id = await conn.fetchval(
            """
            INSERT INTO contest_movies (title, director, submitted_by)
            VALUES ($1, $2, $3)
            RETURNING id
            """,
            payload.title,
            payload.director,
            payload.submitted_by,
        )
        created = await conn.fetchrow("SELECT * FROM contest_movies WHERE id = $1", movie_id)
    return _movie_record(created)


@app.post("/api/votes")
async def submit_vote(payload: VoteSubmission):
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")

    async with pool.acquire() as conn:
        movie_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM contest_movies WHERE id = $1)", payload.movie_id
        )
        if not movie_exists:
            raise HTTPException(status_code=404, detail="Movie not found")

        vote_id = await conn.fetchval(
            """
            INSERT INTO contest_votes (
                movie_id,
                reviewer_name,
                score_story,
                score_characters,
                score_cinematography,
                score_overall
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            """,
            payload.movie_id,
            payload.reviewer_name,
            payload.score_story,
            payload.score_characters,
            payload.score_cinematography,
            payload.score_overall,
        )
        created = await conn.fetchrow("SELECT * FROM contest_votes WHERE id = $1", vote_id)
    return _vote_record(created)


@app.get("/api/votes")
async def list_votes(movie_id: int):
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with pool.acquire() as conn:
        movie_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM contest_movies WHERE id = $1)", movie_id
        )
        if not movie_exists:
            raise HTTPException(status_code=404, detail="Movie not found")
        rows = await conn.fetch(
            "SELECT * FROM contest_votes WHERE movie_id = $1 ORDER BY submitted_at DESC",
            movie_id,
        )
    return [_vote_record(row) for row in rows]


@app.get("/api/admin/status")
async def admin_status():
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with pool.acquire() as conn:
        submission_open = await conn.fetchval(
            "SELECT setting_value FROM contest_settings WHERE setting_key = 'submissions_open'"
        )
        selected = await conn.fetchrow(
            "SELECT * FROM contest_movies WHERE is_selected = TRUE LIMIT 1"
        )
    return {
        "submissions_open": submission_open == "true",
        "selected_movie": _movie_record(selected) if selected else None,
    }


@app.post("/api/admin/roll")
async def roll_next_movie():
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with pool.acquire() as conn:
        candidate = await conn.fetchrow(
            "SELECT * FROM contest_movies WHERE is_watched = FALSE AND is_selected = FALSE ORDER BY RANDOM() LIMIT 1"
        )
        if not candidate:
            raise HTTPException(status_code=404, detail="No pending movies available to select")

        await conn.execute("UPDATE contest_movies SET is_watched = TRUE, is_selected = FALSE WHERE is_selected = TRUE")
        await conn.execute("UPDATE contest_movies SET is_selected = TRUE WHERE id = $1", candidate["id"])
    return _movie_record(candidate)


@app.post("/api/admin/lock-submissions")
async def update_submission_lock(payload: SubmissionLockUpdate):
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    value = "true" if payload.open else "false"
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE contest_settings SET setting_value = $1 WHERE setting_key = 'submissions_open'",
            value,
        )
    return {"submissions_open": payload.open}


@app.get("/api/admin/results")
async def admin_results():
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                m.id,
                m.title,
                m.director,
                m.submitted_by,
                m.is_watched,
                COUNT(v.id) AS vote_count,
                AVG(v.score_story) AS avg_story,
                AVG(v.score_characters) AS avg_characters,
                AVG(v.score_cinematography) AS avg_cinematography,
                AVG(v.score_overall) AS avg_overall
            FROM contest_movies m
            LEFT JOIN contest_votes v ON v.movie_id = m.id
            WHERE m.is_watched = TRUE
            GROUP BY m.id
            ORDER BY avg_overall DESC NULLS LAST, vote_count DESC
            """
        )
    return [
        {
            "movie_id": row["id"],
            "title": row["title"],
            "director": row["director"],
            "submitted_by": row["submitted_by"],
            "is_watched": row["is_watched"],
            "vote_count": row["vote_count"],
            "avg_story": float(row["avg_story"]) if row["avg_story"] is not None else None,
            "avg_characters": float(row["avg_characters"]) if row["avg_characters"] is not None else None,
            "avg_cinematography": float(row["avg_cinematography"]) if row["avg_cinematography"] is not None else None,
            "avg_overall": float(row["avg_overall"]) if row["avg_overall"] is not None else None,
        }
        for row in rows
    ]


@app.post("/api/admin/reset")
async def reset_contest():
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool not initialized")
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM contest_votes")
        await conn.execute("DELETE FROM contest_movies")
        await conn.execute("UPDATE contest_settings SET setting_value = 'true' WHERE setting_key = 'submissions_open'")
    return {"message": "All contest data has been reset. Submissions are now open."}
