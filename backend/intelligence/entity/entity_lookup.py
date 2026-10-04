from pathlib import Path

import yaml


BASE_DIR = Path(__file__).resolve().parents[2]

TAGPACK_DIR = (
    BASE_DIR
    / "data"
    / "graphsense-tagpacks"
    / "packs"
)


def _normalize_address(address: str) -> str:
    return address.strip().lower()


def _is_ethereum_address(address: str) -> bool:
    return (
        isinstance(address, str)
        and len(address) == 42
        and address.startswith("0x")
    )


def _load_exchange_tagpacks() -> dict[str, dict]:
    entity_index = {}

    if not TAGPACK_DIR.exists():
        raise FileNotFoundError(
            f"GraphSense TagPacks directory not found: "
            f"{TAGPACK_DIR}"
        )

    pack_files = sorted(
        TAGPACK_DIR.glob("exchange-wallets-*.yaml")
    )

    for pack_file in pack_files:

        with pack_file.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = yaml.safe_load(file) or {}

        category = data.get("category")
        label = data.get("label")
        actor = data.get("actor")
        source = data.get("source")
        confidence = data.get("confidence")

        if category != "exchange":
            continue

        tags = data.get("tags", [])

        for tag in tags:

            address = tag.get("address")
            currency = tag.get("currency")

            if not address:
                continue

            if currency != "ETH":
                continue

            if not _is_ethereum_address(address):
                continue

            normalized_address = _normalize_address(
                address
            )

            entity_index[normalized_address] = {
                "entity_name": actor,
                "name_tag": label,
                "label_category": category,
                "currency": currency,
                "source": source,
                "confidence": confidence,
                "tagpack": pack_file.name,
            }

    return entity_index


ENTITY_INDEX = _load_exchange_tagpacks()


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
            "currency": None,
            "source": None,
            "confidence": None,
            "tagpack": None,
            "known": False,
        }

    return {
        **result,
        "known": True,
    }