import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../styles/dashboard.css";

/* =========================================================
   BASIC HELPERS
========================================================= */

function firstDefined(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  );
}

function shortenAddress(
  address,
  start = 8,
  end = 6
) {
  if (!address) {
    return "Unknown";
  }

  const text = String(address);

  if (text.length <= start + end + 3) {
    return text;
  }

  return `${text.slice(
    0,
    start
  )}...${text.slice(-end)}`;
}

function formatNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString();
}

function formatValue(value, asset = "") {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  return `${value} ${asset || ""}`.trim();
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "—";
  }

  const numeric = Number(timestamp);

  if (Number.isNaN(numeric)) {
    return String(timestamp);
  }

  const date = new Date(
    numeric < 100000000000
      ? numeric * 1000
      : numeric
  );

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function toNumber(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

/* =========================================================
   ENTITY HELPERS
========================================================= */

function getEntityName(wallet) {
  return firstDefined(
    wallet?.entity_name,
    wallet?.entity?.name,
    wallet?.name_tag,
    wallet?.entity_tag,
    wallet?.label,
    null
  );
}

function getEntityCategory(wallet) {
  return firstDefined(
    wallet?.entity_category,
    wallet?.entity?.category,
    wallet?.category,
    wallet?.label_category,
    null
  );
}

/* =========================================================
   TRANSACTION HELPERS
========================================================= */

function getTransactionFrom(tx) {
  return (
    tx?.from_address ||
    tx?.from ||
    tx?.sender ||
    ""
  );
}

function getTransactionTo(tx) {
  return (
    tx?.to_address ||
    tx?.to ||
    tx?.receiver ||
    ""
  );
}

function getTransactionHash(tx) {
  return (
    tx?.hash ||
    tx?.transaction_hash ||
    tx?.tx_hash ||
    ""
  );
}

function getTransactionAsset(tx) {
  return (
    tx?.token_symbol ||
    tx?.asset ||
    tx?.symbol ||
    tx?.token ||
    "Unknown"
  );
}

function getTransactionType(tx) {
  return (
    tx?.transaction_type ||
    tx?.type ||
    tx?.transactionType ||
    "Unknown"
  );
}

function getTransactionValue(tx) {
  return firstDefined(
    tx?.value,
    tx?.amount,
    tx?.token_value,
    null
  );
}

function getTransactionHop(tx) {
  return firstDefined(
    tx?.hop,
    tx?.hop_number,
    null
  );
}

function getDirection(
  tx,
  walletAddress = ""
) {
  if (tx?.direction) {
    return String(
      tx.direction
    ).toLowerCase();
  }

  const from =
    getTransactionFrom(tx).toLowerCase();

  const to =
    getTransactionTo(tx).toLowerCase();

  const wallet =
    walletAddress.toLowerCase();

  if (wallet && from === wallet) {
    return "outgoing";
  }

  if (wallet && to === wallet) {
    return "incoming";
  }

  return "unknown";
}

/* =========================================================
   RISK HELPERS
========================================================= */

function getRiskObject(source) {
  return (
    source?.risk ||
    source?.risk_assessment ||
    source?.riskAssessment ||
    source?.assessment ||
    source?.risk_summary ||
    source?.summary?.risk ||
    {}
  );
}

function getRiskScore(source) {
  const risk = getRiskObject(source);

  return firstDefined(
    risk?.overall_risk_score,
    risk?.risk_score,
    risk?.score,
    source?.overall_risk_score,
    source?.risk_score,
    null
  );
}

function getRiskLevel(source) {
  const risk = getRiskObject(source);

  return firstDefined(
    risk?.overall_risk_level,
    risk?.risk_level,
    risk?.level,
    source?.overall_risk_level,
    source?.risk_level,
    null
  );
}

function getRiskReasons(source) {
  const risk = getRiskObject(source);

  const reasons = firstDefined(
    risk?.risk_reasons,
    risk?.reasons,
    risk?.risk_factors,
    risk?.factors,
    source?.risk_reasons,
    source?.risk_factors,
    []
  );

  if (Array.isArray(reasons)) {
    return reasons;
  }

  if (typeof reasons === "string") {
    return [reasons];
  }

  return [];
}

function getWalletRisk(wallet) {
  return {
    score: firstDefined(
      wallet?.risk_score,
      wallet?.overall_risk_score,
      wallet?.risk?.score,
      wallet?.risk?.risk_score,
      null
    ),

    level: firstDefined(
      wallet?.risk_level,
      wallet?.overall_risk_level,
      wallet?.risk?.level,
      wallet?.risk?.risk_level,
      null
    ),

    reasons:
      wallet?.risk_reasons ||
      wallet?.risk_factors ||
      wallet?.risk?.reasons ||
      wallet?.risk?.risk_reasons ||
      [],
  };
}

function normalizeRiskLevel(level) {
  if (!level) {
    return "unknown";
  }

  return String(level)
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/* =========================================================
   WALLET HELPERS
========================================================= */

function getWalletTransactions(
  wallet,
  allTransactions
) {
  if (
    Array.isArray(wallet?.transactions)
  ) {
    return wallet.transactions;
  }

  if (!wallet?.address) {
    return [];
  }

  const address =
    wallet.address.toLowerCase();

  return allTransactions.filter(
    (tx) => {
      const from =
        getTransactionFrom(tx).toLowerCase();

      const to =
        getTransactionTo(tx).toLowerCase();

      return (
        from === address ||
        to === address
      );
    }
  );
}

function getWalletAssets(
  wallet,
  transactions
) {
  const backendAssets = firstDefined(
    wallet?.assets,
    wallet?.assets_tokens,
    wallet?.tokens,
    null
  );

  if (Array.isArray(backendAssets)) {
    return backendAssets;
  }

  const set = new Set();

  transactions.forEach((tx) => {
    const asset =
      getTransactionAsset(tx);

    if (asset) {
      set.add(asset);
    }
  });

  return Array.from(set);
}

function getWalletStats(
  wallet,
  allTransactions
) {
  const transactions =
    getWalletTransactions(
      wallet,
      allTransactions
    );

  let incoming = 0;
  let outgoing = 0;

  const counterparties = new Set();

  transactions.forEach((tx) => {
    const direction =
      getDirection(
        tx,
        wallet?.address || ""
      );

    if (direction === "incoming") {
      incoming += 1;
    }

    if (direction === "outgoing") {
      outgoing += 1;
    }

    const from =
      getTransactionFrom(tx);

    const to =
      getTransactionTo(tx);

    const walletAddress =
      wallet?.address?.toLowerCase();

    if (
      direction === "incoming" &&
      from
    ) {
      counterparties.add(
        from.toLowerCase()
      );
    }

    if (
      direction === "outgoing" &&
      to
    ) {
      counterparties.add(
        to.toLowerCase()
      );
    }

    if (
      !walletAddress &&
      from &&
      to
    ) {
      counterparties.add(
        from.toLowerCase()
      );

      counterparties.add(
        to.toLowerCase()
      );
    }
  });

  const backendIncoming =
    firstDefined(
      wallet?.incoming_transaction_count,
      wallet?.incoming_count,
      wallet?.incoming_transactions,
      null
    );

  const backendOutgoing =
    firstDefined(
      wallet?.outgoing_transaction_count,
      wallet?.outgoing_count,
      wallet?.outgoing_transactions,
      null
    );

  const backendCounterparties =
    firstDefined(
      wallet?.unique_counterpart_count,
      wallet?.counterpart_count,
      wallet?.unique_counterparties,
      null
    );

  return {
    transactions:
      firstDefined(
        wallet?.transaction_count,
        wallet?.transactions_count,
        transactions.length
      ),

    incoming:
      backendIncoming ??
      incoming,

    outgoing:
      backendOutgoing ??
      outgoing,

    counterparties:
      backendCounterparties ??
      counterparties.size,

    assets:
      getWalletAssets(
        wallet,
        transactions
      ),
  };
}

/* =========================================================
   EDGE NORMALIZATION
========================================================= */

function normalizeEdges(
  edges,
  transactions
) {
  if (
    Array.isArray(edges) &&
    edges.length > 0
  ) {
    return edges.map(
      (edge, index) => ({
        id:
          edge?.id ||
          edge?.edge_id ||
          edge?.transaction_hash ||
          edge?.hash ||
          `edge-${index}`,

        from:
          edge?.from ||
          edge?.from_address ||
          edge?.source ||
          "",

        to:
          edge?.to ||
          edge?.to_address ||
          edge?.target ||
          "",

        hash:
          edge?.hash ||
          edge?.transaction_hash ||
          edge?.tx_hash ||
          "",

        asset:
          edge?.asset ||
          edge?.token_symbol ||
          edge?.symbol ||
          "Unknown",

        value:
          firstDefined(
            edge?.value,
            edge?.amount,
            ""
          ),

        transactionType:
          edge?.transaction_type ||
          edge?.type ||
          "Unknown",

        direction:
          edge?.direction ||
          "unknown",

        hop:
          firstDefined(
            edge?.hop,
            edge?.hop_number,
            null
          ),

        timestamp:
          edge?.timestamp ||
          null,
      })
    );
  }

  if (
    Array.isArray(transactions)
  ) {
    return transactions
      .filter(
        (tx) =>
          getTransactionFrom(tx) &&
          getTransactionTo(tx)
      )
      .map(
        (tx, index) => ({
          id:
            getTransactionHash(tx) ||
            `tx-edge-${index}`,

          from:
            getTransactionFrom(tx),

          to:
            getTransactionTo(tx),

          hash:
            getTransactionHash(tx),

          asset:
            getTransactionAsset(tx),

          value:
            getTransactionValue(tx),

          transactionType:
            getTransactionType(tx),

          direction:
            tx?.direction ||
            "unknown",

          hop:
            getTransactionHop(tx),

          timestamp:
            tx?.timestamp ||
            null,
        })
      );
  }

  return [];
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  subtitle,
}) {
  return (
    <div className="analytics-stat-card">
      <span className="analytics-stat-label">
        {label}
      </span>

      <strong className="analytics-stat-value">
        {value}
      </strong>

      {subtitle && (
        <span className="analytics-stat-subtitle">
          {subtitle}
        </span>
      )}
    </div>
  );
}

function RiskBadge({
  level,
}) {
  const normalized =
    normalizeRiskLevel(level);

  return (
    <span
      className={`risk-badge ${normalized}`}
    >
      {level || "Not provided"}
    </span>
  );
}

function EntityBadge({
  wallet,
}) {
  const entity =
    getEntityName(wallet);

  const category =
    getEntityCategory(wallet);

  if (!entity && !category) {
    return (
      <span className="entity-badge unknown">
        Unknown entity
      </span>
    );
  }

  return (
    <span className="entity-badge known">
      <span className="entity-dot" />

      <span>
        {entity || "Known entity"}

        {category && (
          <small>{category}</small>
        )}
      </span>
    </span>
  );
}

/* =========================================================
   RISK SUMMARY
========================================================= */

function RiskSummary({
  response,
  wallets,
}) {
  const riskScore =
    getRiskScore(response);

  const riskLevel =
    getRiskLevel(response);

  const riskReasons =
    getRiskReasons(response);

  const risk =
    getRiskObject(response);

  const distribution =
    firstDefined(
      risk?.wallet_distribution,
      risk?.risk_distribution,
      response?.wallet_risk_distribution,
      response?.risk_distribution,
      {}
    );

  const high =
    firstDefined(
      distribution?.high,
      risk?.high_risk_wallets,
      response?.high_risk_wallets,
      wallets.filter(
        (wallet) =>
          normalizeRiskLevel(
            getWalletRisk(wallet).level
          ) === "high"
      ).length
    );

  const medium =
    firstDefined(
      distribution?.medium,
      risk?.medium_risk_wallets,
      response?.medium_risk_wallets,
      wallets.filter(
        (wallet) =>
          normalizeRiskLevel(
            getWalletRisk(wallet).level
          ) === "medium"
      ).length
    );

  const low =
    firstDefined(
      distribution?.low,
      risk?.low_risk_wallets,
      response?.low_risk_wallets,
      wallets.filter(
        (wallet) =>
          normalizeRiskLevel(
            getWalletRisk(wallet).level
          ) === "low"
      ).length
    );

  return (
    <section className="risk-summary-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            RISK ASSESSMENT
          </span>

          <h2>
            Investigation risk overview
          </h2>

          <p>
            Risk values shown here are supplied by
            the investigation API.
          </p>
        </div>
      </div>

      <div className="risk-overview-grid">
        <div className="overall-risk-card">
          <span>
            Overall risk score
          </span>

          <strong>
            {riskScore !== null &&
            riskScore !== undefined
              ? formatNumber(riskScore)
              : "Not provided"}
          </strong>

          <RiskBadge
            level={riskLevel}
          />
        </div>

        <div className="risk-distribution-card">
          <div className="distribution-header">
            <span>
              Wallet risk distribution
            </span>
          </div>

          <div className="distribution-grid">
            <div className="distribution-item high">
              <strong>
                {formatNumber(high)}
              </strong>

              <span>High</span>
            </div>

            <div className="distribution-item medium">
              <strong>
                {formatNumber(medium)}
              </strong>

              <span>Medium</span>
            </div>

            <div className="distribution-item low">
              <strong>
                {formatNumber(low)}
              </strong>

              <span>Low</span>
            </div>
          </div>
        </div>
      </div>

      <div className="risk-reasons-card">
        <div>
          <span className="section-kicker">
            CONTRIBUTING FACTORS
          </span>

          <h3>
            Major risk factors / reasons
          </h3>
        </div>

        {riskReasons.length === 0 ? (
          <div className="not-provided">
            No risk reasons were provided by the
            API.
          </div>
        ) : (
          <div className="risk-reason-list">
            {riskReasons.map(
              (reason, index) => (
                <div
                  className="risk-reason"
                  key={`${reason}-${index}`}
                >
                  <span>•</span>

                  <span>
                    {typeof reason ===
                    "object"
                      ? reason.reason ||
                        reason.description ||
                        JSON.stringify(
                          reason
                        )
                      : String(reason)}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   INVESTIGATION SUMMARY
========================================================= */

function InvestigationSummary({
  response,
  wallets,
  transactions,
  edges,
}) {
  const summary =
    response?.summary || {};

  const analytics =
    response?.analytics ||
    response?.investigation_analytics ||
    {};

  const incoming =
    firstDefined(
      analytics?.incoming_transactions,
      analytics?.incoming_count,
      summary?.incoming_transactions,
      summary?.incoming_count,
      response?.incoming_transaction_count,
      null
    );

  const outgoing =
    firstDefined(
      analytics?.outgoing_transactions,
      analytics?.outgoing_count,
      summary?.outgoing_transactions,
      summary?.outgoing_count,
      response?.outgoing_transaction_count,
      null
    );

  const incomingValue =
    firstDefined(
      analytics?.incoming_value,
      analytics?.total_incoming_value,
      summary?.incoming_value,
      response?.incoming_value,
      null
    );

  const outgoingValue =
    firstDefined(
      analytics?.outgoing_value,
      analytics?.total_outgoing_value,
      summary?.outgoing_value,
      response?.outgoing_value,
      null
    );

  const totalValue =
    firstDefined(
      analytics?.total_value,
      summary?.total_value,
      response?.total_value,
      null
    );

  const netValue =
    firstDefined(
      analytics?.net_value,
      summary?.net_value,
      response?.net_value,
      null
    );

  const walletsCount =
    firstDefined(
      summary?.total_wallets_traced,
      summary?.wallets_traced,
      response?.total_wallets_traced,
      wallets.length
    );

  const transactionsCount =
    firstDefined(
      summary?.total_transactions,
      transactions.length
    );

  const relationshipsCount =
    firstDefined(
      summary?.total_relationships,
      edges.length
    );

  const known =
    firstDefined(
      summary?.known_entities,
      response?.known_entities,
      wallets.filter(
        (wallet) =>
          getEntityName(wallet) ||
          getEntityCategory(wallet)
      ).length
    );

  const unknown =
    firstDefined(
      summary?.unknown_entities,
      response?.unknown_entities,
      wallets.length - known
    );

  return (
    <section className="summary-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            INVESTIGATION SUMMARY
          </span>

          <h2>
            Investigation analytics
          </h2>
        </div>
      </div>

      <div className="investigation-stat-grid">
        <StatCard
          label="Wallets traced"
          value={formatNumber(
            walletsCount
          )}
        />

        <StatCard
          label="Transactions"
          value={formatNumber(
            transactionsCount
          )}
        />

        <StatCard
          label="Relationships"
          value={formatNumber(
            relationshipsCount
          )}
        />

        <StatCard
          label="Incoming"
          value={
            incoming === null
              ? "—"
              : formatNumber(incoming)
          }
        />

        <StatCard
          label="Outgoing"
          value={
            outgoing === null
              ? "—"
              : formatNumber(outgoing)
          }
        />

        <StatCard
          label="Known entities"
          value={formatNumber(known)}
        />

        <StatCard
          label="Unknown entities"
          value={formatNumber(unknown)}
        />

        <StatCard
          label="Total value"
          value={
            totalValue === null
              ? "—"
              : formatNumber(totalValue)
          }
        />

        <StatCard
          label="Net value"
          value={
            netValue === null
              ? "—"
              : formatNumber(netValue)
          }
        />
      </div>

      <div className="value-analytics-grid">
        <div className="value-card incoming-value">
          <span>Incoming value</span>

          <strong>
            {incomingValue === null
              ? "Not provided"
              : formatNumber(
                  incomingValue
                )}
          </strong>
        </div>

        <div className="value-card outgoing-value">
          <span>Outgoing value</span>

          <strong>
            {outgoingValue === null
              ? "Not provided"
              : formatNumber(
                  outgoingValue
                )}
          </strong>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FILTERS
========================================================= */

function FilterBar({
  filters,
  setFilters,
  wallets,
  assets,
  transactionTypes,
  hops,
}) {
  function update(
    name,
    value
  ) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function reset() {
    setFilters({
      wallet: "",
      asset: "",
      type: "",
      direction: "",
      hop: "",
    });
  }

  const hasFilters =
    Object.values(filters).some(
      Boolean
    );

  return (
    <div className="filter-bar">
      <div className="filter-heading">
        <span className="section-kicker">
          FILTERS
        </span>

        <strong>
          Investigation data
        </strong>
      </div>

      <select
        value={filters.wallet}
        onChange={(event) =>
          update(
            "wallet",
            event.target.value
          )
        }
      >
        <option value="">
          All wallets
        </option>

        {wallets.map((wallet) => (
          <option
            key={wallet.address}
            value={wallet.address}
          >
            {shortenAddress(
              wallet.address,
              10,
              8
            )}
          </option>
        ))}
      </select>

      <select
        value={filters.asset}
        onChange={(event) =>
          update(
            "asset",
            event.target.value
          )
        }
      >
        <option value="">
          All assets
        </option>

        {assets.map((asset) => (
          <option
            key={asset}
            value={asset}
          >
            {asset}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(event) =>
          update(
            "type",
            event.target.value
          )
        }
      >
        <option value="">
          All transaction types
        </option>

        {transactionTypes.map(
          (type) => (
            <option
              key={type}
              value={type}
            >
              {type}
            </option>
          )
        )}
      </select>

      <select
        value={filters.direction}
        onChange={(event) =>
          update(
            "direction",
            event.target.value
          )
        }
      >
        <option value="">
          All directions
        </option>

        <option value="incoming">
          Incoming
        </option>

        <option value="outgoing">
          Outgoing
        </option>
      </select>

      <select
        value={filters.hop}
        onChange={(event) =>
          update(
            "hop",
            event.target.value
          )
        }
      >
        <option value="">
          All hops
        </option>

        {hops.map((hop) => (
          <option
            key={hop}
            value={hop}
          >
            Hop {hop}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          className="clear-filter-button"
          onClick={reset}
        >
          Clear
        </button>
      )}
    </div>
  );
}

/* =========================================================
   RISK TABLE
========================================================= */

function WalletRiskTable({
  wallets,
  selectedWallet,
  onSelectWallet,
}) {
  if (wallets.length === 0) {
    return (
      <div className="empty-state">
        No wallet risk data was returned.
      </div>
    );
  }

  return (
    <div className="risk-table-wrapper">
      <table className="risk-table">
        <thead>
          <tr>
            <th>Wallet</th>
            <th>Hop</th>
            <th>Entity</th>
            <th>Risk score</th>
            <th>Risk level</th>
            <th>Transactions</th>
          </tr>
        </thead>

        <tbody>
          {wallets.map(
            (wallet) => {
              const risk =
                getWalletRisk(wallet);

              const selected =
                selectedWallet?.address?.toLowerCase() ===
                wallet.address?.toLowerCase();

              return (
                <tr
                  key={wallet.address}
                  className={
                    selected
                      ? "selected-row"
                      : ""
                  }
                  onClick={() =>
                    onSelectWallet(wallet)
                  }
                >
                  <td>
                    <code>
                      {shortenAddress(
                        wallet.address
                      )}
                    </code>
                  </td>

                  <td>
                    {wallet.hop ??
                      "—"}
                  </td>

                  <td>
                    <EntityBadge
                      wallet={wallet}
                    />
                  </td>

                  <td>
                    {risk.score ===
                    null ||
                    risk.score ===
                      undefined
                      ? "Not provided"
                      : formatNumber(
                          risk.score
                        )}
                  </td>

                  <td>
                    <RiskBadge
                      level={
                        risk.level
                      }
                    />
                  </td>

                  <td>
                    {formatNumber(
                      firstDefined(
                        wallet?.transaction_count,
                        wallet?.transactions_count,
                        wallet?.transactions
                          ?.length,
                        0
                      )
                    )}
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   WALLET DETAIL
========================================================= */

function WalletDetail({
  wallet,
  transactions,
}) {
  if (!wallet) {
    return (
      <div className="empty-state">
        Select a wallet to inspect its risk
        and activity.
      </div>
    );
  }

  const stats =
    getWalletStats(
      wallet,
      transactions
    );

  const risk =
    getWalletRisk(wallet);

  const walletTransactions =
    getWalletTransactions(
      wallet,
      transactions
    );

  const incomingValue =
    wallet?.incoming_value ??
    wallet?.total_incoming_value ??
    wallet?.analytics
      ?.incoming_value ??
    null;

  const outgoingValue =
    wallet?.outgoing_value ??
    wallet?.total_outgoing_value ??
    wallet?.analytics
      ?.outgoing_value ??
    null;

  return (
    <div className="wallet-detail">
      <div className="wallet-detail-header">
        <div>
          <span className="section-kicker">
            SELECTED WALLET
          </span>

          <h2>
            {shortenAddress(
              wallet.address,
              12,
              10
            )}
          </h2>

          <code className="full-wallet-address">
            {wallet.address}
          </code>
        </div>

        <RiskBadge
          level={risk.level}
        />
      </div>

      <div className="wallet-risk-strip">
        <div>
          <span>Risk score</span>

          <strong>
            {risk.score === null ||
            risk.score === undefined
              ? "Not provided"
              : formatNumber(
                  risk.score
                )}
          </strong>
        </div>

        <div>
          <span>Risk level</span>

          <strong>
            {risk.level ||
              "Not provided"}
          </strong>
        </div>

        <div>
          <span>Hop</span>

          <strong>
            {wallet.hop ??
              "—"}
          </strong>
        </div>
      </div>

      <div className="wallet-detail-entity">
        <EntityBadge
          wallet={wallet}
        />
      </div>

      <div className="wallet-activity-grid">
        <div>
          <span>Transactions</span>

          <strong>
            {formatNumber(
              stats.transactions
            )}
          </strong>
        </div>

        <div className="incoming">
          <span>Incoming</span>

          <strong>
            {formatNumber(
              stats.incoming
            )}
          </strong>
        </div>

        <div className="outgoing">
          <span>Outgoing</span>

          <strong>
            {formatNumber(
              stats.outgoing
            )}
          </strong>
        </div>

        <div>
          <span>Counterparties</span>

          <strong>
            {formatNumber(
              stats.counterparties
            )}
          </strong>
        </div>
      </div>

      <div className="wallet-value-grid">
        <div>
          <span>
            Incoming value
          </span>

          <strong>
            {incomingValue === null
              ? "Not provided"
              : formatNumber(
                  incomingValue
                )}
          </strong>
        </div>

        <div>
          <span>
            Outgoing value
          </span>

          <strong>
            {outgoingValue === null
              ? "Not provided"
              : formatNumber(
                  outgoingValue
                )}
          </strong>
        </div>
      </div>

      <div className="detail-block">
        <h3>
          Risk reasons
        </h3>

        {Array.isArray(
          risk.reasons
        ) &&
        risk.reasons.length > 0 ? (
          <ul className="wallet-risk-reasons">
            {risk.reasons.map(
              (reason, index) => (
                <li
                  key={index}
                >
                  {typeof reason ===
                  "object"
                    ? reason.reason ||
                      reason.description ||
                      JSON.stringify(
                        reason
                      )
                    : String(reason)}
                </li>
              )
            )}
          </ul>
        ) : (
          <span className="not-provided">
            No wallet-level risk reasons
            were provided by the API.
          </span>
        )}
      </div>

      <div className="detail-block">
        <h3>
          Assets
        </h3>

        {stats.assets.length >
        0 ? (
          <div className="asset-list">
            {stats.assets.map(
              (asset) => (
                <span
                  className="asset-pill"
                  key={asset}
                >
                  {asset}
                </span>
              )
            )}
          </div>
        ) : (
          <span className="not-provided">
            No asset data provided.
          </span>
        )}
      </div>

      <div className="detail-block">
        <h3>
          Activity
        </h3>

        <span className="not-provided">
          {formatNumber(
            walletTransactions.length
          )}{" "}
          transactions associated with
          this wallet in the returned
          investigation.
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   RELATIONSHIP GRAPH
========================================================= */

function RelationshipGraph({
  wallets,
  edges,
  selectedWallet,
  onSelectWallet,
  onSelectEdge,
}) {
  const groups =
    useMemo(() => {
      const result = {};

      wallets.forEach(
        (wallet) => {
          const hop =
            wallet.hop ?? 0;

          if (!result[hop]) {
            result[hop] = [];
          }

          result[hop].push(wallet);
        }
      );

      return result;
    }, [wallets]);

  const hops =
    Object.keys(groups)
      .map(Number)
      .sort(
        (a, b) => a - b
      );

  return (
    <div className="relationship-graph">
      {hops.length === 0 ? (
        <div className="empty-state">
          No wallet graph data was returned.
        </div>
      ) : (
        <div className="hop-columns">
          {hops.map(
            (hop, index) => (
              <React.Fragment
                key={hop}
              >
                <div className="hop-column">
                  <div className="hop-title">
                    {hop === 0
                      ? "Starting wallet"
                      : `Hop ${hop}`}
                  </div>

                  <div className="hop-wallets">
                    {groups[
                      hop
                    ].map(
                      (wallet) => {
                        const selected =
                          selectedWallet?.address?.toLowerCase() ===
                          wallet.address?.toLowerCase();

                        return (
                          <button
                            type="button"
                            key={
                              wallet.address
                            }
                            className={`graph-wallet ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                            onClick={() =>
                              onSelectWallet(
                                wallet
                              )
                            }
                          >
                            <strong>
                              {shortenAddress(
                                wallet.address,
                                7,
                                5
                              )}
                            </strong>

                            <span>
                              {getEntityName(
                                wallet
                              ) ||
                                "Unknown"}
                            </span>

                            <RiskBadge
                              level={
                                getWalletRisk(
                                  wallet
                                ).level
                              }
                            />
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {index <
                  hops.length -
                    1 && (
                  <div className="hop-arrow">
                    →
                  </div>
                )}
              </React.Fragment>
            )
          )}
        </div>
      )}

      <div className="edge-list">
        <div className="edge-list-header">
          <div>
            <span className="section-kicker">
              RELATIONSHIPS
            </span>

            <h3>
              Real backend relationships
            </h3>
          </div>

          <span>
            {formatNumber(
              edges.length
            )}
          </span>
        </div>

        {edges.length === 0 ? (
          <div className="not-provided">
            No relationship edges were returned
            by the API.
          </div>
        ) : (
          edges.map(
            (edge) => (
              <button
                type="button"
                key={edge.id}
                className="edge-row"
                onClick={() =>
                  onSelectEdge(
                    edge
                  )
                }
              >
                <div>
                  <code>
                    {shortenAddress(
                      edge.from
                    )}
                  </code>

                  <strong>
                    →
                  </strong>

                  <code>
                    {shortenAddress(
                      edge.to
                    )}
                  </code>
                </div>

                <div>
                  <span className="asset-pill">
                    {edge.asset}
                  </span>

                  <span>
                    {edge.transactionType}
                  </span>

                  <span>
                    {edge.direction}
                  </span>

                  {edge.hop !==
                    null && (
                    <span>
                      H{edge.hop}
                    </span>
                  )}
                </div>
              </button>
            )
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TRANSACTION TABLE
========================================================= */

function TransactionTable({
  transactions,
  onSelectTransaction,
}) {
  if (
    transactions.length === 0
  ) {
    return (
      <div className="empty-state">
        No transactions match the current
        filters.
      </div>
    );
  }

  return (
    <div className="transaction-table-wrapper">
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Hash</th>
            <th>Direction</th>
            <th>From</th>
            <th>To</th>
            <th>Asset</th>
            <th>Type</th>
            <th>Value</th>
            <th>Hop</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {transactions.map(
            (tx, index) => {
              const normalized = {
                hash:
                  getTransactionHash(
                    tx
                  ),

                from:
                  getTransactionFrom(
                    tx
                  ),

                to:
                  getTransactionTo(
                    tx
                  ),

                asset:
                  getTransactionAsset(
                    tx
                  ),

                type:
                  getTransactionType(
                    tx
                  ),

                value:
                  getTransactionValue(
                    tx
                  ),

                hop:
                  getTransactionHop(
                    tx
                  ),

                direction:
                  tx?.direction ||
                  "unknown",

                timestamp:
                  tx?.timestamp,
              };

              return (
                <tr
                  key={
                    normalized.hash ||
                    `${index}-${normalized.from}-${normalized.to}`
                  }
                  onClick={() =>
                    onSelectTransaction(
                      normalized
                    )
                  }
                >
                  <td>
                    <code>
                      {shortenAddress(
                        normalized.hash,
                        9,
                        7
                      )}
                    </code>
                  </td>

                  <td>
                    <span
                      className={`direction-badge ${normalized.direction}`}
                    >
                      {
                        normalized.direction
                      }
                    </span>
                  </td>

                  <td>
                    {shortenAddress(
                      normalized.from
                    )}
                  </td>

                  <td>
                    {shortenAddress(
                      normalized.to
                    )}
                  </td>

                  <td>
                    <span className="asset-pill">
                      {
                        normalized.asset
                      }
                    </span>
                  </td>

                  <td>
                    {normalized.type}
                  </td>

                  <td>
                    {formatValue(
                      normalized.value,
                      normalized.asset
                    )}
                  </td>

                  <td>
                    {normalized.hop ??
                      "—"}
                  </td>

                  <td>
                    {formatTimestamp(
                      normalized.timestamp
                    )}
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   TRANSACTION DETAIL
========================================================= */

function TransactionDetail({
  transaction,
}) {
  if (!transaction) {
    return (
      <div className="empty-state compact">
        Select a transaction or relationship
        to inspect it.
      </div>
    );
  }

  return (
    <div className="transaction-detail">
      <span className="section-kicker">
        TRANSACTION
      </span>

      <h3>
        {transaction.asset ||
          "Transaction"}
      </h3>

      <div className="transaction-detail-grid">
        <div>
          <span>Hash</span>

          <code>
            {transaction.hash ||
              "Not provided"}
          </code>
        </div>

        <div>
          <span>From</span>

          <code>
            {transaction.from ||
              "Not provided"}
          </code>
        </div>

        <div>
          <span>To</span>

          <code>
            {transaction.to ||
              "Not provided"}
          </code>
        </div>

        <div>
          <span>Asset</span>

          <strong>
            {transaction.asset ||
              "Not provided"}
          </strong>
        </div>

        <div>
          <span>Value</span>

          <strong>
            {formatValue(
              transaction.value,
              transaction.asset
            )}
          </strong>
        </div>

        <div>
          <span>Transaction type</span>

          <strong>
            {transaction.type ||
              "Not provided"}
          </strong>
        </div>

        <div>
          <span>Direction</span>

          <strong>
            {transaction.direction ||
              "Not provided"}
          </strong>
        </div>

        <div>
          <span>Hop</span>

          <strong>
            {transaction.hop ??
              "Not provided"}
          </strong>
        </div>

        <div>
          <span>Timestamp</span>

          <strong>
            {formatTimestamp(
              transaction.timestamp
            )}
          </strong>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ASSET ANALYTICS
========================================================= */

function AssetAnalytics({
  transactions,
}) {
  const assets =
    useMemo(() => {
      const map = new Map();

      transactions.forEach(
        (tx) => {
          const asset =
            getTransactionAsset(
              tx
            );

          if (!map.has(asset)) {
            map.set(asset, {
              asset,
              transactions: 0,
              totalValue: 0,
            });
          }

          const item =
            map.get(asset);

          item.transactions += 1;

          const value =
            toNumber(
              getTransactionValue(
                tx
              )
            );

          if (value !== null) {
            item.totalValue += value;
          }
        }
      );

      return Array.from(
        map.values()
      ).sort(
        (a, b) =>
          b.transactions -
          a.transactions
      );
    }, [transactions]);

  if (assets.length === 0) {
    return (
      <div className="empty-state compact">
        No asset analytics are available.
      </div>
    );
  }

  const maxTransactions =
    Math.max(
      ...assets.map(
        (item) =>
          item.transactions
      ),
      1
    );

  return (
    <div className="asset-analytics">
      {assets.map(
        (item) => (
          <div
            className="asset-analytics-row"
            key={item.asset}
          >
            <div className="asset-row-header">
              <strong>
                {item.asset}
              </strong>

              <span>
                {formatNumber(
                  item.transactions
                )}{" "}
                transactions
              </span>
            </div>

            <div className="asset-bar">
              <div
                className="asset-bar-fill"
                style={{
                  width: `${
                    (item.transactions /
                      maxTransactions) *
                    100
                  }%`,
                }}
              />
            </div>

            <span className="asset-total-value">
              Value:
              {" "}
              {formatNumber(
                item.totalValue
              )}
            </span>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function InvestigatorDashboard({
  investigation = null,
  data = null,
  result = null,
}) {
  const response =
    investigation ||
    data ||
    result ||
    null;

  const [selectedWallet, setSelectedWallet] =
    useState(null);

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [
    filters,
    setFilters,
  ] = useState({
    wallet: "",
    asset: "",
    type: "",
    direction: "",
    hop: "",
  });

  const wallets =
    Array.isArray(
      response?.wallets
    )
      ? response.wallets
      : [];

  const transactions =
    Array.isArray(
      response?.transactions
    )
      ? response.transactions
      : wallets.flatMap(
          (wallet) =>
            Array.isArray(
              wallet?.transactions
            )
              ? wallet.transactions
              : []
        );

  const edges =
    useMemo(
      () =>
        normalizeEdges(
          response?.edges,
          transactions
        ),
      [
        response,
        transactions,
      ]
    );

  /* -------------------------------------------------------
     Automatically select starting wallet
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      wallets.length > 0 &&
      !selectedWallet
    ) {
      const root =
        wallets.find(
          (wallet) =>
            Number(
              wallet.hop
            ) === 0
        ) ||
        wallets[0];

      setSelectedWallet(
        root
      );
    }
  }, [
    wallets,
    selectedWallet,
  ]);

  /* -------------------------------------------------------
     Filter options
  ------------------------------------------------------- */

  const assets =
    useMemo(() => {
      const set = new Set();

      transactions.forEach(
        (tx) =>
          set.add(
            getTransactionAsset(
              tx
            )
          )
      );

      return Array.from(
        set
      ).sort();
    }, [transactions]);

  const transactionTypes =
    useMemo(() => {
      const set = new Set();

      transactions.forEach(
        (tx) =>
          set.add(
            getTransactionType(
              tx
            )
          )
      );

      return Array.from(
        set
      ).sort();
    }, [transactions]);

  const hops =
    useMemo(() => {
      const set = new Set();

      wallets.forEach(
        (wallet) =>
          set.add(
            wallet.hop ?? 0
          )
      );

      transactions.forEach(
        (tx) => {
          const hop =
            getTransactionHop(
              tx
            );

          if (
            hop !== null &&
            hop !== undefined
          ) {
            set.add(hop);
          }
        }
      );

      return Array.from(
        set
      ).sort(
        (a, b) =>
          Number(a) -
          Number(b)
      );
    }, [
      wallets,
      transactions,
    ]);

  /* -------------------------------------------------------
     Filter transactions
  ------------------------------------------------------- */

  const filteredTransactions =
    useMemo(() => {
      return transactions.filter(
        (tx) => {
          const asset =
            getTransactionAsset(
              tx
            );

          const type =
            getTransactionType(
              tx
            );

          const hop =
            getTransactionHop(
              tx
            );

          const direction =
            String(
              tx?.direction ||
                "unknown"
            ).toLowerCase();

          const from =
            getTransactionFrom(
              tx
            ).toLowerCase();

          const to =
            getTransactionTo(
              tx
            ).toLowerCase();

          const wallet =
            filters.wallet.toLowerCase();

          if (
            wallet &&
            from !== wallet &&
            to !== wallet
          ) {
            return false;
          }

          if (
            filters.asset &&
            asset !== filters.asset
          ) {
            return false;
          }

          if (
            filters.type &&
            type !== filters.type
          ) {
            return false;
          }

          if (
            filters.direction &&
            direction !==
              filters.direction
          ) {
            return false;
          }

          if (
            filters.hop !== "" &&
            String(hop) !==
              String(filters.hop)
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      transactions,
      filters,
    ]);

  /* -------------------------------------------------------
     Filter wallets
  ------------------------------------------------------- */

  const filteredWallets =
    useMemo(() => {
      return wallets.filter(
        (wallet) => {
          if (
            filters.wallet &&
            wallet.address
              ?.toLowerCase() !==
              filters.wallet.toLowerCase()
          ) {
            return false;
          }

          if (
            filters.hop !== "" &&
            String(
              wallet.hop
            ) !==
              String(
                filters.hop
              )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      wallets,
      filters,
    ]);

  /* -------------------------------------------------------
     Filter edges
  ------------------------------------------------------- */

  const filteredEdges =
    useMemo(() => {
      return edges.filter(
        (edge) => {
          if (
            filters.wallet &&
            edge.from
              ?.toLowerCase() !==
              filters.wallet.toLowerCase() &&
            edge.to
              ?.toLowerCase() !==
              filters.wallet.toLowerCase()
          ) {
            return false;
          }

          if (
            filters.asset &&
            edge.asset !==
              filters.asset
          ) {
            return false;
          }

          if (
            filters.type &&
            edge.transactionType !==
              filters.type
          ) {
            return false;
          }

          if (
            filters.direction &&
            String(
              edge.direction
            ).toLowerCase() !==
              filters.direction
          ) {
            return false;
          }

          if (
            filters.hop !== "" &&
            String(
              edge.hop
            ) !==
              String(
                filters.hop
              )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      edges,
      filters,
    ]);

  /* -------------------------------------------------------
     Wallet selection
  ------------------------------------------------------- */

  function handleWalletSelect(
    wallet
  ) {
    setSelectedWallet(
      wallet
    );

    setSelectedTransaction(
      null
    );
  }

  function handleEdgeSelect(
    edge
  ) {
    setSelectedTransaction(
      {
        hash: edge.hash,
        from: edge.from,
        to: edge.to,
        asset: edge.asset,
        value: edge.value,
        type:
          edge.transactionType,
        direction:
          edge.direction,
        hop: edge.hop,
        timestamp:
          edge.timestamp,
      }
    );

    const wallet =
      wallets.find(
        (item) =>
          item.address
            ?.toLowerCase() ===
            edge.from?.toLowerCase() ||
          item.address
            ?.toLowerCase() ===
            edge.to?.toLowerCase()
      );

    if (wallet) {
      setSelectedWallet(
        wallet
      );
    }
  }

  /* -------------------------------------------------------
     Empty state
  ------------------------------------------------------- */

  if (!response) {
    return (
      <main className="dashboard-empty-page">
        <div className="empty-page-card">
          <div className="empty-page-icon">
            ◇
          </div>

          <span className="section-kicker">
            CRYPTOTRACE
          </span>

          <h2>
            Ready for investigation
          </h2>

          <p>
            Enter a real wallet address above
            and run the investigation to load
            the dashboard.
          </p>
        </div>
      </main>
    );
  }

  const startingWallet =
    response?.wallet_address ||
    wallets.find(
      (wallet) =>
        Number(wallet.hop) ===
        0
    )?.address;

  return (
    <main className="investigator-dashboard">
      <div className="dashboard-shell">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              CRYPTOTRACE · FINAL INVESTIGATION
            </span>

            <h1>
              Risk & Investigation
              Assessment
            </h1>

            <p>
              Inspect the real blockchain
              investigation, analytics, wallet
              relationships and API-provided
              risk assessment.
            </p>
          </div>

          <div className="network-badge">
            <span className="network-dot" />

            {response.network ||
              "Network not provided"}
          </div>
        </header>

        {/* =================================================
            TARGET
        ================================================= */}

        <section className="investigation-target">
          <div>
            <span>
              STARTING WALLET
            </span>

            <code>
              {startingWallet ||
                "Not provided"}
            </code>
          </div>

          <div>
            <span>
              MAX HOPS
            </span>

            <strong>
              {response.max_hops ??
                "Not provided"}
            </strong>
          </div>
        </section>

        {/* =================================================
            RISK
        ================================================= */}

        <RiskSummary
          response={response}
          wallets={wallets}
        />

        {/* =================================================
            INVESTIGATION ANALYTICS
        ================================================= */}

        <InvestigationSummary
          response={response}
          wallets={wallets}
          transactions={
            transactions
          }
          edges={edges}
        />

        {/* =================================================
            FILTERS
        ================================================= */}

        <FilterBar
          filters={filters}
          setFilters={
            setFilters
          }
          wallets={wallets}
          assets={assets}
          transactionTypes={
            transactionTypes
          }
          hops={hops}
        />

        {/* =================================================
            WALLET RISK TABLE
        ================================================= */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                WALLET RISK
              </span>

              <h2>
                Wallet risk assessment
              </h2>

              <p>
                Risk values are read directly from
                the returned wallet records.
              </p>
            </div>

            <span className="panel-count">
              {filteredWallets.length}
            </span>
          </div>

          <WalletRiskTable
            wallets={
              filteredWallets
            }
            selectedWallet={
              selectedWallet
            }
            onSelectWallet={
              handleWalletSelect
            }
          />
        </section>

        {/* =================================================
            WALLET DETAIL + TRANSACTION DETAIL
        ================================================= */}

        <section className="detail-layout">

          <div className="dashboard-panel">
            <WalletDetail
              wallet={
                selectedWallet
              }
              transactions={
                filteredTransactions
              }
            />
          </div>

          <div className="dashboard-panel">
            <TransactionDetail
              transaction={
                selectedTransaction
              }
            />
          </div>

        </section>

        {/* =================================================
            GRAPH
        ================================================= */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                RELATIONSHIP ANALYSIS
              </span>

              <h2>
                Wallet relationship graph
              </h2>

              <p>
                Relationships come from the
                investigation response.
              </p>
            </div>

            <span className="panel-count">
              {filteredEdges.length}
            </span>
          </div>

          <RelationshipGraph
            wallets={
              filteredWallets
            }
            edges={
              filteredEdges
            }
            selectedWallet={
              selectedWallet
            }
            onSelectWallet={
              handleWalletSelect
            }
            onSelectEdge={
              handleEdgeSelect
            }
          />
        </section>

        {/* =================================================
            ASSET ANALYTICS
        ================================================= */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                ASSET ANALYTICS
              </span>

              <h2>
                Asset breakdown
              </h2>

              <p>
                Based on the transactions returned
                by the API.
              </p>
            </div>
          </div>

          <AssetAnalytics
            transactions={
              filteredTransactions
            }
          />
        </section>

        {/* =================================================
            TRANSACTIONS
        ================================================= */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                BLOCKCHAIN EVIDENCE
              </span>

              <h2>
                Filtered transactions
              </h2>

              <p>
                Select a transaction for full
                details.
              </p>
            </div>

            <span className="panel-count">
              {filteredTransactions.length}
            </span>
          </div>

          <TransactionTable
            transactions={
              filteredTransactions
            }
            onSelectTransaction={
              setSelectedTransaction
            }
          />
        </section>

      </div>
    </main>
  );
}