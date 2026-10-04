import React, { useMemo } from "react";
export default function InvestigationSummary({
  investigation,
}) {
  const wallets = investigation?.wallets ?? [];

  const summary = useMemo(() => {
    let transactions = 0;
    let incoming = 0;
    let outgoing = 0;

    const assets = new Set();
    const counterparties = new Set();

    wallets.forEach((wallet) => {
      const walletTransactions =
        wallet.transactions ?? [];

      transactions +=
        wallet.transaction_count ??
        walletTransactions.length;

      incoming +=
        wallet.incoming_transaction_count ??
        0;

      outgoing +=
        wallet.outgoing_transaction_count ??
        0;

      walletTransactions.forEach((tx) => {
        if (tx.asset) {
          assets.add(tx.asset);
        }

        if (tx.token_symbol) {
          assets.add(tx.token_symbol);
        }

        if (tx.from_address) {
          counterparties.add(
            tx.from_address.toLowerCase()
          );
        }

        if (tx.to_address) {
          counterparties.add(
            tx.to_address.toLowerCase()
          );
        }
      });
    });

    return {
      wallets: wallets.length,
      transactions,
      incoming,
      outgoing,
      assets: assets.size,
      counterparties: counterparties.size,
    };
  }, [wallets]);

  return (
    <section className="tx-summary-section">
      <div className="tx-summary-header">
        <div>
          <span className="tx-eyebrow">
            INVESTIGATION OVERVIEW
          </span>

          <h2>Investigation Summary</h2>
        </div>

        <div className="tx-network-badge">
          {investigation?.network || "Unknown network"}
        </div>
      </div>

      <div className="tx-summary-grid">
        <div className="tx-summary-card">
          <span>Wallets traced</span>
          <strong>{summary.wallets}</strong>
        </div>

        <div className="tx-summary-card">
          <span>Transactions</span>
          <strong>{summary.transactions}</strong>
        </div>

        <div className="tx-summary-card">
          <span>Incoming</span>
          <strong>{summary.incoming}</strong>
        </div>

        <div className="tx-summary-card">
          <span>Outgoing</span>
          <strong>{summary.outgoing}</strong>
        </div>

        <div className="tx-summary-card">
          <span>Counterparties</span>
          <strong>{summary.counterparties}</strong>
        </div>

        <div className="tx-summary-card">
          <span>Assets</span>
          <strong>{summary.assets}</strong>
        </div>
      </div>
    </section>
  );
}