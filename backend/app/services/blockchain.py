import asyncio

import httpx

from app.config import ETHERSCAN_API_KEY
from app.models.transaction import Transaction


ETHERSCAN_URL = "https://api.etherscan.io/v2/api"
ETHEREUM_CHAIN_ID = "1"


async def _etherscan_request(params: dict):
    params["chainid"] = ETHEREUM_CHAIN_ID
    params["apikey"] = ETHERSCAN_API_KEY

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            ETHERSCAN_URL,
            params=params,
        )

        response.raise_for_status()

        data = response.json()

    if (
        data.get("message") == "No transactions found"
        or data.get("result") == "No transactions found"
        or data.get("result") == []
    ):
        return []

    if data.get("status") != "1":
        raise RuntimeError(
            f"Etherscan error: "
            f"{data.get('message')} | {data.get('result')}"
        )

    return data["result"]


async def get_normal_transactions(
    address: str,
    page: int = 1,
    offset: int = 20,
) -> list[Transaction]:

    result = await _etherscan_request(
        {
            "module": "account",
            "action": "txlist",
            "address": address,
            "startblock": 0,
            "endblock": 99999999,
            "page": page,
            "offset": offset,
            "sort": "desc",
        }
    )

    transactions = []

    for tx in result:
        transactions.append(
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
        )

    return transactions


async def get_internal_transactions(
    address: str,
    page: int = 1,
    offset: int = 20,
) -> list[Transaction]:

    result = await _etherscan_request(
        {
            "module": "account",
            "action": "txlistinternal",
            "address": address,
            "startblock": 0,
            "endblock": 99999999,
            "page": page,
            "offset": offset,
            "sort": "desc",
        }
    )

    transactions = []

    for tx in result:
        transactions.append(
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
        )

    return transactions


async def get_erc20_transfers(
    address: str,
    page: int = 1,
    offset: int = 20,
) -> list[Transaction]:

    result = await _etherscan_request(
        {
            "module": "account",
            "action": "tokentx",
            "address": address,
            "startblock": 0,
            "endblock": 999999999,
            "page": page,
            "offset": offset,
            "sort": "desc",
        }
    )

    transactions = []

    for tx in result:
        transactions.append(
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
        )

    return transactions


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

    await asyncio.sleep(0.5)

    internal = await get_internal_transactions(
        address,
        page,
        offset,
    )

    await asyncio.sleep(0.5)

    erc20 = await get_erc20_transfers(
        address,
        page,
        offset,
    )

    all_transactions = normal + internal + erc20

    unique_transactions = {}

    for tx in all_transactions:
        key = (
            tx.hash,
            tx.from_address.lower(),
            (tx.to_address or "").lower(),
            tx.transaction_type,
            tx.token_contract or "",
        )

        unique_transactions[key] = tx

    return list(unique_transactions.values())