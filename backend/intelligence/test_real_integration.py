import asyncio

from intelligence.behavioral_analysis import analyze_behavior
from intelligence.entity.entity_analysis import analyze_entities
from intelligence.wallet_behavior import analyze_wallet_behavior
from intelligence.risk_scoring import calculate_wallet_risks
from intelligence.risk_factors import build_risk_factors
from app.services.tracer import trace_wallet


async def main():

    wallet_address = input(
        "Enter Ethereum wallet address: "
    ).strip()

    if not wallet_address:
        print("Wallet address cannot be empty.")
        return

    print("\nTracing wallet...\n")

    result = await trace_wallet(
        wallet_address,
        max_hops=2,
    )

    analysis = analyze_behavior(
        wallets=result.get("wallets", []),
        transactions=result.get("transactions", []),
        edges=result.get("edges", []),
    )

    entity_analysis = analyze_entities(
        wallets=result.get("wallets", []),
        transactions=result.get("transactions", []),
        edges=result.get("edges", []),
    )

    wallet_behavior = analyze_wallet_behavior(
        wallets=result.get("wallets", []),
        transactions=result.get("transactions", []),
        edges=result.get("edges", []),
        behavioral_analysis=analysis,
        entity_analysis=entity_analysis,
    )

    risk_factors = build_risk_factors(
        wallet_behavior=wallet_behavior,
        behavioral_analysis=analysis,
        entity_analysis=entity_analysis,
    )

    wallet_risks = calculate_wallet_risks(
        risk_factors
    )

    print("=== TRACING SUMMARY ===")

    print(
        "Wallets traced:",
        len(result.get("wallets", [])),
    )

    print(
        "Transactions:",
        len(result.get("transactions", [])),
    )

    print(
        "Edges:",
        len(result.get("edges", [])),
    )

    print(
        "Truncated:",
        result.get("tracing", {}).get(
            "truncated",
            False,
        ),
    )

    print("\n=== BEHAVIORAL ANALYSIS ===")

    print("\nIndicators:")

    for indicator in analysis.get(
        "indicators",
        [],
    ):
        print(indicator)

    print("\nEvidence:")

    for evidence in analysis.get(
        "evidence",
        [],
    ):
        print(evidence)

    print("\nMetrics:")

    print(
        analysis.get(
            "metrics",
            {},
        )
    )

    print("\nWallet Metrics:")

    for wallet_metric in analysis.get(
        "wallet_metrics",
        [],
    ):
        print(wallet_metric)

    print("\n=== ENTITY INFORMATION ===")

    for wallet in result.get(
        "wallets",
        [],
    ):
        print(
            wallet["address"],
            "->",
            wallet.get("entity"),
        )

    print("\n=== ENTITY ANALYSIS ===")

    print("\nSummary:")

    print(
        entity_analysis.get(
            "summary",
            {},
        )
    )

    print("\nWallet Profiles:")

    for profile in entity_analysis.get(
        "wallet_profiles",
        [],
    ):
        print(profile)

    print("\n=== WALLET BEHAVIOR ===")

    print("\nSummary:")

    print(
        wallet_behavior.get(
            "summary",
            {},
        )
    )

    print("\nWallet Profiles:")

    for profile in wallet_behavior.get(
        "wallet_profiles",
        [],
    ):
        print(profile)

    print("\n=== RISK FACTORS ===")

    print("\nSummary:")

    print(
        risk_factors.get(
            "summary",
            {},
        )
    )

    print("\nWallet Factors:")

    for wallet_factor in risk_factors.get(
        "wallet_factors",
        [],
    ):
        print(wallet_factor)

    print("\n=== WALLET RISK SCORES ===")

    print("\nSummary:")

    print(
        wallet_risks.get(
            "summary",
            {},
        )
    )

    print("\nWallet Risks:")

    for wallet_risk in wallet_risks.get(
        "wallet_risks",
        [],
    ):
        print(wallet_risk)


if __name__ == "__main__":
    asyncio.run(main())