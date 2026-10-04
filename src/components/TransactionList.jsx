import React from "react";

function shortenAddress(address) {
  if (!address) {
    return "—";
  }

  if (address.length <= 16) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const date = new Date(Number(timestamp) * 1000);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function getDirection(transaction, walletAddress) {
  const wallet = (walletAddress || "").toLowerCase();

  const from = (
    transaction.from_address || ""
  ).toLowerCase();

  const to = (
    transaction.to_address || ""
  ).toLowerCase();

  if (from === wallet) {
    return "outgoing";
  }

  if (to === wallet) {
    return "incoming";
  }

  return transaction.direction || "unknown";
}

export default function TransactionList({
  transactions = [],
  walletAddress,
  onTransactionSelect,
}) {
  if (!transactions.length) {
    return (
      <div className="empty-table">
        <div className="empty-table-icon">
          ∅
        </div>

        <strong>
          No transactions returned
        </strong>

        <span>
          The backend did not return transaction records
          for this investigation.
        </span>
      </div>
    );
  }

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Direction</th>
            <th>Hash</th>
            <th>From</th>
            <th>To</th>
            <th>Asset</th>
            <th>Value</th>
            <th>Type</th>
            <th>Timestamp</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map((transaction, index) => {
            const direction = getDirection(
              transaction,
              walletAddress
            );

            return (
              <tr
                key={
                  transaction.hash ||
                  `${transaction.block_number}-${index}`
                }
                onClick={() =>
                  onTransactionSelect?.({
                    ...transaction,
                    direction,
                  })
                }
                className="transaction-row"
              >
                <td>
                  <span
                    className={`direction-badge direction-${direction}`}
                  >
                    <span className="direction-arrow">
                      {direction === "incoming"
                        ? "↓"
                        : direction === "outgoing"
                        ? "↑"
                        : "•"}
                    </span>

                    {direction}
                  </span>
                </td>

                <td>
                  <span className="hash-cell">
                    {shortenAddress(
                      transaction.hash
                    )}
                  </span>
                </td>

                <td>
                  <span className="address-cell">
                    {shortenAddress(
                      transaction.from_address
                    )}
                  </span>
                </td>

                <td>
                  <span className="address-cell">
                    {shortenAddress(
                      transaction.to_address
                    )}
                  </span>
                </td>

                <td>
                  <span className="asset-table">
                    {transaction.token_symbol ||
                      transaction.asset ||
                      "—"}
                  </span>
                </td>

                <td>
                  <span className="value-cell">
                    {transaction.value ?? "—"}
                  </span>
                </td>

                <td>
                  <span className="type-badge">
                    {transaction.transaction_type ||
                      "unknown"}
                  </span>
                </td>

                <td>
                  <span className="timestamp-cell">
                    {formatTimestamp(
                      transaction.timestamp
                    )}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      transaction.is_error
                        ? "status-failed"
                        : "status-success"
                    }
                  >
                    {transaction.is_error
                      ? "Failed"
                      : "Success"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="transaction-hint">
        Select any transaction to view its full details.
      </div>
    </div>
  );
}