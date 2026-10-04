function HopTrail({ wallets, tracing }) {
  if (!wallets || wallets.length === 0) {
    return (
      <div className="card">
        <div className="card-title">
          Transaction / Hop Trail
        </div>

        <p>
          No traced wallets available.
        </p>
      </div>
    );
  }

  return (
    <div className="card">

      <div className="card-title">
        Transaction / Hop Trail
      </div>

      <div className="hop-list">

        {wallets.map((wallet, index) => (
          <div
            key={`${wallet.wallet}-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >

            <div className="hop">

              <div className="section-label">
                Hop {wallet.hop}
              </div>

              <strong>
                {wallet.known
                  ? "Known Entity"
                  : "Unknown Wallet"}
              </strong>

              <div className="mono">
                {wallet.wallet}
              </div>

              <br />

              <div>
                {wallet.known
                  ? "Entity identified"
                  : "Entity not identified"}
              </div>

            </div>

            {index < wallets.length - 1 && (
              <div className="hop-arrow">
                →
              </div>
            )}

          </div>
        ))}

      </div>

      <br />

      <div className="section-label">
        Trace Status
      </div>

      <div>
        {tracing?.wallets_traced ??
          wallets.length}{" "}
        wallets traced
        {tracing?.truncated
          ? " — result truncated"
          : ""}
      </div>

    </div>
  );
}

export default HopTrail;

