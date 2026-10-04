function VerdictCard({ riskAnalysis, tracing }) {
  const summary = riskAnalysis?.summary || {};

  const highRisk = summary.high_risk_wallets ?? 0;
  const mediumRisk = summary.medium_risk_wallets ?? 0;

  let status = "LOW RISK";
  let description =
    "No high-risk wallets were identified in the traced network.";

  if (highRisk > 0) {
    status = "HIGH RISK";
    description =
      "High-risk wallets were identified and require immediate investigation.";
  } else if (mediumRisk > 0) {
    status = "MANUAL REVIEW";
    description =
      "Medium-risk wallets and behavioural indicators require investigator review.";
  }

  return (
    <div className="verdict">

      <div className="card-title">
        Investigation Assessment
      </div>

      <div className="verdict-label">
        {status}
      </div>

      <p>
        {description}
      </p>

      <p>
        Wallets traced: {tracing?.wallets_traced ?? 0}
      </p>

      {tracing?.truncated && (
        <p>
          Trace was truncated according to the
          configured wallet-per-hop limit.
        </p>
      )}

    </div>
  );
}

export default VerdictCard;

