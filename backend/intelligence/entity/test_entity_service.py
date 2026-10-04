from intelligence.entity.entity_service import enrich_wallet


def main():

    wallet = {
        "address": (
            "0x42b86A269fb3d5368D880c519BadABa77eC00130"
        ),
        "hop": 1,
        "transaction_count": 10,
        "transactions": [],
    }

    result = enrich_wallet(wallet)

    print("Enriched wallet:")
    print(result)


if __name__ == "__main__":
    main()