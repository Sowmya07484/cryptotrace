import re
import unicodedata


KNOWN_ASSET_SYMBOLS = {
    "ETH": "ETH",
    "DAI": "DAI",
    "USDC": "USDC",
    "USDT": "USDT",
    "WBTC": "WBTC",
}


def normalize_asset(asset: str | None) -> str | None:
    """
    Normalize an asset symbol for analytics.

    Raw transaction data is never modified.
    This function is used only for derived analytics.
    """

    if not asset:
        return None

    value = str(asset).strip()

    if not value:
        return None

    # Unicode normalization.
    value = unicodedata.normalize(
        "NFKC",
        value,
    )

    # Remove invisible formatting/control characters.
    value = "".join(
        character
        for character in value
        if unicodedata.category(character)
        not in {"Cf", "Cc"}
    )

    value = value.strip().upper()

    # Exact known symbols.
    if value in KNOWN_ASSET_SYMBOLS:
        return KNOWN_ASSET_SYMBOLS[value]

    # Common malformed ETH representation.
    if value == "ETH-":
        return "ETH"

    # Keep unknown values unchanged rather than guessing.
    return value