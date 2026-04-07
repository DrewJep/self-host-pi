import asyncpg

from db.config import DB_CONFIG

pool: asyncpg.pool.Pool | None = None


async def connect_pool() -> asyncpg.pool.Pool:
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(**DB_CONFIG)
    return pool


async def close_pool() -> None:
    global pool
    if pool is not None:
        await pool.close()
        pool = None
