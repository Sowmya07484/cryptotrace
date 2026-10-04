from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.investigation import InvestigationRequest
from app.services.tracer import trace_wallet


app = FastAPI(
    title="CryptoTrace API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
async def root():
    return {
        "name": "CryptoTrace API",
        "status": "running",
    }


@app.post(
    "/investigate",
    summary="Investigate an Ethereum wallet",
    description=(
        "Traces a real Ethereum wallet using blockchain data, "
        "returns traced wallets, transactions, graph edges, "
        "relationship summaries, entity information, "
        "risk analysis, and investigation metadata."
    ),
)
async def investigate(
    request: InvestigationRequest,
):
    wallet_address = request.wallet_address.strip()

    if not wallet_address:
        raise HTTPException(
            status_code=400,
            detail="wallet_address cannot be empty",
        )

    try:
        result = await trace_wallet(
            wallet_address,
            request.max_hops,
        )

        entities = []

        for wallet in result["wallets"]:
            entity = wallet.get("entity")

            if entity and entity.get("entity_name"):
                entities.append(
                    {
                        "address": wallet["address"],
                        "hop": wallet["hop"],
                        **entity,
                    }
                )

        return {
            "investigation": {
                "wallet": result["wallet_address"],
                "network": result["network"],
                "max_hops": result["max_hops"],
            },

            "wallets": result["wallets"],

            "transactions": result["transactions"],

            "edges": result["edges"],

            "entities": entities,

            "summary": result.get(
                "summary",
                {},
            ),

            "risk_analysis": result.get(
                "risk_analysis",
                {},
            ),

            "tracing": result["tracing"],
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )

