from pydantic import BaseModel


class Transaction(BaseModel):
    hash: str
    block_number: int
    timestamp: int

    from_address: str
    to_address: str | None

    value: str
    asset: str

    transaction_type: str

    token_contract: str | None = None
    token_symbol: str | None = None

    is_error: bool = False