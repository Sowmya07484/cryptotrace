from intelligence.entity.entity_analysis import analyze_entities


def main():

    wallets = [
        {
            "address": (
                "0x1111111111111111111111111111111111111111"
            ),
            "hop": 0,
            "transaction_count": 2,
            "entity": {
                "entity_name": "test_entity",
                "name_tag": "test wallet",
                "label_category": "exchange",
                "source": "test",
                "confidence": "test",
                "tagpack": "test.yaml",
                "known": True,
            },
        },
        {
            "address": (
                "0x2222222222222222222222222222222222222222"
            ),
            "hop": 1,
            "transaction_count": 1,
            "entity": {
                "entity_name": None,
                "name_tag": None,
                "label_category": None,
                "source": None,
                "confidence": None,
                "tagpack": None,
                "known": False,
            },
        },
    ]

    transactions = [
        {
            "hash": "0xabc",
            "from_address": (
                "0x1111111111111111111111111111111111111111"
            ),
            "to_address": (
                "0x2222222222222222222222222222222222222222"
            ),
            "value": "100",
            "asset": "ETH",
        }
    ]

    edges = [
        {
            "from": (
                "0x1111111111111111111111111111111111111111"
            ),
            "to": (
                "0x2222222222222222222222222222222222222222"
            ),
            "asset": "ETH",
        }
    ]

    result = analyze_entities(
        wallets=wallets,
        transactions=transactions,
        edges=edges,
    )

    print("=== ENTITY ANALYSIS ===")
    print(result)


if __name__ == "__main__":
    main()