import React, { useMemo, useState } from "react";
import WalletInput from "../components/WalletInput";
import WalletCard from "../components/WalletCard";
import WalletTrail from "../components/WalletTrail";
import TransactionList from "../components/TransactionList";
import "../styles/dashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

function normalizeTransaction(tx, walletAddress) {
  const wallet = (walletAddress || "").toLowerCase();

  const from = (tx.from_address || tx.from || "").toLowerCase();
  const to = (tx.to_address || tx.to || "").toLowerCase();

  let direction = "unknown";

  if (from === wallet) {
    direction = "outgoing";
  } else if (to === wallet) {
    direction = "incoming";
  }

  return {
    ...tx,
    direction,
  };
}

function enrichWallet(wallet) {
  const address = wallet.address || "";

  const transactions = (wallet.transactions || []).map((tx) =>
    normalizeTransaction(tx, address)
  );

  const incomingTransactions = transactions.filter(
    (tx) => tx.direction === "incoming"
  );

  const outgoingTransactions = transactions.filter(
    (tx) => tx.direction === "outgoing"
  );

  const counterpartSet = new Set();

  transactions.forEach((tx) => {
    const from = (tx.from_address || "").toLowerCase();
    const to = (tx.to_address || "").toLowerCase();
    const current = address.toLowerCase();

    if (from && from !== current) {
      counterpartSet.add(from);
    }

    if (to && to !== current) {
      counterpartSet.add(to);
    }
  });

  const assets = [
    ...new Set(
      transactions
        .map((tx) => tx.token_symbol || tx.asset)
        .filter(Boolean)
    ),
  ];

  const timestamps = transactions
    .map((tx) => Number(tx.timestamp))
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp > 0);

  const firstTimestamp =
    timestamps.length > 0 ? Math.min(...timestamps) : null;

  const latestTimestamp =
    timestamps.length > 0 ? Math.max(...timestamps) : null;

  return {
    ...wallet,

    transactions,

    transaction_count:
      wallet.transaction_count ?? transactions.length,

    incoming_transaction_count:
      wallet.incoming_transaction_count ?? incomingTransactions.length,

    outgoing_transaction_count:
      wallet.outgoing_transaction_count ?? outgoingTransactions.length,

    counterpart_wallet_count:
      wallet.counterpart_wallet_count ?? counterpartSet.size,

    assets:
      wallet.assets?.length > 0
        ? wallet.assets
        : assets,

    first_transaction_timestamp:
      wallet.first_transaction_timestamp ?? firstTimestamp,

    latest_transaction_timestamp:
      wallet.latest_transaction_timestamp ?? latestTimestamp,

    incomingTransactions,

    outgoingTransactions,

    counterpartWallets: [...counterpartSet],
  };
}

function getEntityName(wallet) {
  return (
    wallet.entity_name ||
    wallet.name_tag ||
    wallet.entity?.name ||
    null
  );
}

function getEntityCategory(wallet) {
  return (
    wallet.entity_category ||
    wallet.category ||
    wallet.label ||
    wallet.entity?.category ||
    null
  );
}

export default function InvestigatorDashboard() {
  const [walletAddress, setWalletAddress] = useState(
    "0x1234567890abcdef1234567890abcdef12345678"
  );

  const [maxHops, setMaxHops] = useState(2);

  const [investigation, setInvestigation] = useState(null);

  const [selectedWallet, setSelectedWallet] = useState(null);

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [hasInvestigated, setHasInvestigated] = useState(false);

  const wallets = useMemo(() => {
    if (!investigation?.wallets) {
      return [];
    }

    return investigation.wallets.map(enrichWallet);
  }, [investigation]);

  const allTransactions = useMemo(() => {
    if (!investigation) {
      return [];
    }

    if (Array.isArray(investigation.transactions)) {
      return investigation.transactions;
    }

    return wallets.flatMap((wallet) => wallet.transactions);
  }, [investigation, wallets]);

  const handleInvestigate = async (event) => {
    event?.preventDefault();

    const address = walletAddress.trim();

    if (!address) {
      setError("Please enter a wallet address.");
      return;
    }

    setLoading(true);
    setError("");
    setInvestigation(null);
    setSelectedWallet(null);
    setSelectedTransaction(null);
    setHasInvestigated(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/investigate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: address,
            network: "ethereum",
            max_hops: Number(maxHops),
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error("Backend returned an invalid JSON response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Investigation failed with status ${response.status}.`
        );
      }

      setInvestigation(data);

      const firstWallet = data?.wallets?.[0];

      if (firstWallet) {
        setSelectedWallet(enrichWallet(firstWallet));
      }
    } catch (err) {
      console.error("Investigation error:", err);

      setError(
        err?.message ||
          "Unable to complete the investigation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
    setSelectedTransaction(null);
  };

  const handleTransactionSelect = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const totalIncoming = wallets.reduce(
    (sum, wallet) =>
      sum + Number(wallet.incoming_transaction_count || 0),
    0
  );

  const totalOutgoing = wallets.reduce(
    (sum, wallet) =>
      sum + Number(wallet.outgoing_transaction_count || 0),
    0
  );

  const uniqueAssets = [
    ...new Set(
      wallets.flatMap((wallet) => wallet.assets || [])
    ),
  ];

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <div className="brand-label">
              CRYPTOTRACE
            </div>

            <h1>
              Investigator Dashboard
            </h1>

            <p>
              Trace blockchain fund movement using real
              investigation data.
            </p>
          </div>

          <div className="network-status">
            <span className="status-dot" />
            Ethereum
          </div>
        </header>

        {/* INVESTIGATION FORM */}
        <section className="investigation-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                INVESTIGATION
              </span>

              <h2>
                Start a wallet investigation
              </h2>
            </div>
          </div>

          <form
            className="investigation-form"
            onSubmit={handleInvestigate}
          >
            <div className="form-field wallet-field">
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
                placeholder="0x..."
                spellCheck={false}
              />
            </div>

            <div className="form-field hop-field">
              <label htmlFor="max-hops">
                Max hops
              </label>

              <select
                id="max-hops"
                value={maxHops}
                onChange={(event) =>
                  setMaxHops(Number(event.target.value))
                }
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>

            <button
              className="investigate-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Investigating...
                </>
              ) : (
                "Investigate"
              )}
            </button>
          </form>

          {error && (
            <div className="error-box">
              <strong>Investigation failed</strong>
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* LOADING */}
        {loading && (
          <section className="loading-panel">
            <div className="loading-spinner" />

            <div>
              <strong>
                Tracing wallet activity
              </strong>

              <p>
                Fetching investigation data from the
                blockchain backend...
              </p>
            </div>
          </section>
        )}

        {/* EMPTY */}
        {!loading &&
          hasInvestigated &&
          !error &&
          investigation &&
          wallets.length === 0 && (
            <section className="empty-panel">
              <div className="empty-icon">∅</div>

              <h3>
                No wallets were returned
              </h3>

              <p>
                The investigation completed, but the backend
                returned no traced wallets for this request.
              </p>
            </section>
          )}

        {/* INVESTIGATION RESULT */}
        {!loading &&
          investigation &&
          wallets.length > 0 && (
            <>
              {/* SUMMARY */}
              <section className="summary-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">
                      OVERVIEW
                    </span>

                    <h2>
                      Investigation summary
                    </h2>
                  </div>

                  <span className="result-badge">
                    Investigation complete
                  </span>
                </div>

                <div className="summary-grid">
                  <div className="summary-card">
                    <span>Wallets traced</span>
                    <strong>
                      {wallets.length}
                    </strong>
                  </div>

                  <div className="summary-card">
                    <span>Transactions</span>
                    <strong>
                      {allTransactions.length}
                    </strong>
                  </div>

                  <div className="summary-card incoming">
                    <span>Incoming</span>
                    <strong>
                      {totalIncoming}
                    </strong>
                  </div>

                  <div className="summary-card outgoing">
                    <span>Outgoing</span>
                    <strong>
                      {totalOutgoing}
                    </strong>
                  </div>

                  <div className="summary-card">
                    <span>Assets</span>
                    <strong>
                      {uniqueAssets.length}
                    </strong>
                  </div>
                </div>
              </section>

              {/* WALLET INFORMATION */}
              <section className="wallet-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">
                      WALLET INTELLIGENCE
                    </span>

                    <h2>
                      Wallet information
                    </h2>
                  </div>
                </div>

                <div className="wallet-grid">
                  {wallets.map((wallet) => (
                    <WalletCard
                      key={`${wallet.address}-${wallet.hop}`}
                      wallet={wallet}
                      entityName={getEntityName(wallet)}
                      entityCategory={getEntityCategory(wallet)}
                      selected={
                        selectedWallet?.address?.toLowerCase() ===
                        wallet.address?.toLowerCase()
                      }
                      onClick={() =>
                        handleWalletSelect(wallet)
                      }
                    />
                  ))}
                </div>
              </section>

              {/* TRAIL */}
              <section className="trail-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">
                      TRACE
                    </span>

                    <h2>
                      Investigation trail
                    </h2>
                  </div>
                </div>

                <WalletTrail
                  wallets={wallets}
                  selectedWallet={selectedWallet}
                  onWalletSelect={handleWalletSelect}
                />
              </section>

              {/* TRANSACTIONS */}
              <section className="transactions-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">
                      BLOCKCHAIN
                    </span>

                    <h2>
                      Transactions
                    </h2>
                  </div>

                  <span className="transaction-count">
                    {allTransactions.length} records
                  </span>
                </div>

                <TransactionList
                  transactions={allTransactions}
                  walletAddress={
                    selectedWallet?.address ||
                    investigation.wallet_address
                  }
                  onTransactionSelect={
                    handleTransactionSelect
                  }
                />
              </section>

              {/* SELECTED DETAILS */}
              {(selectedWallet ||
                selectedTransaction) && (
                <section className="details-section">
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">
                        DETAILS
                      </span>

                      <h2>
                        Selected activity
                      </h2>
                    </div>
                  </div>

                  <div className="details-grid">

                    {selectedWallet && (
                      <div className="detail-panel">
                        <h3>
                          Wallet
                        </h3>

                        <div className="detail-address">
                          {selectedWallet.address}
                        </div>

                        <div className="detail-row">
                          <span>Hop</span>
                          <strong>
                            {selectedWallet.hop ?? "—"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Entity</span>
                          <strong>
                            {getEntityName(
                              selectedWallet
                            ) || "Unknown"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Category</span>
                          <strong>
                            {getEntityCategory(
                              selectedWallet
                            ) || "Unknown"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Transactions</span>
                          <strong>
                            {
                              selectedWallet.transaction_count
                            }
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Incoming</span>
                          <strong>
                            {
                              selectedWallet.incoming_transaction_count
                            }
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Outgoing</span>
                          <strong>
                            {
                              selectedWallet.outgoing_transaction_count
                            }
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Counterpart wallets</span>
                          <strong>
                            {
                              selectedWallet.counterpart_wallet_count
                            }
                          </strong>
                        </div>

                        <div className="detail-assets">
                          <span>Assets</span>

                          <div className="asset-list">
                            {selectedWallet.assets?.length >
                            0 ? (
                              selectedWallet.assets.map(
                                (asset) => (
                                  <span
                                    className="asset-chip"
                                    key={asset}
                                  >
                                    {asset}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="muted">
                                No assets available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTransaction && (
                      <div className="detail-panel">
                        <h3>
                          Transaction
                        </h3>

                        <div className="detail-address">
                          {selectedTransaction.hash ||
                            "Transaction hash unavailable"}
                        </div>

                        <div className="detail-row">
                          <span>Direction</span>
                          <strong
                            className={
                              selectedTransaction.direction ===
                              "incoming"
                                ? "text-incoming"
                                : selectedTransaction.direction ===
                                  "outgoing"
                                ? "text-outgoing"
                                : ""
                            }
                          >
                            {selectedTransaction.direction ||
                              "Unknown"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>From</span>
                          <strong>
                            {selectedTransaction.from_address ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>To</span>
                          <strong>
                            {selectedTransaction.to_address ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Asset</span>
                          <strong>
                            {selectedTransaction.token_symbol ||
                              selectedTransaction.asset ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Value</span>
                          <strong>
                            {selectedTransaction.value ??
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Type</span>
                          <strong>
                            {selectedTransaction.transaction_type ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Block</span>
                          <strong>
                            {selectedTransaction.block_number ||
                              "—"}
                          </strong>
                        </div>

                        <div className="detail-row">
                          <span>Status</span>
                          <strong>
                            {selectedTransaction.is_error
                              ? "Failed"
                              : "Success"}
                          </strong>
                        </div>
                      </div>
                    )}

                  </div>
                </section>
              )}
            </>
          )}

        {/* INITIAL STATE */}
        {!loading &&
          !hasInvestigated && (
            <section className="initial-panel">
              <div className="initial-icon">
                ◎
              </div>

              <h2>
                Ready to investigate
              </h2>

              <p>
                Enter an Ethereum wallet address above to
                trace its blockchain activity.
              </p>
            </section>
          )}
      </div>
    </main>
  );
}