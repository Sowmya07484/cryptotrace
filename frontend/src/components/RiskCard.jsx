function RiskCard({ riskAnalysis }) {
  const summary = riskAnalysis?.summary || {};
  const scores = riskAnalysis?.scores || [];

  // Use the first scored wallet as the primary risk shown
  // on the investigator dashboard.
  const primaryRisk = scores[0];

  return (
    <div className="card">

      <div className="card-title">
        Risk Analysis
      </div>

      <div className="risk-score">
        {primaryRisk?.risk_score ?? 0}
      </div>

      <div className="risk-level">
        {(primaryRisk?.risk_level || "UNKNOWN").toUpperCase()}
      </div>

      <br />

      <div className="section-label">
        Risk Distribution
      </div>

      <div className="risk-summary">

        <div>
          High: {summary.high_risk_wallets ?? 0}
        </div>

        <div>
          Medium: {summary.medium_risk_wallets ?? 0}
        </div>

        <div>
          Low: {summary.low_risk_wallets ?? 0}
        </div>

      </div>

    </div>
  );
}

export default RiskCard;

