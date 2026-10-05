import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")

if not ETHERSCAN_API_KEY:
    raise RuntimeError("ETHERSCAN_API_KEY is missing from .env")