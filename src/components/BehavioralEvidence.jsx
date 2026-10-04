function BehavioralEvidence({
  analysis,
}) {
  if (!analysis) {
    return (
      <section className="card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              INTELLIGENCE
            </div>

            <h2>
              Behavioral Evidence
            </h2>
          </div>
        </div>

        <div className="empty-state">
          Behavioral analysis is not
          available yet.
        </div>
      </section>
    );
  }

  const indicators =
    Array.isArray(analysis.indicators)
      ? analysis.indicators
      : [];

  const evidence =
    Array.isArray(analysis.evidence)
      ? analysis.evidence
      : [];

  const metrics =
    analysis.metrics || {};

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            INTELLIGENCE
          </div>

          <h2>
            Behavioral Evidence
          </h2>
        </div>
      </div>

      {indicators.length === 0 &&
      evidence.length === 0 &&
      Object.keys(metrics).length === 0 ? (
        <div className="empty-state">
          No behavioral indicators
          returned.
        </div>
      ) : (
        <>
          {indicators.length > 0 && (
            <div className="evidence-section">
              <h3>
                Indicators
              </h3>

              {indicators.map(
                (indicator, index) => (
                  <div
                    className="evidence-item"
                    key={index}
                  >
                    <strong>
                      {indicator.type ||
                        "Indicator"}
                    </strong>

                    <pre>
                      {JSON.stringify(
                        indicator,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )
              )}
            </div>
          )}

          {evidence.length > 0 && (
            <div className="evidence-section">
              <h3>
                Evidence
              </h3>

              {evidence.map(
                (item, index) => (
                  <div
                    className="evidence-item"
                    key={index}
                  >
                    <pre>
                      {typeof item ===
                      "string"
                        ? item
                        : JSON.stringify(
                            item,
                            null,
                            2
                          )}
                    </pre>
                  </div>
                )
              )}
            </div>
          )}

          {Object.keys(metrics).length > 0 && (
            <div className="evidence-section">
              <h3>
                Metrics
              </h3>

              <pre>
                {JSON.stringify(
                  metrics,
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default BehavioralEvidence;