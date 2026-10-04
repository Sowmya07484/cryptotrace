from collections import defaultdict

from intelligence.asset_utils import normalize_asset


def analyze_wallet_behavior(
    wallets: list[dict],
    transactions: list[dict],
    edges: list[dict],
    behavioral_analysis: dict,
    entity_analysis: dict,
) -> dict:
    """
    Build descriptive behavioral profiles for every traced wallet.

    This layer does not assign a fraud verdict or risk score.
    It only summarizes observable behavior from the
    real investigation data.
    """

    incoming_transactions = defaultdict(int)
    outgoing_transactions = defaultdict(int)

    incoming_counterparties = defaultdict(set)
    outgoing_counterparties = defaultdict(set)

    wallet_assets = defaultdict(set)

    wallet_timestamps = defaultdict(list)

    for transaction in transactions:

        source = transaction.get("from_address")
        destination = transaction.get("to_address")

        timestamp = transaction.get("timestamp")

        asset = normalize_asset(
            transaction.get("asset")
        )

        if source and destination:

            source_key = source.lower()
            destination_key = destination.lower()

            if source_key != destination_key:

                outgoing_transactions[
                    source_key
                ] += 1

                incoming_transactions[
                    destination_key
                ] += 1

                outgoing_counterparties[
                    source_key
                ].add(destination_key)

                incoming_counterparties[
                    destination_key
                ].add(source_key)

                if asset:
                    wallet_assets[
                        source_key
                    ].add(asset)

                    wallet_assets[
                        destination_key
                    ].add(asset)

                if timestamp is not None:

                    wallet_timestamps[
                        source_key
                    ].append(timestamp)

                    wallet_timestamps[
                        destination_key
                    ].append(timestamp)

    # Map wallet addresses to their original casing.
    wallet_map = {}

    for wallet in wallets:

        address = wallet.get("address")

        if address:
            wallet_map[
                address.lower()
            ] = address

    # Convert behavioral indicators into wallet-level sets.
    indicator_map = defaultdict(set)

    for indicator in behavioral_analysis.get(
        "indicators",
        [],
    ):

        wallet = indicator.get("wallet")

        indicator_type = indicator.get("type")

        if not wallet or not indicator_type:
            continue

        indicator_map[
            wallet.lower()
        ].add(indicator_type)

    # Entity information generated in Task 6.
    entity_map = {}

    for profile in entity_analysis.get(
        "wallet_profiles",
        [],
    ):

        wallet = profile.get("wallet")

        if wallet:

            entity_map[
                wallet.lower()
            ] = profile

    wallet_profiles = []

    for wallet in wallets:

        address = wallet.get("address")

        if not address:
            continue

        wallet_key = address.lower()

        incoming_count = incoming_transactions.get(
            wallet_key,
            0,
        )

        outgoing_count = outgoing_transactions.get(
            wallet_key,
            0,
        )

        total_activity = (
            incoming_count
            + outgoing_count
        )

        unique_counterparties = (
            incoming_counterparties.get(
                wallet_key,
                set(),
            )
            |
            outgoing_counterparties.get(
                wallet_key,
                set(),
            )
        )

        asset_set = wallet_assets.get(
            wallet_key,
            set(),
        )

        # Activity direction classification.
        if total_activity == 0:

            activity_direction = "inactive"

        elif outgoing_count > incoming_count:

            activity_direction = "mostly_outgoing"

        elif incoming_count > outgoing_count:

            activity_direction = "mostly_incoming"

        else:

            activity_direction = "balanced"

        # Incoming/outgoing proportions.
        if total_activity > 0:

            incoming_ratio = (
                incoming_count
                / total_activity
            )

            outgoing_ratio = (
                outgoing_count
                / total_activity
            )

        else:

            incoming_ratio = 0.0
            outgoing_ratio = 0.0

        timestamps = wallet_timestamps.get(
            wallet_key,
            [],
        )

        if len(timestamps) >= 2:

            earliest_timestamp = min(
                timestamps
            )

            latest_timestamp = max(
                timestamps
            )

            active_period_seconds = (
                latest_timestamp
                - earliest_timestamp
            )

        else:

            active_period_seconds = 0

        entity_profile = entity_map.get(
            wallet_key,
            {},
        )

        entity = entity_profile.get(
            "entity",
            {},
        )

        wallet_profile = {
            "wallet": address,
            "hop": wallet.get("hop"),
            "transaction_count": wallet.get(
                "transaction_count",
                0,
            ),
            "behavior": {
                "incoming_transaction_count": (
                    incoming_count
                ),
                "outgoing_transaction_count": (
                    outgoing_count
                ),
                "total_activity": (
                    total_activity
                ),
                "incoming_ratio": round(
                    incoming_ratio,
                    4,
                ),
                "outgoing_ratio": round(
                    outgoing_ratio,
                    4,
                ),
                "activity_direction": (
                    activity_direction
                ),
                "unique_counterparties": len(
                    unique_counterparties
                ),
                "assets": sorted(
                    asset_set
                ),
                "asset_count": len(
                    asset_set
                ),
                "active_period_seconds": (
                    active_period_seconds
                ),
                "behavioral_indicators": sorted(
                    indicator_map.get(
                        wallet_key,
                        set(),
                    )
                ),
            },
            "entity": {
                "known": entity.get(
                    "known",
                    False,
                ),
                "entity_name": entity.get(
                    "entity_name"
                ),
                "name_tag": entity.get(
                    "name_tag"
                ),
                "label_category": entity.get(
                    "label_category"
                ),
            },
        }

        wallet_profiles.append(
            wallet_profile
        )

    # Overall behavioral summary.
    mostly_incoming = sum(
        1
        for profile in wallet_profiles
        if profile["behavior"][
            "activity_direction"
        ] == "mostly_incoming"
    )

    mostly_outgoing = sum(
        1
        for profile in wallet_profiles
        if profile["behavior"][
            "activity_direction"
        ] == "mostly_outgoing"
    )

    balanced = sum(
        1
        for profile in wallet_profiles
        if profile["behavior"][
            "activity_direction"
        ] == "balanced"
    )

    inactive = sum(
        1
        for profile in wallet_profiles
        if profile["behavior"][
            "activity_direction"
        ] == "inactive"
    )

    return {
        "wallet_profiles": wallet_profiles,
        "summary": {
            "wallets_analyzed": len(
                wallet_profiles
            ),
            "mostly_incoming": mostly_incoming,
            "mostly_outgoing": mostly_outgoing,
            "balanced": balanced,
            "inactive": inactive,
            "transactions_analyzed": len(
                transactions
            ),
            "edges_analyzed": len(
                edges
            ),
            "behavioral_indicators": len(
                behavioral_analysis.get(
                    "indicators",
                    [],
                )
            ),
        },
    }