def _add_factor(
    factors: list,
    name: str,
    value,
    contribution: float,
    explanation: str,
):
    """
    Add one explainable scoring factor.

    Contribution is the amount added to the
    wallet's analytical risk score.
    """

    if contribution <= 0:
        return

    factors.append(
        {
            "name": name,
            "value": value,
            "contribution": round(
                contribution,
                2,
            ),
            "explanation": explanation,
        }
    )


def calculate_wallet_risk(
    wallet_factor_profile: dict,
) -> dict:
    """
    Calculate a deterministic wallet-level
    analytical risk score.

    The score uses observable indicators
    from the previous intelligence layers.

    It is not a probability and does not
    determine that a wallet is fraudulent.
    """

    factors = []

    indicator_values = wallet_factor_profile.get(
        "indicator_values",
        {},
    )

    observed_factors = {
        factor.get("name"): factor
        for factor in wallet_factor_profile.get(
            "factors",
            [],
        )
    }

    # 1. Transaction activity — maximum 10
    transaction_count = indicator_values.get(
        "transaction_count",
        0,
    )

    transaction_contribution = min(
        (transaction_count / 50) * 10,
        10,
    )

    if transaction_count >= 50:
        _add_factor(
            factors=factors,
            name="high_transaction_activity",
            value=transaction_count,
            contribution=transaction_contribution,
            explanation=(
                f"The wallet has {transaction_count} "
                "observed transactions in the "
                "investigation data."
            ),
        )

    # 2. Counterparty activity — maximum 10
    counterparty_count = indicator_values.get(
        "unique_counterparties",
        0,
    )

    counterparty_contribution = min(
        (counterparty_count / 20) * 10,
        10,
    )

    if counterparty_count >= 10:
        _add_factor(
            factors=factors,
            name="high_counterparty_count",
            value=counterparty_count,
            contribution=counterparty_contribution,
            explanation=(
                f"The wallet interacts with "
                f"{counterparty_count} distinct "
                "counterparties in the observed "
                "transaction data."
            ),
        )

    # 3. Asset diversity is retained as descriptive
    # information but does NOT increase the score.
    asset_count = indicator_values.get(
        "asset_count",
        0,
    )

    if asset_count >= 5:
        factors.append(
            {
                "name": "high_asset_diversity",
                "value": asset_count,
                "contribution": 0,
                "explanation": (
                    f"The wallet is associated with "
                    f"{asset_count} distinct asset symbols "
                    "in the observed data. Asset diversity "
                    "is shown as contextual information and "
                    "is not treated as evidence of fraud."
                ),
            }
        )

    # 4. Outgoing dominance — maximum 15
    outgoing_ratio = indicator_values.get(
        "outgoing_ratio",
        0.0,
    )

    if outgoing_ratio >= 0.70:

        outgoing_contribution = min(
            outgoing_ratio * 15,
            15,
        )

        _add_factor(
            factors=factors,
            name="outgoing_dominance",
            value=outgoing_ratio,
            contribution=outgoing_contribution,
            explanation=(
                f"Outgoing transactions account for "
                f"{outgoing_ratio * 100:.2f}% of the "
                "wallet's observed activity."
            ),
        )

    # 5. Incoming dominance — maximum 5
    incoming_ratio = indicator_values.get(
        "incoming_ratio",
        0.0,
    )

    if incoming_ratio >= 0.70:

        incoming_contribution = min(
            incoming_ratio * 5,
            5,
        )

        _add_factor(
            factors=factors,
            name="incoming_dominance",
            value=incoming_ratio,
            contribution=incoming_contribution,
            explanation=(
                f"Incoming transactions account for "
                f"{incoming_ratio * 100:.2f}% of the "
                "wallet's observed activity."
            ),
        )

    # 6. Fan-in — maximum 10
    fan_in_factor = observed_factors.get(
        "fan_in"
    )

    if fan_in_factor:

        fan_in_count = fan_in_factor.get(
            "value",
            0,
        )

        fan_in_contribution = min(
            fan_in_count * 3,
            10,
        )

        _add_factor(
            factors=factors,
            name="fan_in",
            value=fan_in_count,
            contribution=fan_in_contribution,
            explanation=(
                f"The traced graph shows incoming "
                f"relationships from {fan_in_count} "
                "distinct wallets."
            ),
        )

    # 7. Fan-out — maximum 10
    fan_out_factor = observed_factors.get(
        "fan_out"
    )

    if fan_out_factor:

        fan_out_count = fan_out_factor.get(
            "value",
            0,
        )

        fan_out_contribution = min(
            fan_out_count * 3,
            10,
        )

        _add_factor(
            factors=factors,
            name="fan_out",
            value=fan_out_count,
            contribution=fan_out_contribution,
            explanation=(
                f"The traced graph shows outgoing "
                f"relationships to {fan_out_count} "
                "distinct wallets."
            ),
        )

    # 8. Intermediary behavior — maximum 10
    intermediary_factor = observed_factors.get(
        "intermediary_behavior"
    )

    if intermediary_factor:

        intermediary_value = intermediary_factor.get(
            "value",
            {},
        )

        incoming_count = intermediary_value.get(
            "incoming_count",
            0,
        )

        outgoing_count = intermediary_value.get(
            "outgoing_count",
            0,
        )

        intermediary_contribution = min(
            (
                incoming_count
                + outgoing_count
            ) * 2,
            10,
        )

        _add_factor(
            factors=factors,
            name="intermediary_behavior",
            value={
                "incoming_count": incoming_count,
                "outgoing_count": outgoing_count,
            },
            contribution=intermediary_contribution,
            explanation=(
                "The wallet has both incoming and "
                "outgoing relationships within the "
                "traced graph."
            ),
        )

    # 9. Known entity is contextual only.
    # Unknown entity does not increase the score.
    known_entity_factor = observed_factors.get(
        "known_entity"
    )

    if known_entity_factor:

        factors.append(
            {
                "name": "known_entity_interaction",
                "value": known_entity_factor.get(
                    "value"
                ),
                "contribution": 0,
                "explanation": (
                    "The wallet has a known entity "
                    "label. Entity identification alone "
                    "does not increase the analytical "
                    "risk score."
                ),
            }
        )

    raw_score = sum(
        factor["contribution"]
        for factor in factors
    )

    # Maximum score from factors that can actually
    # contribute to the analytical score.
    maximum_score = 80.0

    normalized_score = (
        raw_score
        / maximum_score
    ) * 100

    normalized_score = min(
        max(normalized_score, 0.0),
        100.0,
    )

    normalized_score = round(
        normalized_score,
        2,
    )

    if normalized_score >= 70:
        risk_level = "high"
    elif normalized_score >= 40:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "risk_score": normalized_score,
        "risk_level": risk_level,
        "factors": factors,
        "raw_score": round(
            raw_score,
            2,
        ),
    }


def calculate_wallet_risks(
    risk_factors: dict,
) -> dict:
    """
    Calculate risk information for every
    traced wallet.
    """

    wallet_risks = []

    for wallet_profile in risk_factors.get(
        "wallet_factors",
        [],
    ):

        wallet = wallet_profile.get(
            "wallet"
        )

        if not wallet:
            continue

        wallet_risk = calculate_wallet_risk(
            wallet_profile
        )

        wallet_risks.append(
            {
                "wallet": wallet,
                **wallet_risk,
            }
        )

    # Highest analytical risk score first.
    wallet_risks.sort(
        key=lambda item: item["risk_score"],
        reverse=True,
    )

    high_count = sum(
        1
        for wallet in wallet_risks
        if wallet["risk_level"] == "high"
    )

    medium_count = sum(
        1
        for wallet in wallet_risks
        if wallet["risk_level"] == "medium"
    )

    low_count = sum(
        1
        for wallet in wallet_risks
        if wallet["risk_level"] == "low"
    )

    return {
        "wallet_risks": wallet_risks,
        "summary": {
            "wallets_analyzed": len(
                wallet_risks
            ),
            "high_risk_wallets": high_count,
            "medium_risk_wallets": medium_count,
            "low_risk_wallets": low_count,
        },
    }