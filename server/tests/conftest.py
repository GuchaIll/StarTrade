import sys
import os
import asyncio
import pytest

# Ensure project root is on sys.path so imports like `from app import app` work
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


@pytest.fixture
def anyio_backend():
    return 'asyncio'


@pytest.fixture
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
