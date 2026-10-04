from intelligence.entity.entity_lookup import lookup_entity


def main():

    known_address = (
        "0x42b86A269fb3d5368D880c519BadABa77eC00130"
    )

    unknown_address = (
        "0x0000000000000000000000000000000000000001"
    )

    print("Known address:")
    print(lookup_entity(known_address))

    print("\nUnknown address:")
    print(lookup_entity(unknown_address))


if __name__ == "__main__":
    main()