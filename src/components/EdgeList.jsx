function TransactionList({
  transactions = [],
}) {
  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            BLOCKCHAIN
          </div>

          <h2>
            Transactions
          </h2>
        </div>

        <span className="count-badge">
          {transactions.length}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          No transactions returned.
        </div>
      ) : (
        <div className="transaction-table-wrapper">
          <table className="transaction-table">
            <thead>
              <tr>
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
              {transactions.map(
                (transaction, index) => {

                  const hash =
                    transaction?.hash ||
                    transaction?.transaction_hash ||
                    "—";

                  const from =
                    transaction?.from ||
                    transaction?.from_address ||
                    "—";

                  const to =
                    transaction?.to ||
                    transaction?.to_address ||
                    "—";

                  const asset =
                    transaction?.asset ||
                    transaction?.token_symbol ||
                    transaction?.symbol ||
                    "—";

                  const value =
                    transaction?.value ??
                    transaction?.value_wei ??
                    "—";

                  const type =
                    transaction?.transaction_type ||
                    transaction?.type ||
                    "—";

                  const timestamp =
                    transaction?.timestamp ||
                    transaction?.time_stamp ||
                    null;

                  const isError =
                    transaction?.is_error;

                  return (
                    <tr key={`${hash}-${index}`}>
                      <td
                        className="mono"
                        title={hash}
                      >
                        {shorten(hash)}
                      </td>

                      <td
                        className="mono"
                        title={from}
                      >
                        {shorten(from)}
                      </td>

                      <td
                        className="mono"
                        title={to}
                      >
                        {shorten(to)}
                      </td>

                      <td>
                        {asset}
                      </td>

                      <td>
                        {String(value)}
                      </td>

                      <td>
                        {type}
                      </td>

                      <td>
                        {formatTimestamp(
                          timestamp
                        )}
                      </td>

                      <td>
                        {isError === true
                          ? "Failed"
                          : isError === false
                          ? "Success"
                          : "—"}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function shorten(value) {
  if (!value || value === "—") {
    return "—";
  }

  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const number =
    Number(timestamp);

  if (!Number.isNaN(number)) {
    const milliseconds =
      number < 10000000000
        ? number * 1000
        : number;

    const date =
      new Date(milliseconds);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  return String(timestamp);
}

export default TransactionList;