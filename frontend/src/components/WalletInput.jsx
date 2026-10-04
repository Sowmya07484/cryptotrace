import { useState } from "react";

function WalletInput({ onInvestigate, loading }) {
  const [address, setAddress] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!address.trim()) {
      return;
    }

    onInvestigate(address.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-label">
        Investigate Wallet
      </div>

      <div className="wallet-input-row">
        <input
          className="wallet-input"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Enter wallet address"
          aria-label="Wallet address"
        />

        <button
          className="primary-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "TRACING..." : "TRACE"}
        </button>
      </div>
    </form>
  );
}

export default WalletInput;