import re
from decimal import Decimal, InvalidOperation

from app.services.blockchain import get_transactions
from app.services.entity import identify_entity


MAX_WALLETS_PER_HOP = 10
MAX_TRANSACTIONS_PER_WALLET = 20


# ============================================================
# HELPERS
# ============================================================

def is_valid_eth_address(address: str) -> bool:
    return bool(
        re.fullmatch(r"0x[a-fA-F0-9]{40}", address or "")
    )


def safe_decimal(value) -> Decimal:
    try:
        return Decimal(str(value or "0"))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal("0")


def decimal_to_string(value: Decimal) -> str:
    return format(value, "f")


def entity_is_known(entity) -> bool:
    if not isinstance(entity, dict):
        return False

    return bool(
        entity.get("entity_name")
        or entity.get("name_tag")
        or entity.get("source")
    )


# ============================================================
# WALLET ACTIVITY
# ============================================================

def build_wallet_activity(wallet_address, transactions):
    wallet_key = wallet_address.lower()

    incoming_count = 0
    outgoing_count = 0
    incoming_relationships = 0
    outgoing_relationships = 0

    incoming_value = Decimal("0")
    outgoing_value = Decimal("0")

    counterpart_addresses = set()
    assets = set()
    timestamps = []

    asset_activity = {}
    enriched_transactions = []

    for tx in transactions:
        from_address = (
            tx.get("from_address") or ""
        ).strip()

        to_address = (
            tx.get("to_address") or ""
        ).strip()

        from_key = from_address.lower()
        to_key = to_address.lower()

        asset = str(
            tx.get("asset") or "UNKNOWN"
        )

        value = safe_decimal(
            tx.get("value")
        )

        if asset not in asset_activity:
            asset_activity[asset] = {
                "transaction_count": 0,
                "incoming_count": 0,
                "outgoing_count": 0,
                "incoming_value": Decimal("0"),
                "outgoing_value": Decimal("0"),
            }

        asset_activity[asset]["transaction_count"] += 1

        if from_key == wallet_key:
            direction = "outgoing"
            wallet_role = "sender"

            outgoing_count += 1
            outgoing_relationships += 1
            outgoing_value += value

            asset_activity[asset]["outgoing_count"] += 1
            asset_activity[asset]["outgoing_value"] += value

            if to_address:
                counterpart_addresses.add(to_key)

        elif to_key == wallet_key:
            direction = "incoming"
            wallet_role = "receiver"

            incoming_count += 1
            incoming_relationships += 1
            incoming_value += value

            asset_activity[asset]["incoming_count"] += 1
            asset_activity[asset]["incoming_value"] += value

            if from_address:
                counterpart_addresses.add(from_key)

        else:
            direction = "other"
            wallet_role = "participant"

            if from_address:
                counterpart_addresses.add(from_key)

            if to_address:
                counterpart_addresses.add(to_key)

        assets.add(asset)

        timestamp = tx.get("timestamp")

        if timestamp is not None:
            try:
                timestamps.append(int(timestamp))
            except (TypeError, ValueError):
                pass

        enriched_tx = dict(tx)
        enriched_tx["direction"] = direction
        enriched_tx["wallet_role"] = wallet_role

        enriched_transactions.append(enriched_tx)

    formatted_asset_activity = {}

    for asset, data in asset_activity.items():
        net = (
            data["incoming_value"]
            - data["outgoing_value"]
        )

        formatted_asset_activity[asset] = {
            "transaction_count": data["transaction_count"],
            "incoming_count": data["incoming_count"],
            "outgoing_count": data["outgoing_count"],
            "incoming_value": decimal_to_string(
                data["incoming_value"]
            ),
            "outgoing_value": decimal_to_string(
                data["outgoing_value"]
            ),
            "net_value": decimal_to_string(net),
        }

    net_value = incoming_value - outgoing_value

    return {
        "transaction_count": len(enriched_transactions),
        "incoming_transaction_count": incoming_count,
        "outgoing_transaction_count": outgoing_count,
        "incoming_relationship_count": incoming_relationships,
        "outgoing_relationship_count": outgoing_relationships,
        "unique_counterpart_count": len(counterpart_addresses),
        "incoming_value": decimal_to_string(incoming_value),
        "outgoing_value": decimal_to_string(outgoing_value),
        "net_value": decimal_to_string(net_value),
        "assets": sorted(assets),
        "asset_activity": formatted_asset_activity,
        "first_transaction_timestamp": (
            min(timestamps) if timestamps else None
        ),
        "latest_transaction_timestamp": (
            max(timestamps) if timestamps else None
        ),
        "transactions": enriched_transactions,
    }


# ============================================================
# TASK 11 - RISK ANALYSIS
# ============================================================

def calculate_wallet_risk(wallet):
    score = 0
    factors = []

    transaction_count = int(
        wallet.get("transaction_count", 0) or 0
    )

    incoming_count = int(
        wallet.get(
            "incoming_transaction_count",
            0,
        ) or 0
    )

    outgoing_count = int(
        wallet.get(
            "outgoing_transaction_count",
            0,
        ) or 0
    )

    counterpart_count = int(
        wallet.get(
            "unique_counterpart_count",
            0,
        ) or 0
    )

    asset_count = len(
        wallet.get("assets", [])
    )

    # --------------------------------------------------------
    # Transaction activity
    # --------------------------------------------------------

    if transaction_count >= 20:
        score += 20
        factors.append({
            "factor": "high_transaction_activity",
            "value": transaction_count,
            "points": 20,
        })

    elif transaction_count >= 10:
        score += 10
        factors.append({
            "factor": "moderate_transaction_activity",
            "value": transaction_count,
            "points": 10,
        })

    # --------------------------------------------------------
    # Outgoing dominance
    # --------------------------------------------------------

    total_directional = (
        incoming_count
        + outgoing_count
    )

    outgoing_ratio = 0

    if total_directional:
        outgoing_ratio = (
            outgoing_count
            / total_directional
        )

    if (
        outgoing_count >= 10
        and outgoing_ratio >= 0.70
    ):
        score += 20
        factors.append({
            "factor": "outgoing_dominance",
            "value": round(outgoing_ratio, 4),
            "points": 20,
        })

    elif (
        outgoing_count >= 5
        and outgoing_ratio >= 0.60
    ):
        score += 10
        factors.append({
            "factor": "moderate_outgoing_dominance",
            "value": round(outgoing_ratio, 4),
            "points": 10,
        })

    # --------------------------------------------------------
    # Counterparty diversity
    # --------------------------------------------------------

    if counterpart_count >= 15:
        score += 15
        factors.append({
            "factor": "high_counterparty_diversity",
            "value": counterpart_count,
            "points": 15,
        })

    elif counterpart_count >= 8:
        score += 8
        factors.append({
            "factor": "moderate_counterparty_diversity",
            "value": counterpart_count,
            "points": 8,
        })

    # --------------------------------------------------------
    # Asset diversity
    # --------------------------------------------------------

    if asset_count >= 10:
        score += 15
        factors.append({
            "factor": "high_asset_diversity",
            "value": asset_count,
            "points": 15,
        })

    elif asset_count >= 5:
        score += 8
        factors.append({
            "factor": "moderate_asset_diversity",
            "value": asset_count,
            "points": 8,
        })

    # --------------------------------------------------------
    # Unknown entity
    # --------------------------------------------------------

    if not entity_is_known(
        wallet.get("entity")
    ):
        score += 10
        factors.append({
            "factor": "unknown_entity",
            "value": True,
            "points": 10,
        })

    # --------------------------------------------------------
    # Negative net flow
    # --------------------------------------------------------

    incoming_value = safe_decimal(
        wallet.get("incoming_value")
    )

    outgoing_value = safe_decimal(
        wallet.get("outgoing_value")
    )

    net_value = (
        incoming_value
        - outgoing_value
    )

    if (
        outgoing_value > 0
        and net_value < 0
    ):
        score += 10
        factors.append({
            "factor": "negative_net_flow",
            "value": decimal_to_string(net_value),
            "points": 10,
        })

    score = max(0, min(100, score))

    if score >= 70:
        risk_level = "high"
    elif score >= 40:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "risk_factors": factors,
    }


# ============================================================
# TRACE WALLET
# ============================================================

async def trace_wallet(
    start_address: str,
    max_hops: int = 2,
):
    start_address = start_address.strip()

    if not is_valid_eth_address(start_address):
        raise ValueError(
            "Invalid Ethereum wallet address"
        )

    visited = {
        start_address.lower()
    }

    queue = [
        (start_address, 0)
    ]

    wallets = []
    edges = []
    all_transactions = []

    edge_keys = set()
    transaction_keys = set()

    truncated = False

    # ========================================================
    # BFS
    # ========================================================

    while queue:
        current_address, current_hop = queue.pop(0)

        transactions = await get_transactions(
            current_address,
            page=1,
            offset=MAX_TRANSACTIONS_PER_WALLET,
        )

        wallet_transactions = []

        for tx in transactions:
            tx_data = tx.model_dump()

            transaction_hash = (
                tx.hash or ""
            ).lower()

            from_address = (
                tx.from_address or ""
            ).lower()

            to_address = (
                tx.to_address or ""
            ).lower()

            token_contract = (
                tx.token_contract or ""
            ).lower()

            transaction_key = (
                transaction_hash,
                from_address,
                to_address,
                tx.transaction_type,
                token_contract,
            )

            if transaction_key not in transaction_keys:
                transaction_keys.add(
                    transaction_key
                )
                all_transactions.append(tx_data)

            wallet_transactions.append(tx_data)

            if not tx.to_address:
                continue

            original_from_address = (
                tx.from_address or ""
            ).strip()

            destination = (
                tx.to_address or ""
            ).strip()

            if not is_valid_eth_address(
                original_from_address
            ):
                continue

            if not is_valid_eth_address(
                destination
            ):
                continue

            current_key = current_address.lower()
            from_key = original_from_address.lower()
            to_key = destination.lower()

            if (
                from_key != current_key
                and to_key != current_key
            ):
                continue

            direction = (
                "outgoing"
                if from_key == current_key
                else "incoming"
            )

            edge_key = (
                transaction_hash,
                from_key,
                to_key,
                tx.transaction_type,
                token_contract,
            )

            if edge_key not in edge_keys:
                edge_keys.add(edge_key)

                edges.append({
                    "from": original_from_address,
                    "to": destination,
                    "transaction_hash": tx.hash,
                    "asset": tx.asset,
                    "value": tx.value,
                    "transaction_type": (
                        tx.transaction_type
                    ),
                    "hop": current_hop,
                    "direction": direction,
                })

            # Only outgoing transactions discover
            # new wallets.

            if from_key != current_key:
                continue

            if current_hop >= max_hops:
                continue

            destination_key = destination.lower()

            if destination_key in visited:
                continue

            wallets_at_next_hop = sum(
                1
                for _, hop in queue
                if hop == current_hop + 1
            )

            if (
                wallets_at_next_hop
                >= MAX_WALLETS_PER_HOP
            ):
                truncated = True
                continue

            visited.add(destination_key)

            queue.append(
                (
                    destination,
                    current_hop + 1,
                )
            )

        # ====================================================
        # WALLET ACTIVITY
        # ====================================================

        activity = build_wallet_activity(
            current_address,
            wallet_transactions,
        )

        entity = identify_entity(
            current_address
        )

        wallet = {
            "address": current_address,
            "hop": current_hop,

            "transaction_count": activity[
                "transaction_count"
            ],

            "incoming_transaction_count": activity[
                "incoming_transaction_count"
            ],

            "outgoing_transaction_count": activity[
                "outgoing_transaction_count"
            ],

            "incoming_relationship_count": activity[
                "incoming_relationship_count"
            ],

            "outgoing_relationship_count": activity[
                "outgoing_relationship_count"
            ],

            "unique_counterpart_count": activity[
                "unique_counterpart_count"
            ],

            "incoming_value": activity[
                "incoming_value"
            ],

            "outgoing_value": activity[
                "outgoing_value"
            ],

            "net_value": activity[
                "net_value"
            ],

            "assets": activity[
                "assets"
            ],

            "asset_activity": activity[
                "asset_activity"
            ],

            "first_transaction_timestamp": activity[
                "first_transaction_timestamp"
            ],

            "latest_transaction_timestamp": activity[
                "latest_transaction_timestamp"
            ],

            "transactions": activity[
                "transactions"
            ],

            "entity": entity,
        }

        # ====================================================
        # TASK 11 WALLET RISK
        # ====================================================

        risk = calculate_wallet_risk(wallet)

        wallet["risk_score"] = risk["risk_score"]
        wallet["risk_level"] = risk["risk_level"]
        wallet["risk_factors"] = risk["risk_factors"]

        wallets.append(wallet)

    # ========================================================
    # AGGREGATION
    # ========================================================

    wallets_per_hop = {}

    known_entities = 0
    unknown_entities = 0

    observed_assets = set()

    total_incoming_relationships = 0
    total_outgoing_relationships = 0

    total_incoming_value = Decimal("0")
    total_outgoing_value = Decimal("0")

    asset_totals = {}

    high_risk_wallets = 0
    medium_risk_wallets = 0
    low_risk_wallets = 0

    total_risk_score = 0

    for wallet in wallets:

        hop = str(wallet["hop"])

        wallets_per_hop[hop] = (
            wallets_per_hop.get(hop, 0)
            + 1
        )

        if entity_is_known(
            wallet.get("entity")
        ):
            known_entities += 1
        else:
            unknown_entities += 1

        total_incoming_relationships += (
            wallet[
                "incoming_relationship_count"
            ]
        )

        total_outgoing_relationships += (
            wallet[
                "outgoing_relationship_count"
            ]
        )

        total_incoming_value += safe_decimal(
            wallet["incoming_value"]
        )

        total_outgoing_value += safe_decimal(
            wallet["outgoing_value"]
        )

        for asset in wallet.get(
            "assets",
            [],
        ):
            observed_assets.add(asset)

        for asset, activity in wallet.get(
            "asset_activity",
            {},
        ).items():

            if asset not in asset_totals:
                asset_totals[asset] = {
                    "transaction_count": 0,
                    "incoming_count": 0,
                    "outgoing_count": 0,
                    "incoming_value": Decimal("0"),
                    "outgoing_value": Decimal("0"),
                }

            data = asset_totals[asset]

            data["transaction_count"] += activity[
                "transaction_count"
            ]

            data["incoming_count"] += activity[
                "incoming_count"
            ]

            data["outgoing_count"] += activity[
                "outgoing_count"
            ]

            data["incoming_value"] += safe_decimal(
                activity["incoming_value"]
            )

            data["outgoing_value"] += safe_decimal(
                activity["outgoing_value"]
            )

        wallet_risk_score = int(
            wallet.get("risk_score", 0) or 0
        )

        total_risk_score += wallet_risk_score

        risk_level = wallet.get(
            "risk_level",
            "low",
        )

        if risk_level == "high":
            high_risk_wallets += 1

        elif risk_level == "medium":
            medium_risk_wallets += 1

        else:
            low_risk_wallets += 1

    # ========================================================
    # TOTAL VALUES
    # ========================================================

    total_net_value = (
        total_incoming_value
        - total_outgoing_value
    )

    # ========================================================
    # ASSET TOTALS
    # ========================================================

    formatted_asset_totals = {}

    for asset, data in asset_totals.items():

        net = (
            data["incoming_value"]
            - data["outgoing_value"]
        )

        formatted_asset_totals[asset] = {
            "transaction_count": data[
                "transaction_count"
            ],

            "incoming_count": data[
                "incoming_count"
            ],

            "outgoing_count": data[
                "outgoing_count"
            ],

            "incoming_value": decimal_to_string(
                data["incoming_value"]
            ),

            "outgoing_value": decimal_to_string(
                data["outgoing_value"]
            ),

            "net_value": decimal_to_string(net),
        }

    # ========================================================
    # OVERALL RISK
    # ========================================================

    if wallets:
        overall_risk_score = round(
            total_risk_score / len(wallets)
        )
    else:
        overall_risk_score = 0

    overall_risk_score = max(
        0,
        min(100, overall_risk_score),
    )

    if overall_risk_score >= 70:
        overall_risk_level = "high"
    elif overall_risk_score >= 40:
        overall_risk_level = "medium"
    else:
        overall_risk_level = "low"

    # ========================================================
    # TASK 11 RISK ANALYSIS
    # ========================================================

    risk_analysis = {
        "overall_risk_score": overall_risk_score,

        "overall_risk_level": overall_risk_level,

        "high_risk_wallets": high_risk_wallets,

        "medium_risk_wallets": medium_risk_wallets,

        "low_risk_wallets": low_risk_wallets,

        "wallets": [
            {
                "address": wallet["address"],
                "hop": wallet["hop"],
                "risk_score": wallet["risk_score"],
                "risk_level": wallet["risk_level"],
                "risk_factors": wallet[
                    "risk_factors"
                ],
            }
            for wallet in wallets
        ],
    }

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {
        "wallet_address": start_address,

        "network": "ethereum",

        "max_hops": max_hops,

        "wallets": wallets,

        "edges": edges,

        "transactions": all_transactions,

        "summary": {
            "total_wallets_traced": len(wallets),

            "total_transactions": len(
                all_transactions
            ),

            "total_relationships": len(edges),

            "total_incoming_relationships": (
                total_incoming_relationships
            ),

            "total_outgoing_relationships": (
                total_outgoing_relationships
            ),

            "total_incoming_value": (
                decimal_to_string(
                    total_incoming_value
                )
            ),

            "total_outgoing_value": (
                decimal_to_string(
                    total_outgoing_value
                )
            ),

            "net_value": (
                decimal_to_string(
                    total_net_value
                )
            ),

            "wallets_per_hop": wallets_per_hop,

            "known_entities": known_entities,

            "unknown_entities": unknown_entities,

            "assets_observed": sorted(
                observed_assets
            ),

            "asset_totals": formatted_asset_totals,
        },

        # ====================================================
        # TASK 11
        # THIS IS INTENTIONALLY OUTSIDE SUMMARY
        # ====================================================

        "risk_analysis": risk_analysis,

        "tracing": {
            "wallets_traced": len(wallets),

            "max_wallets_per_hop": (
                MAX_WALLETS_PER_HOP
            ),

            "max_transactions_per_wallet": (
                MAX_TRANSACTIONS_PER_WALLET
            ),

            "truncated": truncated,
        },
    }
