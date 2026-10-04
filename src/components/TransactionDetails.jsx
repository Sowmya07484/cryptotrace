import React from "react";

function shortenHash(hash) {
  if (!hash) return "—";

  if (hash.length <= 24) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-10)}`;
}

function shortenAddress(address) {
  if (!address) return "—";

  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

function getDirection(transaction, walletAddress) {
  if (transaction?.direction) {
    return transaction.direction;
  }

  const wallet = walletAddress?.toLowerCase();
  const from = transaction?.from_address?.toLowerCase();
  const to = transaction?.to_address?.toLowerCase();

  if (to === wallet) {
    return "incoming";
  }

  if (from === wallet) {
    return "outgoing";
  }

  return "unknown";
}

export default function TransactionDetails({
  transaction,
  walletAddress,
  onClose,
}) {
  if (!transaction) {
    return null;
  }

  const direction = getDirection(
    transaction,
    walletAddress
  );

  return (
    <section className="tx-detail-panel">
      <div className="tx-detail-header">
        <div>
          <span className="tx-eyebrow">
            SELECTED TRANSACTION
          </span>

          <h2>Transaction Details</h2>
        </div>

        {onClose && (
          <button
            type="button"
            className="tx-close-button"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>

      <div className="tx-detail-grid">

        <div className="tx-detail-item tx-detail-wide">
          <span>Transaction hash</span>

          <code title={transaction.hash}>
            {shortenHash(transaction.hash)}
          </code>
        </div>

        <div className="tx-detail-item">
          <span>Direction</span>

          <strong
            className={`tx-detail-direction tx-direction-${direction}`}
          >
            {direction === "incoming"
              ? "↓ Incoming"
              : direction === "outgoing"
              ? "↑ Outgoing"
              : "• Unknown"}
          </strong>
        </div>

        <div className="tx-detail-item">
          <span>Block</span>

          <strong>
            {transaction.block_number ?? "—"}
          </strong>
        </div>

        <div className="tx-detail-item">
          <span>From</span>

          <code title={transaction.from_address}>
            {shortenAddress(
              transaction.from_address
            )}
          </code>
        </div>

        <div className="tx-detail-item">
          <span>To</span>

          <code title={transaction.to_address}>
            {shortenAddress(
              transaction.to_address
            )}
          </code>
        </div>

        <div className="tx-detail-item">
          <span>Asset</span>

          <strong>
            {transaction.token_symbol ||
              transaction.asset ||
              "Unknown"}
          </strong>
        </div>

        <div className="tx-detail-item">
          <span>Transaction type</span>

          <strong>
            {transaction.transaction_type ||
              "Unknown"}
          </strong>
        </div>

        <div className="tx-detail-item">
          <span>Status</span>

          <strong>
            {transaction.is_error
              ? "Failed"
              : "Successful"}
          </strong>
        </div>

        <div className="tx-detail-item tx-detail-wide">
          <span>Raw value</span>

          <code>
            {transaction.value ?? "0"}
          </code>
        </div>

      </div>
    </section>
  );
}