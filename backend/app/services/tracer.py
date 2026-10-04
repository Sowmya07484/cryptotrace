from app.services.blockchain import get_transactions
from intelligence.entity.entity_service import enrich_wallets


MAX_WALLETS_PER_HOP = 10


async def trace_wallet(
    start_address: str,
    max_hops: int = 2,
):
    start_address = start_address.strip()

    visited = {start_address.lower()}
    queue = [(start_address, 0)]

    wallets = []
    edges = []
    all_transactions = []

    truncated = False

    while queue:
        current_address, current_hop = queue.pop(0)

        transactions = await get_transactions(
            current_address,
            page=1,
            offset=20,
        )

        wallet_transactions = []

        for tx in transactions:
            tx_data = tx.model_dump()

            wallet_transactions.append(tx_data)
            all_transactions.append(tx_data)

            # Only follow outgoing transactions
            if (
                tx.from_address.lower() == current_address.lower()
                and tx.to_address
            ):
                destination = tx.to_address

                edges.append(
                    {
                        "from": tx.from_address,
                        "to": destination,
                        "transaction_hash": tx.hash,
                        "asset": tx.asset,
                        "value": tx.value,
                        "transaction_type": tx.transaction_type,
                        "hop": current_hop + 1,
                    }
                )

                # Discover next-hop address
                if current_hop < max_hops:
                    destination_key = destination.lower()

                    if destination_key not in visited:
                        visited.add(destination_key)

                        # Prevent uncontrolled API expansion
                        wallets_at_next_hop = sum(
                            1
                            for _, hop in queue
                            if hop == current_hop + 1
                        )

                        if wallets_at_next_hop < MAX_WALLETS_PER_HOP:
                            queue.append(
                                (
                                    destination,
                                    current_hop + 1,
                                )
                            )
                        else:
                            truncated = True

        wallets.append(
            {
                "address": current_address,
                "hop": current_hop,
                "transaction_count": len(wallet_transactions),
                "transactions": wallet_transactions,
            }
        )

    # Enrich every traced wallet with real GraphSense entity data
    enriched_wallets = enrich_wallets(wallets)

    return {
        "wallet_address": start_address,
        "network": "ethereum",
        "max_hops": max_hops,
        "wallets": enriched_wallets,
        "edges": edges,
        "transactions": all_transactions,
        "tracing": {
            "wallets_traced": len(enriched_wallets),
            "max_wallets_per_hop": MAX_WALLETS_PER_HOP,
            "truncated": truncated,
        },
    }