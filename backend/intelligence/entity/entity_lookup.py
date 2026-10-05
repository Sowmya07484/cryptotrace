from pathlib import Path
import csv


BASE_DIR = Path(__file__).resolve().parents[2]

ACCOUNTS_FILE = (
    BASE_DIR
    / "data"
    / "eth-labels"
    / "data"
    / "csv"
    / "accounts.csv"
)


def _normalize_address(address: str) -> str:
    return address.strip().lower()


def _is_ethereum_address(address: str) -> bool:
    return (
        isinstance(address, str)
        and len(address) == 42
        and address.startswith("0x")
    )


def _load_entity_labels() -> dict[str, dict]:
    entity_index = {}

    if not ACCOUNTS_FILE.exists():
        raise FileNotFoundError(
            f"eth-labels accounts.csv not found: {ACCOUNTS_FILE}"
        )

    with ACCOUNTS_FILE.open(
        "r",
        encoding="utf-8",
        newline="",
    ) as file:
        reader = csv.DictReader(file)

        for row in reader:
            address = row.get("address")
            chain_id = row.get("chainId")
            label = row.get("label")
            name_tag = row.get("nameTag")

            if not address:
                continue

            if chain_id != "1":
                continue

            if not _is_ethereum_address(address):
                continue

            normalized_address = _normalize_address(address)

            entity_index[normalized_address] = {
                "entity_name": name_tag or label,
                "name_tag": name_tag,
                "label_category": label,
                "currency": "ETH",
                "source": "eth-labels",
                "confidence": "known",
                "tagpack": "accounts.csv",
            }

    return entity_index


ENTITY_INDEX = _load_entity_labels()


def lookup_entity(address: str) -> dict:
    if not address:
        return {
            "entity_name": None,
            "name_tag": None,
            "label_category": None,
            "currency": None,
            "source": None,
            "confidence": None,
            "tagpack": None,
            "known": False,
        }

    normalized_address = _normalize_address(address)

    result = ENTITY_INDEX.get(normalized_address)

    if result is None:
        return {
            "entity_name": None,
            "name_tag": None,
            "label_category": None,
            "currency": "ETH",
            "source": "eth-labels",
            "confidence": None,
            "tagpack": None,
            "known": False,
        }

    return {
        **result,
        "known": True,
    }