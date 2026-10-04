from intelligence.behavioral_analysis import analyze_behavior


wallets = [
    {
        "address": "0xAAAA",
        "hop": 0,
        "transaction_count": 1,
        "transactions": [],
    },
    {
        "address": "0xBBBB",
        "hop": 1,
        "transaction_count": 3,
        "transactions": [],
    },
    {
        "address": "0xCCCC",
        "hop": 2,
        "transaction_count": 1,
        "transactions": [],
    },
    {
        "address": "0xDDDD",
        "hop": 2,
        "transaction_count": 1,
        "transactions": [],
    },
    {
        "address": "0xEEEE",
        "hop": 2,
        "transaction_count": 1,
        "transactions": [],
    },
]


transactions = [
    {
        "hash": "tx1",
        "timestamp": 1000,
        "from_address": "0xAAAA",
        "to_address": "0xBBBB",
        "value": "100",
        "asset": "ETH",
        "transaction_type": "normal",
    },
    {
        "hash": "tx2",
        "timestamp": 1001,
        "from_address": "0xBBBB",
        "to_address": "0xCCCC",
        "value": "30",
        "asset": "ETH",
        "transaction_type": "normal",
    },
    {
        "hash": "tx3",
        "timestamp": 1002,
        "from_address": "0xBBBB",
        "to_address": "0xDDDD",
        "value": "30",
        "asset": "ETH",
        "transaction_type": "normal",
    },
    {
        "hash": "tx4",
        "timestamp": 1003,
        "from_address": "0xBBBB",
        "to_address": "0xEEEE",
        "value": "40",
        "asset": "ETH",
        "transaction_type": "normal",
    },
]


edges = [
    {
        "from": "0xAAAA",
        "to": "0xBBBB",
        "transaction_hash": "tx1",
        "asset": "ETH",
        "value": "100",
        "transaction_type": "normal",
        "hop": 1,
    },
    {
        "from": "0xBBBB",
        "to": "0xCCCC",
        "transaction_hash": "tx2",
        "asset": "ETH",
        "value": "30",
        "transaction_type": "normal",
        "hop": 2,
    },
    {
        "from": "0xBBBB",
        "to": "0xDDDD",
        "transaction_hash": "tx3",
        "asset": "ETH",
        "value": "30",
        "transaction_type": "normal",
        "hop": 2,
    },
    {
        "from": "0xBBBB",
        "to": "0xEEEE",
        "transaction_hash": "tx4",
        "asset": "ETH",
        "value": "40",
        "transaction_type": "normal",
        "hop": 2,
    },
]


result = analyze_behavior(
    wallets=wallets,
    transactions=transactions,
    edges=edges,
)


print(result)