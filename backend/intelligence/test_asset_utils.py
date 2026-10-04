from intelligence.asset_utils import normalize_asset


def main():

    test_assets = [
        "ETH",
        "eth",
        " ETH ",
        "ETH-",
        "DAI",
        "USDC",
        None,
        "",
    ]

    for asset in test_assets:

        print(
            repr(asset),
            "->",
            repr(
                normalize_asset(asset)
            ),
        )


if __name__ == "__main__":
    main()