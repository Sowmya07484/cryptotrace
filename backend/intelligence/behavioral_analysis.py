from collections import defaultdict

from .rules import is_fan_in, is_fan_out, is_intermediary


def analyze_behavior(
    wallets: list[dict],
    transactions: list[dict],
    edges: list[dict],
) -> dict:
    """
    Analyze behavioral patterns using only wallets and
    relationships present in the traced graph.

    This is an evidence layer only.
    It does not assign a fraud verdict.
    """

    traced_wallets = {}

    for wallet in wallets:
        address = wallet.get("address")

        if address:
            traced_wallets[address.lower()] = address

    incoming = defaultdict(set)
    outgoing = defaultdict(set)

    for edge in edges:
        source = edge.get("from")
        destination = edge.get("to")

        if not source or not destination:
            continue

        source_key = source.lower()
        destination_key = destination.lower()

        if source_key not in traced_wallets:
            continue

        if destination_key not in traced_wallets:
            continue

        # Ignore self-transfers when calculating
        # wallet-to-wallet behavioral relationships.
        if source_key == destination_key:
            continue

        incoming[destination_key].add(source_key)
        outgoing[source_key].add(destination_key)

    indicators = []
    evidence = []

    # Fan-in
    for wallet_key, source_wallets in incoming.items():

        count = len(source_wallets)

        if is_fan_in(count):

            wallet_address = traced_wallets[wallet_key]

            source_addresses = sorted(
                traced_wallets[source]
                for source in source_wallets
            )

            indicators.append(
                {
                    "type": "fan_in",
                    "wallet": wallet_address,
                    "count": count,
                }
            )

            evidence.append(
                {
                    "indicator": "fan_in",
                    "wallet": wallet_address,
                    "source_wallets": source_addresses,
                    "count": count,
                }
            )

    # Fan-out
    for wallet_key, destination_wallets in outgoing.items():

        count = len(destination_wallets)

        if is_fan_out(count):

            wallet_address = traced_wallets[wallet_key]

            destination_addresses = sorted(
                traced_wallets[destination]
                for destination in destination_wallets
            )

            indicators.append(
                {
                    "type": "fan_out",
                    "wallet": wallet_address,
                    "count": count,
                }
            )

            evidence.append(
                {
                    "indicator": "fan_out",
                    "wallet": wallet_address,
                    "destination_wallets": destination_addresses,
                    "count": count,
                }
            )

    # Intermediary wallets
    intermediary_wallets = (
        set(incoming.keys()) & set(outgoing.keys())
    )

    for wallet_key in sorted(intermediary_wallets):

        incoming_count = len(incoming[wallet_key])
        outgoing_count = len(outgoing[wallet_key])

        if not is_intermediary(
            incoming_count,
            outgoing_count,
        ):
            continue

        wallet_address = traced_wallets[wallet_key]

        incoming_addresses = sorted(
            traced_wallets[source]
            for source in incoming[wallet_key]
        )

        outgoing_addresses = sorted(
            traced_wallets[destination]
            for destination in outgoing[wallet_key]
        )

        indicators.append(
            {
                "type": "intermediary",
                "wallet": wallet_address,
                "incoming_count": incoming_count,
                "outgoing_count": outgoing_count,
            }
        )

        evidence.append(
            {
                "indicator": "intermediary",
                "wallet": wallet_address,
                "incoming_wallets": incoming_addresses,
                "outgoing_wallets": outgoing_addresses,
                "incoming_count": incoming_count,
                "outgoing_count": outgoing_count,
            }
        )

    # Per-wallet behavioral metrics
    wallet_metrics = []

    for wallet_key, wallet_address in traced_wallets.items():

        incoming_count = len(
            incoming.get(wallet_key, set())
        )

        outgoing_count = len(
            outgoing.get(wallet_key, set())
        )

        unique_counterparties = (
            incoming.get(wallet_key, set())
            | outgoing.get(wallet_key, set())
        )

        wallet_metrics.append(
            {
                "wallet": wallet_address,
                "incoming_wallets": incoming_count,
                "outgoing_wallets": outgoing_count,
                "unique_counterparties": len(
                    unique_counterparties
                ),
            }
        )

    metrics = {
        "wallets_analyzed": len(traced_wallets),
        "transactions_analyzed": len(transactions),
        "edges_analyzed": len(edges),
        "wallets_with_incoming": len(incoming),
        "wallets_with_outgoing": len(outgoing),
        "intermediary_wallets": len(
            intermediary_wallets
        ),
        "fan_in_indicators": sum(
            1
            for indicator in indicators
            if indicator["type"] == "fan_in"
        ),
        "fan_out_indicators": sum(
            1
            for indicator in indicators
            if indicator["type"] == "fan_out"
        ),
    }

    return {
        "indicators": indicators,
        "evidence": evidence,
        "metrics": metrics,
        "wallet_metrics": wallet_metrics,
    }