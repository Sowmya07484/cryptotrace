from .entity_lookup import lookup_entity


def enrich_wallet(wallet: dict) -> dict:
    """
    Add real entity information to one traced wallet.

    Entity information comes only from the GraphSense
    TagPack lookup. Unknown wallets are not guessed.
    """

    address = wallet.get("address")

    entity = lookup_entity(address)

    enriched_wallet = {
        **wallet,
        "entity": entity,
    }

    return enriched_wallet


def enrich_wallets(wallets: list[dict]) -> list[dict]:
    """
    Enrich every traced wallet with entity information.
    """

    return [
        enrich_wallet(wallet)
        for wallet in wallets
    ]