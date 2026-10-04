def build_risk_factors(
    wallet_behavior: dict,
    behavioral_analysis: dict,
    entity_analysis: dict,
) -> dict:
    """
    Build explainable risk factors for every traced wallet.

    This layer only identifies measurable indicators.
    It does not assign a risk score or fraud verdict.
    """

    indicator_map = {}

    for indicator in behavioral_analysis.get(
        "indicators",
        [],
    ):

        wallet = indicator.get("wallet")

        if not wallet:
            continue

        wallet_key = wallet.lower()

        if wallet_key not in indicator_map:
            indicator_map[wallet_key] = []

        indicator_map[wallet_key].append(
            indicator
        )

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

    wallet_factors = []

    for profile in wallet_behavior.get(
        "wallet_profiles",
        [],
    ):

        wallet = profile.get("wallet")

        if not wallet:
            continue

        wallet_key = wallet.lower()

        behavior = profile.get(
            "behavior",
            {},
        )

        factors = []

        incoming_count = behavior.get(
            "incoming_transaction_count",
            0,
        )

        outgoing_count = behavior.get(
            "outgoing_transaction_count",
            0,
        )

        total_activity = behavior.get(
            "total_activity",
            0,
        )

        incoming_ratio = behavior.get(
            "incoming_ratio",
            0.0,
        )

        outgoing_ratio = behavior.get(
            "outgoing_ratio",
            0.0,
        )

        unique_counterparties = behavior.get(
            "unique_counterparties",
            0,
        )

        asset_count = behavior.get(
            "asset_count",
            0,
        )

        transaction_count = profile.get(
            "transaction_count",
            0,
        )

        # -------------------------------------------------
        # Factor 1: High transaction activity
        # -------------------------------------------------

        if transaction_count >= 50:

            factors.append(
                {
                    "name": "high_transaction_activity",
                    "value": transaction_count,
                    "explanation": (
                        "The wallet has a high number "
                        "of observed transactions in "
                        "the traced investigation data."
                    ),
                }
            )

        # -------------------------------------------------
        # Factor 2: Outgoing dominance
        # -------------------------------------------------

        if outgoing_ratio >= 0.70:

            factors.append(
                {
                    "name": "outgoing_dominance",
                    "value": outgoing_ratio,
                    "explanation": (
                        "Outgoing transactions account "
                        "for a substantial majority of "
                        "the wallet's observed activity."
                    ),
                }
            )

        # -------------------------------------------------
        # Factor 3: Incoming dominance
        # -------------------------------------------------

        if incoming_ratio >= 0.70:

            factors.append(
                {
                    "name": "incoming_dominance",
                    "value": incoming_ratio,
                    "explanation": (
                        "Incoming transactions account "
                        "for a substantial majority of "
                        "the wallet's observed activity."
                    ),
                }
            )

        # -------------------------------------------------
        # Factor 4: High counterparty count
        # -------------------------------------------------

        if unique_counterparties >= 10:

            factors.append(
                {
                    "name": "high_counterparty_count",
                    "value": unique_counterparties,
                    "explanation": (
                        "The wallet interacts with a "
                        "relatively large number of "
                        "distinct counterparties in "
                        "the observed transaction data."
                    ),
                }
            )

        # -------------------------------------------------
        # Factor 5: Asset diversity
        # -------------------------------------------------

        if asset_count >= 5:

            factors.append(
                {
                    "name": "high_asset_diversity",
                    "value": asset_count,
                    "explanation": (
                        "The wallet is associated with "
                        "multiple distinct asset symbols "
                        "in the observed transaction data."
                    ),
                }
            )

        # -------------------------------------------------
        # Factor 6: Behavioral indicators
        # -------------------------------------------------

        wallet_indicators = indicator_map.get(
            wallet_key,
            [],
        )

        indicator_types = sorted(
            {
                indicator.get("type")
                for indicator in wallet_indicators
                if indicator.get("type")
            }
        )

        if "fan_in" in indicator_types:

            fan_in_indicator = next(
                (
                    indicator
                    for indicator in wallet_indicators
                    if indicator.get("type")
                    == "fan_in"
                ),
                None,
            )

            factors.append(
                {
                    "name": "fan_in",
                    "value": (
                        fan_in_indicator.get(
                            "count",
                            0,
                        )
                        if fan_in_indicator
                        else 0
                    ),
                    "explanation": (
                        "The wallet receives transfers "
                        "from multiple distinct wallets "
                        "within the traced graph."
                    ),
                }
            )

        if "fan_out" in indicator_types:

            fan_out_indicator = next(
                (
                    indicator
                    for indicator in wallet_indicators
                    if indicator.get("type")
                    == "fan_out"
                ),
                None,
            )

            factors.append(
                {
                    "name": "fan_out",
                    "value": (
                        fan_out_indicator.get(
                            "count",
                            0,
                        )
                        if fan_out_indicator
                        else 0
                    ),
                    "explanation": (
                        "The wallet sends transfers "
                        "to multiple distinct wallets "
                        "within the traced graph."
                    ),
                }
            )

        if "intermediary" in indicator_types:

            intermediary_indicator = next(
                (
                    indicator
                    for indicator in wallet_indicators
                    if indicator.get("type")
                    == "intermediary"
                ),
                None,
            )

            factors.append(
                {
                    "name": "intermediary_behavior",
                    "value": {
                        "incoming_count": (
                            intermediary_indicator.get(
                                "incoming_count",
                                0,
                            )
                            if intermediary_indicator
                            else 0
                        ),
                        "outgoing_count": (
                            intermediary_indicator.get(
                                "outgoing_count",
                                0,
                            )
                            if intermediary_indicator
                            else 0
                        ),
                    },
                    "explanation": (
                        "The wallet has both incoming "
                        "and outgoing relationships "
                        "within the traced graph."
                    ),
                }
            )

        # -------------------------------------------------
        # Factor 7: Known / unknown entity
        # -------------------------------------------------

        entity_profile = entity_map.get(
            wallet_key,
            {},
        )

        entity = entity_profile.get(
            "entity",
            {},
        )

        if entity.get("known"):

            factors.append(
                {
                    "name": "known_entity",
                    "value": entity.get(
                        "entity_name"
                    ),
                    "explanation": (
                        "The wallet has a matching "
                        "entity label in the configured "
                        "GraphSense TagPack dataset."
                    ),
                }
            )

        else:

            factors.append(
                {
                    "name": "unknown_entity",
                    "value": True,
                    "explanation": (
                        "No matching entity label was "
                        "found in the configured "
                        "GraphSense TagPack dataset."
                    ),
                }
            )

        wallet_factors.append(
            {
                "wallet": wallet,
                "factors": factors,
                "indicator_values": {
                    "transaction_count": transaction_count,
                    "incoming_transaction_count": (
                        incoming_count
                    ),
                    "outgoing_transaction_count": (
                        outgoing_count
                    ),
                    "incoming_ratio": incoming_ratio,
                    "outgoing_ratio": outgoing_ratio,
                    "unique_counterparties": (
                        unique_counterparties
                    ),
                    "asset_count": asset_count,
                    "activity_direction": behavior.get(
                        "activity_direction"
                    ),
                    "hop": profile.get("hop"),
                },
            }
        )

    return {
        "wallet_factors": wallet_factors,
        "summary": {
            "wallets_analyzed": len(
                wallet_factors
            ),
            "factors_generated": sum(
                len(profile["factors"])
                for profile in wallet_factors
            ),
        },
    }