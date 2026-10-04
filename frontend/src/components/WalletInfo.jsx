function WalletInfo({ investigation, tracing }) {
  return (
    <div className="card">

      <div className="card-title">
        Wallet Information
      </div>

      <div>
        <div className="section-label">
          Address
        </div>

        <div className="value mono">
          {investigation?.wallet_address || "Not available"}
        </div>
      </div>

      <br />

      <div>
        <div className="section-label">
          Network
        </div>

        <div className="value">
          {investigation?.network || "Not available"}
        </div>
      </div>

      <br />

      <div>
        <div className="section-label">
          Maximum Hops
        </div>

        <div className="value">
          {investigation?.max_hops ?? "Not available"}
        </div>
      </div>

      <br />

      <div>
        <div className="section-label">
          Wallets Traced
        </div>

        <div className="value">
          {tracing?.wallets_traced ?? 0}
        </div>
      </div>

    </div>
  );
}

export default WalletInfo;
