FAN_IN_THRESHOLD = 2
FAN_OUT_THRESHOLD = 2


def is_fan_in(count: int) -> bool:
    return count >= FAN_IN_THRESHOLD


def is_fan_out(count: int) -> bool:
    return count >= FAN_OUT_THRESHOLD


def is_intermediary(
    incoming_count: int,
    outgoing_count: int,
) -> bool:
    return incoming_count > 0 and outgoing_count > 0