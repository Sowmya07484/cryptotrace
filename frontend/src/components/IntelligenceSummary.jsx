function ExplanationPanel({
  intelligence,
  riskAnalysis,
}) {
  const indicators =
    intelligence?.indicators || [];

  const flagged =
    riskAnalysis?.flagged || [];

  return (
    <div className="card">

      <div className="card-title">
        Explanation / Risk Factors
      </div>

      {flagged.length > 0 && (
        <>
          <div className="section-label">
            Flagged Wallets
          </div>

          <ul className="reason-list">

            {flagged.map((wallet) => (
              <li key={wallet.wallet}>

                <strong>
                  {(wallet.risk_level || "unknown").toUpperCase()}
                </strong>

                {" — "}

                <span className="mono">
                  {wallet.wallet}
                </span>

                {" (score: "}
                {wallet.risk_score ?? 0}
                {")"}

                {Object.keys(wallet.factors || {}).length > 0 && (
                  <ul>

                    {Object.entries(wallet.factors || {})
                      .filter(([, value]) => value > 0)
                      .map(([factor, value]) => (
                        <li key={factor}>
                          {factor.replaceAll("_", " ")}
                          {" ("}
                          {value}
                          {")"}
                        </li>
                      ))}

                  </ul>
                )}

              </li>
            ))}

          </ul>
        </>
      )}

      <br />

      <div className="section-label">
        Behavioural Indicators
      </div>

      {indicators.length > 0 ? (
        <ul className="reason-list">

          {indicators.map((indicator, index) => (
            <li
              key={`${indicator.wallet}-${index}`}
            >

              <strong>
                {(indicator.type || "indicator")
                  .replaceAll("_", " ")
                  .toUpperCase()}
              </strong>

              {" — "}

              <span className="mono">
                {indicator.wallet}
              </span>

              {indicator.count !== undefined && (
                <>
                  {" ("}
                  {indicator.count}
                  {")"}
                </>
              )}

              {indicator.incoming_count !== undefined && (
                <>
                  {" — incoming: "}
                  {indicator.incoming_count}
                </>
              )}

              {indicator.outgoing_count !== undefined && (
                <>
                  {" — outgoing: "}
                  {indicator.outgoing_count}
                </>
              )}

            </li>
          ))}

        </ul>
      ) : (
        <p>
          No behavioural indicators detected.
        </p>
      )}

      {flagged.length === 0 &&
        indicators.length === 0 && (
          <p>
            No risk or behavioural indicators are
            currently available.
          </p>
        )}

    </div>
  );
}

export default ExplanationPanel;
