import csv
from pathlib import Path


ENTITY_DATASET = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "eth-labels"
    / "data"
    / "csv"
    / "accounts.csv"
)


def load_entity_labels():
    entities = {}

    if not ENTITY_DATASET.exists():
        raise FileNotFoundError(
            f"Entity dataset not found: {ENTITY_DATASET}"
        )

    with ENTITY_DATASET.open(
        "r",
        encoding="utf-8",
        newline="",
    ) as file:

        reader = csv.DictReader(file)

        for row in reader:
            address = (
                row.get("address") or ""
            ).strip().lower()

            if not address:
                continue

            # We only need Ethereum records
            if row.get("chainId") != "1":
                continue

            entities[address] = {
                "entity_name": row.get("label") or None,
                "name_tag": row.get("nameTag") or None,
                "chain_id": 1,
                "source": "eth-labels",
            }

    return entities


ENTITY_LABELS = load_entity_labels()


def identify_entity(address: str):
    address_key = (
        address.strip().lower()
    )

    entity = ENTITY_LABELS.get(
        address_key
    )

    if entity is None:
        return {
            "entity_name": None,
            "name_tag": None,
            "chain_id": 1,
            "source": None,
        }

    return entity
