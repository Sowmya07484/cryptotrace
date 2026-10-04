import { useState } from "react";

function WalletInput({
  onInvestigate,
  loading = false,
}) {
  const [walletAddress, setWalletAddress] =
    useState("");

  const [maxHops, setMaxHops] =
    useState(2);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedAddress =
      walletAddress.trim();

    if (!trimmedAddress) {
      return;
    }

    await onInvestigate({
      walletAddress: trimmedAddress,
      maxHops: Number(maxHops),
    });
  };

  return (
    <form
      className="wallet-input"
      onSubmit={handleSubmit}
    >
      <div className="wallet-input-field">
        <label htmlFor="wallet-address">
          Wallet address
        </label>

        <input
          id="wallet-address"
          type="text"
          value={walletAddress}
          onChange={(event) =>
            setWalletAddress(event.target.value)
          }
          placeholder="Enter Ethereum wallet address"
          disabled={loading}
          autoComplete="off"
        />
      </div>

      <div className="wallet-input-field hop-field">
        <label htmlFor="max-hops">
          Max hops
        </label>

        <select
          id="max-hops"
          value={maxHops}
          onChange={(event) =>
            setMaxHops(event.target.value)
          }
          disabled={loading}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={
          loading ||
          !walletAddress.trim()
        }
      >
        {loading
          ? "Investigating..."
          : "Investigate"}
      </button>
    </form>
  );
}

export default WalletInput;