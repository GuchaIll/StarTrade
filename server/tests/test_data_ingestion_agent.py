import asyncio
import pytest

from ResearchAgent.agents.data_ingestion_agent import (
    DataSource,
    BaseIngestionAgent,
    SimpleRateLimiter,
    BucketFullException,
    YFinanceAgent,
)


def test_simple_rate_limiter_allows_calls():
    limiter = SimpleRateLimiter(capacity=2, per_seconds=1)

    async def task():
        async with limiter.ratelimit('t'):
            return True

    loop = asyncio.new_event_loop()
    try:
        loop.set_debug(False)
        res1 = loop.run_until_complete(task())
        res2 = loop.run_until_complete(task())
        assert res1 is True and res2 is True
    finally:
        loop.close()


def test_bucket_full_exception_when_no_delay():
    limiter = SimpleRateLimiter(capacity=1, per_seconds=1)

    async def two_calls():
        async with limiter.ratelimit('t'):
            pass
        # second call with delay=False should raise
        try:
            async with limiter.ratelimit('t', delay=False):
                pass
        except BucketFullException:
            return True
        return False

    loop = asyncio.new_event_loop()
    try:
        res = loop.run_until_complete(two_calls())
        assert res is True
    finally:
        loop.close()
