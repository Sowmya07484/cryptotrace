from collections import defaultdict

from intelligence.asset_utils import normalize_asset


def analyze_entities(
    wallets: list[dict],
    transactions: list[dict],
    edges: list[dict],
) -> dict:
    """
    Build descriptive entity and activity information
    for every wallet in the traced investigation.

    This layer does not assign risk or fraud labels.
    Entity information comes from the GraphSense lookup
    already attached to each wallet.

    Raw transaction data is not modified.
    Asset normalization is used only for analytics.
    """

    wallet_transactions = defaultdict(list)

    for transaction in transactions:

        source = transaction.get("from_address")
        destination = transaction.get("to_address")

        if source:
            wallet_transactions[
                source.lower()
            ].append(transaction)

        if destination:
            wallet_transactions[
                destination.lower()
            ].append(transaction)

    incoming = defaultdict(set)
    outgoing = defaultdict(set)

    assets = defaultdict(set)

    for edge in edges:

        source = edge.get("from")
        destination = edge.get("to")

        asset = normalize_asset(
            edge.get("asset")
        )

        if not source or not destination:
            continue

        source_key = source.lower()
        destination_key = destination.lower()

        # Ignore self relationships for behavioral metrics.
        if source_key == destination_key:
            continue

        incoming[destination_key].add(source_key)
        outgoing[source_key].add(destination_key)

        if asset:
            assets[source_key].add(asset)
            assets[destination_key].add(asset)

    wallet_profiles = []

    known_wallets = 0
    unknown_wallets = 0

    for wallet in wallets:

        address = wallet.get("address")

        if not address:
            continue

        wallet_key = address.lower()

        entity = wallet.get("entity") or {}

        known = entity.get("known", False)

        if known:
            known_wallets += 1
        else:
            unknown_wallets += 1

        wallet_profile = {
            "wallet": address,
            "hop": wallet.get("hop"),
            "transaction_count": wallet.get(
                "transaction_count",
                0,
            ),
            "entity": {
                "known": known,
                "entity_name": entity.get(
                    "entity_name"
                ),
                "name_tag": entity.get(
                    "name_tag"
                ),
                "label_category": entity.get(
                    "label_category"
                ),
                "source": entity.get(
                    "source"
                ),
                "confidence": entity.get(
                    "confidence"
                ),
                "tagpack": entity.get(
                    "tagpack"
                ),
            },
            "activity": {
                "incoming_wallets": len(
                    incoming.get(
                        wallet_key,
                        set(),
                    )
                ),
                "outgoing_wallets": len(
                    outgoing.get(
                        wallet_key,
                        set(),
                    )
                ),
                "unique_counterparties": len(
                    incoming.get(
                        wallet_key,
                        set(),
                    )
                    |
                    outgoing.get(
                        wallet_key,
                        set(),
                    )
                ),
                "assets": sorted(
                    assets.get(
                        wallet_key,
                        set(),
                    )
                ),
                "asset_count": len(
                    assets.get(
                        wallet_key,
                        set(),
                    )
                ),
            },
        }

        wallet_profiles.append(
            wallet_profile
        )

    return {
        "wallet_profiles": wallet_profiles,
        "summary": {
            "wallets_analyzed": len(
                wallet_profiles
            ),
            "known_wallets": known_wallets,
            "unknown_wallets": unknown_wallets,
            "transactions_analyzed": len(
                transactions
            ),
            "edges_analyzed": len(edges),
        },
    }