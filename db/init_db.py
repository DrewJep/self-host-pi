import asyncio

import asyncpg
from config import DB_CONFIG


async def init_db():
    conn = await asyncpg.connect(**DB_CONFIG)

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS contest_movies (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            director TEXT NOT NULL,
            submitted_by TEXT,
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            is_watched BOOLEAN DEFAULT FALSE,
            is_selected BOOLEAN DEFAULT FALSE,
            watch_date TIMESTAMP WITH TIME ZONE
        )
        """
    )

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS contest_votes (
            id SERIAL PRIMARY KEY,
            movie_id INTEGER NOT NULL REFERENCES contest_movies(id) ON DELETE CASCADE,
            reviewer_name TEXT,
            score_story INTEGER NOT NULL CHECK (score_story BETWEEN 1 AND 5),
            score_characters INTEGER NOT NULL CHECK (score_characters BETWEEN 1 AND 5),
            score_cinematography INTEGER NOT NULL CHECK (score_cinematography BETWEEN 1 AND 5),
            score_overall INTEGER NOT NULL CHECK (score_overall BETWEEN 1 AND 5),
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS contest_settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT NOT NULL
        )
        """
    )

    await conn.execute(
        """
        INSERT INTO contest_settings (setting_key, setting_value)
        VALUES ('submissions_open', 'true')
        ON CONFLICT (setting_key) DO NOTHING
        """
    )

    await conn.close()


if __name__ == "__main__":
    asyncio.run(init_db())
