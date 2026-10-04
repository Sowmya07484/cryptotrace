import asyncio
import httpx

from app.config import ETHERSCAN_API_KEY
from app.models.transaction import Transaction


ETHERSCAN_URL = "https://api.etherscan.io/v2/api"
ETHEREUM_CHAIN_ID = "1"

# Keep requests below Etherscan's rate limit.
REQUEST_DELAY = 0.4

_request_lock = asyncio.Lock()
_last_request_time = 0.0


async def _etherscan_request(params: dict):
    global _last_request_time

    async with _request_lock:
        now = asyncio.get_running_loop().time()
        wait_time = REQUEST_DELAY - (now - _last_request_time)

        if wait_time > 0:
            await asyncio.sleep(wait_time)

        request_params = params.copy()
        request_params["chainid"] = ETHEREUM_CHAIN_ID
        request_params["apikey"] = ETHERSCAN_API_KEY

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                ETHERSCAN_URL,
                params=request_params,
            )

        response.raise_for_status()
        data = response.json()

        _last_request_time = asyncio.get_running_loop().time()

    message = str(data.get("message", ""))
    result = data.get("result")

    if result == "No transactions found":
        return []

    if message == "No transactions found":
        return []

    if result == []:
        return []

    if data.get("status") != "1":
        raise RuntimeError(
            f"Etherscan error: {message} | {result}"
        )

    return result


async def get_normal_transactions(
    address: str,
    page: int = 1,
    offset: int = 20,
) -> list[Transaction]:

    result = await _etherscan_request({
        "module": "account",
        "action": "txlist",
        "address": address,
        "startblock": 0,
        "endblock": 999999999,
        "page": page,
        "offset": offset,
        "sort": "desc",
    })

    return [
        Transaction(
            hash=tx["hash"],
            block_number=int(tx["blockNumber"]),
            timestamp=int(tx["timeStamp"]),
            from_address=tx["from"],
            to_address=tx.get("to") or None,
            value=tx["value"],
            asset="ETH",
            transaction_type="normal",
            is_error=tx.get("isError") == "1",
        )
        for tx in result
    ]


async def get_internal_transactions(
    address: str,
    page: int = 1,
    offset: int = 20,
) -> list[Transaction]:

    result = await _etherscan_request({
        "module": "account",
        "action": "txlistinternal",
        "address": address,
        "startblock": 0,
        "endblock": 999999999,
        "page": page,
        "offset": offset,
        "sort": "desc",
    })

    return [
        Transaction(
            hash=tx["hash"],
            block_number=int(tx["blockNumber"]),
            timestamp=int(tx["timeStamp"]),
            from_address=tx["from"],
            to_address=tx.get("to") or None,
            value=tx["value"],
            asset="ETH",
            transaction_type="internal",
            is_error=tx.get("isError") == "1",
        )
        for tx in result
    ]


async def get_erc20_transfers(
    address: str,
    page: int = 1,
    offset: int = 20,
) -> list[Transaction]:

    result = await _etherscan_request({
        "module": "account",
        "action": "tokentx",
        "address": address,
        "startblock": 0,
        "endblock": 999999999,
        "page": page,
        "offset": offset,
        "sort": "desc",
    })

    return [
        Transaction(
            hash=tx["hash"],
            block_number=int(tx["blockNumber"]),
            timestamp=int(tx["timeStamp"]),
            from_address=tx["from"],
            to_address=tx.get("to") or None,
            value=tx["value"],
            asset=tx.get("tokenSymbol") or "ERC20",
            transaction_type="erc20",
            token_contract=tx.get("contractAddress"),
            token_symbol=tx.get("tokenSymbol"),
            is_error=False,
        )
        for tx in result
    ]


async def get_transactions(
    address: str,
    page: int = 1,
    offset: int = 20,
) -> list[Transaction]:

    normal = await get_normal_transactions(
        address,
        page,
        offset,
    )

    internal = await get_internal_transactions(
        address,
        page,
        offset,
    )

    erc20 = await get_erc20_transfers(
        address,
        page,
        offset,
    )

    all_transactions = normal + internal + erc20

    unique_transactions = {}

    for tx in all_transactions:
        key = (
            tx.hash.lower(),
            tx.from_address.lower(),
            (tx.to_address or "").lower(),
            tx.transaction_type,
            (tx.token_contract or "").lower(),
        )

        unique_transactions[key] = tx

    # Stable ordering: newest block first.
    return sorted(
        unique_transactions.values(),
        key=lambda tx: tx.timestamp,
        reverse=True,
    )