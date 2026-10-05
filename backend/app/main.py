from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.investigation import InvestigationRequest
from app.services.tracer import trace_wallet

from intelligence.behavioral_analysis import analyze_behavior
from intelligence.entity.entity_analysis import analyze_entities
from intelligence.wallet_behavior import analyze_wallet_behavior
from intelligence.risk_factors import build_risk_factors
from intelligence.risk_scoring import calculate_wallet_risks


app = FastAPI(
    title="CryptoTrace Backend",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://cryptotrace-one.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "project": "CryptoTrace",
        "status": "running",
    }


@app.post("/investigate")
async def investigate(request: InvestigationRequest):

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

        wallets = result.get(
            "wallets",
            [],
        )

        transactions = result.get(
            "transactions",
            [],
        )

        edges = result.get(
            "edges",
            [],
        )

        behavioral_analysis = analyze_behavior(
            wallets=wallets,
            transactions=transactions,
            edges=edges,
        )

        entity_analysis = analyze_entities(
            wallets=wallets,
            transactions=transactions,
            edges=edges,
        )

        wallet_behavior = analyze_wallet_behavior(
            wallets=wallets,
            transactions=transactions,
            edges=edges,
            behavioral_analysis=behavioral_analysis,
            entity_analysis=entity_analysis,
        )

        risk_factors = build_risk_factors(
            wallet_behavior=wallet_behavior,
            behavioral_analysis=behavioral_analysis,
            entity_analysis=entity_analysis,
        )

        wallet_risks = calculate_wallet_risks(
            risk_factors
        )

        result["analytics"] = {
            "behavioral_analysis": behavioral_analysis,
            "entity_analysis": entity_analysis,
            "wallet_behavior": wallet_behavior,
            "risk_factors": risk_factors,
            "wallet_risks": wallet_risks,
        }

        return result

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )

