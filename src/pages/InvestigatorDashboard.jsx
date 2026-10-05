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

function shortenAddress(address, start = 8, end = 6) {
  if (!address) return "Unknown";

  const text = String(address);

  if (text.length <= start + end + 3) {
    return text;
  }

  return `${text.slice(0, start)}...${text.slice(-end)}`;
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

function formatScore(value) {
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

  return number.toFixed(2);
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
  if (!timestamp) return "—";

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

function normalizeAddress(address) {
  return String(address || "").toLowerCase();
}

/* =========================================================
   ANALYTICS HELPERS
========================================================= */

function getAnalytics(response) {
  return (
    response?.analytics ||
    response?.investigation_analytics ||
    {}
  );
}

function getEntityProfiles(response) {
  return (
    getAnalytics(response)
      ?.entity_analysis
      ?.wallet_profiles || []
  );
}

function getBehaviorProfiles(response) {
  return (
    getAnalytics(response)
      ?.wallet_behavior
      ?.wallet_profiles || []
  );
}

function getRiskWallets(response) {
  return (
    getAnalytics(response)
      ?.wallet_risks
      ?.wallet_risks || []
  );
}

function getRiskFactorWallets(response) {
  return (
    getAnalytics(response)
      ?.risk_factors
      ?.wallet_factors || []
  );
}

function findEntityProfile(response, address) {
  const normalized =
    normalizeAddress(address);

  return getEntityProfiles(response).find(
    (item) =>
      normalizeAddress(item?.wallet) ===
      normalized
  );
}

function findBehaviorProfile(response, address) {
  const normalized =
    normalizeAddress(address);

  return getBehaviorProfiles(response).find(
    (item) =>
      normalizeAddress(item?.wallet) ===
      normalized
  );
}

function findRiskWallet(response, address) {
  const normalized =
    normalizeAddress(address);

  return getRiskWallets(response).find(
    (item) =>
      normalizeAddress(item?.wallet) ===
      normalized
  );
}

function findRiskFactors(response, address) {
  const normalized =
    normalizeAddress(address);

  return getRiskFactorWallets(response).find(
    (item) =>
      normalizeAddress(item?.wallet) ===
      normalized
  );
}

/* =========================================================
   ENTITY HELPERS
========================================================= */

function getEntityName(wallet, response = null) {
  const direct =
    firstDefined(
      wallet?.entity_name,
      wallet?.entity?.entity_name,
      wallet?.entity?.name_tag,
      wallet?.entity?.name,
      wallet?.name_tag,
      wallet?.entity_tag,
      wallet?.label
    );

  if (direct) return direct;

  if (response && wallet?.address) {
    const profile =
      findEntityProfile(
        response,
        wallet.address
      );

    return firstDefined(
      profile?.entity?.entity_name,
      profile?.entity?.name_tag,
      profile?.entity?.name
    );
  }

  return null;
}

function getEntityCategory(wallet, response = null) {
  const direct =
    firstDefined(
      wallet?.entity_category,
      wallet?.entity?.label_category,
      wallet?.entity?.category,
      wallet?.category,
      wallet?.label_category
    );

  if (direct) return direct;

  if (response && wallet?.address) {
    const profile =
      findEntityProfile(
        response,
        wallet.address
      );

    return firstDefined(
      profile?.entity?.label_category,
      profile?.entity?.category
    );
  }

  return null;
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

/*
 * Determine the asset.
 *
 * Normal ERC-20 transfers normally contain a token symbol.
 * Native Ethereum transactions may not, so normal ETH
 * transactions are identified from the transaction type.
 */
function getTransactionAsset(tx) {
  const explicitAsset =
    firstDefined(
      tx?.token_symbol,
      tx?.tokenSymbol,
      tx?.asset,
      tx?.symbol
    );

  if (explicitAsset) {
    return String(explicitAsset);
  }

  const type =
    String(
      getTransactionType(tx)
    ).toLowerCase();

  const hasTokenMetadata =
    tx?.token_decimal !== undefined ||
    tx?.token_decimals !== undefined ||
    tx?.tokenDecimal !== undefined ||
    tx?.decimals !== undefined ||
    tx?.contract_address !== undefined ||
    tx?.contractAddress !== undefined;

  if (
    !hasTokenMetadata &&
    (
      type.includes("normal") ||
      type.includes("internal") ||
      type.includes("native") ||
      type === "transaction"
    )
  ) {
    return "ETH";
  }

  return "Unknown";
}

/*
 * Convert raw blockchain values into display values.

 * Native ETH:
 *   Etherscan txlist values are normally in wei.

 * ERC-20:
 *   Etherscan tokentx values are normally raw token
 *   units and tokenDecimal tells us how many decimals
 *   to divide by.
 */
function getDisplayTransactionValue(tx) {
  const rawValue =
    getTransactionValue(tx);

  const number =
    toNumber(rawValue);

  if (number === null) {
    return null;
  }

  const asset =
    String(
      getTransactionAsset(tx) || ""
    ).toUpperCase();

  const decimals =
    toNumber(
      firstDefined(
        tx?.tokenDecimal,
        tx?.token_decimal,
        tx?.token_decimals,
        tx?.decimals,
        null
      )
    );

  /*
   * Native ETH.
   */
  if (
    asset === "ETH" &&
    Math.abs(number) >= 1e6
  ) {
    return number / 1e18;
  }

  /*
   * ERC-20 token.
   */
  if (
    decimals !== null &&
    decimals > 0 &&
    Math.abs(number) >=
      10 ** decimals
  ) {
    return (
      number /
      10 ** decimals
    );
  }

  return number;
}

function getTransactionHop(tx) {
  return firstDefined(
    tx?.hop,
    tx?.hop_number,
    null
  );
}

function getDirection(tx, walletAddress = "") {
  if (tx?.direction) {
    return String(
      tx.direction
    ).toLowerCase();
  }

  const from =
    normalizeAddress(
      getTransactionFrom(tx)
    );

  const to =
    normalizeAddress(
      getTransactionTo(tx)
    );

  const wallet =
    normalizeAddress(
      walletAddress
    );

  if (
    wallet &&
    from === wallet
  ) {
    return "outgoing";
  }

  if (
    wallet &&
    to === wallet
  ) {
    return "incoming";
  }

  return "unknown";
}

/* =========================================================
   WALLET TRANSACTIONS
========================================================= */

function getWalletTransactions(
  wallet,
  allTransactions
) {
  if (!wallet?.address) {
    return [];
  }

  const address =
    normalizeAddress(
      wallet.address
    );

  /*
   * Always prefer the complete top-level
   * investigation transaction list.
   *
   * This prevents incomplete wallet.transactions
   * arrays from hiding transactions.
   */
  if (
    Array.isArray(allTransactions) &&
    allTransactions.length > 0
  ) {
    return allTransactions.filter(
      (tx) =>
        normalizeAddress(
          getTransactionFrom(tx)
        ) === address ||
        normalizeAddress(
          getTransactionTo(tx)
        ) === address
    );
  }

  if (
    Array.isArray(
      wallet?.transactions
    )
  ) {
    return wallet.transactions;
  }

  return [];
}

/* =========================================================
   VALUE ANALYTICS
========================================================= */

function getWalletValueBreakdown(
  wallet,
  allTransactions
) {
  const incoming = {};
  const outgoing = {};

  if (!wallet?.address) {
    return {
      incoming,
      outgoing,
      net: {},
      total: {},
    };
  }

  const walletTransactions =
    getWalletTransactions(
      wallet,
      allTransactions
    );

  walletTransactions.forEach(
    (tx) => {
      const direction =
        getDirection(
          tx,
          wallet.address
        );

      if (
        direction !== "incoming" &&
        direction !== "outgoing"
      ) {
        return;
      }

      const asset =
        getTransactionAsset(tx);

      const value =
        getDisplayTransactionValue(
          tx
        );

      if (
        !asset ||
        asset === "Unknown" ||
        value === null
      ) {
        return;
      }

      if (
        direction === "incoming"
      ) {
        incoming[asset] =
          (incoming[asset] || 0) +
          value;
      }

      if (
        direction === "outgoing"
      ) {
        outgoing[asset] =
          (outgoing[asset] || 0) +
          value;
      }
    }
  );

  const assets =
    new Set([
      ...Object.keys(incoming),
      ...Object.keys(outgoing),
    ]);

  const net = {};
  const total = {};

  assets.forEach(
    (asset) => {
      const inValue =
        incoming[asset] || 0;

      const outValue =
        outgoing[asset] || 0;

      net[asset] =
        inValue - outValue;

      total[asset] =
        inValue + outValue;
    }
  );

  return {
    incoming,
    outgoing,
    net,
    total,
  };
}

function formatAssetAmount(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "—";
  }

  if (number === 0) {
    return "0";
  }

  if (
    Math.abs(number) >= 1000
  ) {
    return number.toLocaleString(
      undefined,
      {
        maximumFractionDigits: 4,
      }
    );
  }

  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 8,
    }
  );
}

function formatAssetBreakdown(
  breakdown
) {
  if (
    !breakdown ||
    Object.keys(
      breakdown
    ).length === 0
  ) {
    return "—";
  }

  return Object.entries(
    breakdown
  )
    .filter(
      ([, value]) =>
        Number.isFinite(
          Number(value)
        )
    )
    .map(
      ([asset, value]) =>
        `${formatAssetAmount(
          value
        )} ${asset}`
    )
    .join(" • ");
}

/* =========================================================
   RISK HELPERS
========================================================= */

function normalizeRiskLevel(level) {
  if (!level) return "unknown";

  return String(level)
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getWalletRisk(
  wallet,
  response
) {
  const backendRisk =
    findRiskWallet(
      response,
      wallet?.address
    );

  if (backendRisk) {
    return {
      score:
        backendRisk.risk_score ??
        null,

      level:
        backendRisk.risk_level ??
        null,

      reasons:
        Array.isArray(
          backendRisk.factors
        )
          ? backendRisk.factors
          : [],
    };
  }

  return {
    score:
      wallet?.risk_score ??
      wallet?.overall_risk_score ??
      null,

    level:
      wallet?.risk_level ??
      wallet?.overall_risk_level ??
      null,

    reasons:
      Array.isArray(
        wallet?.risk_factors
      )
        ? wallet.risk_factors
        : [],
  };
}

function formatRiskFactorName(
  factor
) {
  if (!factor) {
    return "Risk factor";
  }

  return String(factor)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatRiskFactorValue(
  factor,
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized =
    String(factor || "")
      .toLowerCase();

  if (
    normalized.includes(
      "transaction_activity"
    )
  ) {
    return `${formatNumber(
      value
    )} transactions`;
  }

  if (
    normalized.includes(
      "counterparty"
    )
  ) {
    return `${formatNumber(
      value
    )} counterparties`;
  }

  if (
    normalized.includes(
      "asset_diversity"
    )
  ) {
    return `${formatNumber(
      value
    )} assets`;
  }

  if (
    normalized.includes(
      "incoming_dominance"
    )
  ) {
    const numeric =
      Number(value);

    if (
      !Number.isFinite(
        numeric
      )
    ) {
      return String(value);
    }

    const percentage =
      numeric <= 1
        ? numeric * 100
        : numeric;

    return `${percentage.toFixed(
      2
    )}% incoming`;
  }

  if (
    normalized.includes(
      "outgoing_dominance"
    )
  ) {
    const numeric =
      Number(value);

    if (
      !Number.isFinite(
        numeric
      )
    ) {
      return String(value);
    }

    const percentage =
      numeric <= 1
        ? numeric * 100
        : numeric;

    return `${percentage.toFixed(
      2
    )}% outgoing`;
  }

  if (
    normalized.includes(
      "fan_in"
    )
  ) {
    return `${formatNumber(
      value
    )} wallet relationships`;
  }

  if (
    normalized.includes(
      "fan_out"
    )
  ) {
    return `${formatNumber(
      value
    )} wallet relationships`;
  }

  /*
   * FIX:
   * intermediary_behavior.value is an object,
   * so never render it directly.
   */
  if (
    normalized.includes(
      "intermediary"
    )
  ) {
    if (
      typeof value ===
      "object"
    ) {
      const incoming =
        firstDefined(
          value?.incoming_count,
          value?.incoming,
          null
        );

      const outgoing =
        firstDefined(
          value?.outgoing_count,
          value?.outgoing,
          null
        );

      if (
        incoming !== null &&
        outgoing !== null
      ) {
        return `${formatNumber(
          incoming
        )} incoming · ${formatNumber(
          outgoing
        )} outgoing`;
      }

      return "Intermediary behavior detected";
    }

    return String(value);
  }

  if (
    normalized.includes(
      "known_entity"
    )
  ) {
    return value === true
      ? "Known entity"
      : String(value);
  }

  if (
    normalized.includes(
      "unknown_entity"
    )
  ) {
    return value === true
      ? "Entity is unknown"
      : String(value);
  }

  if (
    typeof value ===
    "object"
  ) {
    return null;
  }

  return String(value);
}

function renderRiskReason(reason) {
  if (
    reason &&
    typeof reason ===
      "object"
  ) {
    const factor =
      firstDefined(
        reason.factor,
        reason.name,
        reason.reason
      );

    const value =
      reason.value;

    const points =
      firstDefined(
        reason.contribution,
        reason.points,
        reason.score,
        null
      );

    const explanation =
      firstDefined(
        reason.explanation,
        reason.description,
        null
      );

    if (factor) {
      const readableFactor =
        formatRiskFactorName(
          factor
        );

      const readableValue =
        formatRiskFactorValue(
          factor,
          value
        );

      return (
        <div className="risk-reason-content">
          <strong>
            {readableFactor}
          </strong>

          {explanation && (
            <p className="risk-reason-explanation">
              {explanation}
            </p>
          )}

          <div className="risk-reason-meta">
            {readableValue && (
              <span>
                {readableValue}
              </span>
            )}

            {points !== null &&
              points !==
                undefined && (
                <span className="risk-points">
                  +
                  {formatScore(
                    points
                  )}{" "}
                  risk points
                </span>
              )}
          </div>
        </div>
      );
    }

    if (
      reason.description ||
      reason.reason
    ) {
      return (
        <div className="risk-reason-content">
          <strong>
            {reason.description ||
              reason.reason}
          </strong>
        </div>
      );
    }
  }

  return (
    <div className="risk-reason-content">
      <strong>
        {String(reason)}
      </strong>
    </div>
  );
}

/* =========================================================
   WALLET HELPERS
========================================================= */

function getWalletBehavior(
  wallet,
  response
) {
  const profile =
    findBehaviorProfile(
      response,
      wallet?.address
    );

  return profile?.behavior || {};
}

function getWalletAssets(
  wallet,
  transactions,
  response
) {
  const behavior =
    getWalletBehavior(
      wallet,
      response
    );

  if (
    Array.isArray(
      behavior.assets
    ) &&
    behavior.assets.length
  ) {
    return behavior.assets;
  }

  const entityProfile =
    findEntityProfile(
      response,
      wallet?.address
    );

  if (
    Array.isArray(
      entityProfile?.activity
        ?.assets
    ) &&
    entityProfile.activity
      .assets.length
  ) {
    return entityProfile.activity.assets;
  }

  const set =
    new Set();

  transactions.forEach(
    (tx) => {
      const asset =
        getTransactionAsset(
          tx
        );

      if (asset) {
        set.add(asset);
      }
    }
  );

  return Array.from(set);
}

function getWalletStats(
  wallet,
  allTransactions,
  response
) {
  const transactions =
    getWalletTransactions(
      wallet,
      allTransactions
    );

  const behavior =
    getWalletBehavior(
      wallet,
      response
    );

  const incoming =
    firstDefined(
      behavior.incoming_transaction_count,
      wallet?.incoming_transaction_count,
      wallet?.incoming_count,
      null
    );

  const outgoing =
    firstDefined(
      behavior.outgoing_transaction_count,
      wallet?.outgoing_transaction_count,
      wallet?.outgoing_count,
      null
    );

  const counterparties =
    firstDefined(
      behavior.unique_counterparties,
      wallet?.unique_counterparties,
      null
    );

  return {
    transactions:
      firstDefined(
        wallet?.transaction_count,
        transactions.length
      ),

    incoming:
      incoming ??
      transactions.filter(
        (tx) =>
          getDirection(
            tx,
            wallet?.address
          ) === "incoming"
      ).length,

    outgoing:
      outgoing ??
      transactions.filter(
        (tx) =>
          getDirection(
            tx,
            wallet?.address
          ) === "outgoing"
      ).length,

    counterparties:
      counterparties ??
      0,

    assets:
      getWalletAssets(
        wallet,
        transactions,
        response
      ),

    activityDirection:
      behavior.activity_direction ||
      null,
  };
}

/* =========================================================
   EDGE NORMALIZATION
========================================================= */

function normalizeEdges(
  edges,
  transactions,
  walletAddress = ""
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
          getDirection(
            edge,
            walletAddress
          ),

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
          getDirection(
            tx,
            walletAddress
          ),

        hop:
          getTransactionHop(tx),

        timestamp:
          tx?.timestamp ||
          null,
      })
    );
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

function RiskBadge({ level }) {
  const normalized =
    normalizeRiskLevel(level);

  return (
    <span
      className={`risk-badge ${normalized}`}
    >
      {level
        ? String(level)
            .charAt(0)
            .toUpperCase() +
          String(level).slice(1)
        : "Not provided"}
    </span>
  );
}

function EntityBadge({
  wallet,
  response,
}) {
  const entity =
    getEntityName(
      wallet,
      response
    );

  const category =
    getEntityCategory(
      wallet,
      response
    );

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
        {entity ||
          "Known entity"}

        {category && (
          <small>
            {category}
          </small>
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
}) {
  const riskWallets =
    getRiskWallets(
      response
    );

  const riskSummary =
    getAnalytics(response)
      ?.wallet_risks
      ?.summary || {};

  const calculatedAverage =
    riskWallets.length
      ? riskWallets.reduce(
          (sum, item) =>
            sum +
            Number(
              item.risk_score || 0
            ),
          0
        ) /
        riskWallets.length
      : null;

  const riskScore =
    firstDefined(
      riskSummary?.overall_risk_score,
      riskSummary?.average_risk_score,
      calculatedAverage,
      null
    );

  const high =
    firstDefined(
      riskSummary.high_risk_wallets,
      0
    );

  const medium =
    firstDefined(
      riskSummary.medium_risk_wallets,
      0
    );

  const low =
    firstDefined(
      riskSummary.low_risk_wallets,
      0
    );

  const majorFactors =
    useMemo(() => {
      const factors =
        getRiskFactorWallets(
          response
        ).flatMap(
          (wallet) =>
            Array.isArray(
              wallet?.factors
            )
              ? wallet.factors.map(
                  (factor) => ({
                    ...factor,
                    wallet:
                      wallet.wallet,
                  })
                )
              : []
        );

      return factors
        .sort(
          (a, b) =>
            Number(
              b.contribution || 0
            ) -
            Number(
              a.contribution || 0
            )
        )
        .slice(0, 8);
    }, [response]);

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
            Wallet-level risk scores
            and factors are supplied
            by the investigation
            analytics.
          </p>
        </div>
      </div>

      <div className="risk-overview-grid">
        <div className="overall-risk-card">
          <span>
            Average wallet risk score
          </span>

          <strong>
            {riskScore !== null
              ? formatScore(
                  riskScore
                )
              : "Not provided"}
          </strong>

          <span className="risk-summary-note">
            Across{" "}
            {formatNumber(
              riskWallets.length
            )}{" "}
            traced wallets
          </span>
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
                {formatNumber(
                  high
                )}
              </strong>

              <span>High</span>
            </div>

            <div className="distribution-item medium">
              <strong>
                {formatNumber(
                  medium
                )}
              </strong>

              <span>
                Medium
              </span>
            </div>

            <div className="distribution-item low">
              <strong>
                {formatNumber(
                  low
                )}
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

        {majorFactors.length ===
        0 ? (
          <div className="not-provided">
            No risk factors were
            provided by the API.
          </div>
        ) : (
          <div className="risk-reason-list">
            {majorFactors.map(
              (
                reason,
                index
              ) => (
                <div
                  className="risk-reason"
                  key={`${reason.name || reason.factor}-${reason.wallet}-${index}`}
                >
                  <span className="risk-reason-bullet">
                    •
                  </span>

                  {renderRiskReason(
                    reason
                  )}
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
}) {
  const analytics =
    getAnalytics(response);

  const entitySummary =
    analytics
      ?.entity_analysis
      ?.summary || {};

  const behaviorSummary =
    analytics
      ?.wallet_behavior
      ?.summary || {};

  const behaviorMetrics =
    analytics
      ?.behavioral_analysis
      ?.metrics || {};

  const walletsCount =
    firstDefined(
      entitySummary.wallets_analyzed,
      behaviorSummary.wallets_analyzed,
      response?.wallets?.length,
      0
    );

  const transactionsCount =
    firstDefined(
      entitySummary.transactions_analyzed,
      behaviorSummary.transactions_analyzed,
      response?.transactions?.length,
      0
    );

  const relationshipsCount =
    firstDefined(
      entitySummary.edges_analyzed,
      behaviorSummary.edges_analyzed,
      response?.edges?.length,
      0
    );

  const startingWalletAddress =
    response?.wallet_address ||
    wallets.find(
      (wallet) =>
        Number(wallet?.hop) === 0
    )?.address ||
    "";

  const startingWallet =
    wallets.find(
      (wallet) =>
        normalizeAddress(
          wallet?.address
        ) ===
        normalizeAddress(
          startingWalletAddress
        )
    ) || null;

  const valueBreakdown =
    getWalletValueBreakdown(
      startingWallet,
      transactions
    );

  const incomingValue =
    formatAssetBreakdown(
      valueBreakdown.incoming
    );

  const outgoingValue =
    formatAssetBreakdown(
      valueBreakdown.outgoing
    );

  const netValue =
    formatAssetBreakdown(
      valueBreakdown.net
    );

  const totalValue =
    formatAssetBreakdown(
      valueBreakdown.total
    );

  const incomingWallets =
    firstDefined(
      behaviorMetrics.wallets_with_incoming,
      0
    );

  const outgoingWallets =
    firstDefined(
      behaviorMetrics.wallets_with_outgoing,
      0
    );

  const known =
    firstDefined(
      entitySummary.known_wallets,
      0
    );

  const unknown =
    firstDefined(
      entitySummary.unknown_wallets,
      0
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
          label="Wallets with incoming"
          value={formatNumber(
            incomingWallets
          )}
        />

        <StatCard
          label="Wallets with outgoing"
          value={formatNumber(
            outgoingWallets
          )}
        />

        <StatCard
          label="Known entities"
          value={formatNumber(
            known
          )}
        />

        <StatCard
          label="Unknown entities"
          value={formatNumber(
            unknown
          )}
        />

        <StatCard
          label="Total value"
          value={totalValue}
        />

        <StatCard
          label="Net value"
          value={netValue}
        />
      </div>

      <div className="value-analytics-grid">
        <div className="value-card incoming-value">
          <span>
            Incoming value
          </span>

          <strong>
            {incomingValue}
          </strong>
        </div>

        <div className="value-card outgoing-value">
          <span>
            Outgoing value
          </span>

          <strong>
            {outgoingValue}
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
  function update(name, value) {
    setFilters(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
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
    Object.values(
      filters
    ).some(Boolean);

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

        {wallets.map(
          (wallet) => (
            <option
              key={
                wallet.address
              }
              value={
                wallet.address
              }
            >
              {shortenAddress(
                wallet.address,
                10,
                8
              )}
            </option>
          )
        )}
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

        {assets.map(
          (asset) => (
            <option
              key={asset}
              value={asset}
            >
              {asset}
            </option>
          )
        )}
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

        {hops.map(
          (hop) => (
            <option
              key={hop}
              value={hop}
            >
              Hop {hop}
            </option>
          )
        )}
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
  response,
}) {
  if (
    wallets.length === 0
  ) {
    return (
      <div className="empty-state">
        No wallet risk data was
        returned.
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
                getWalletRisk(
                  wallet,
                  response
                );

              const selected =
                normalizeAddress(
                  selectedWallet?.address
                ) ===
                normalizeAddress(
                  wallet.address
                );

              return (
                <tr
                  key={
                    wallet.address
                  }
                  className={
                    selected
                      ? "selected-row"
                      : ""
                  }
                  onClick={() =>
                    onSelectWallet(
                      wallet
                    )
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
                      wallet={
                        wallet
                      }
                      response={
                        response
                      }
                    />
                  </td>

                  <td>
                    {risk.score ===
                      null ||
                    risk.score ===
                      undefined
                      ? "Not provided"
                      : formatScore(
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
  response,
}) {
  if (!wallet) {
    return (
      <div className="empty-state">
        Select a wallet to inspect
        its risk and activity.
      </div>
    );
  }

  const stats =
    getWalletStats(
      wallet,
      transactions,
      response
    );

  const risk =
    getWalletRisk(
      wallet,
      response
    );

  const riskFactors =
    Array.isArray(
      risk.reasons
    )
      ? risk.reasons
      : [];

  const walletTransactions =
    getWalletTransactions(
      wallet,
      transactions
    );

  const valueBreakdown =
    getWalletValueBreakdown(
      wallet,
      transactions
    );

  const incomingValue =
    formatAssetBreakdown(
      valueBreakdown.incoming
    );

  const outgoingValue =
    formatAssetBreakdown(
      valueBreakdown.outgoing
    );

  const netValue =
    formatAssetBreakdown(
      valueBreakdown.net
    );

  const totalValue =
    formatAssetBreakdown(
      valueBreakdown.total
    );

  const entityProfile =
    findEntityProfile(
      response,
      wallet.address
    );

  const entity =
    entityProfile?.entity;

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
          <span>
            Risk score
          </span>

          <strong>
            {risk.score ===
              null ||
            risk.score ===
              undefined
              ? "Not provided"
              : formatScore(
                  risk.score
                )}
          </strong>
        </div>

        <div>
          <span>
            Risk level
          </span>

          <strong>
            {risk.level
              ? String(
                  risk.level
                )
              : "Not provided"}
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
          response={response}
        />
      </div>

      {entity && (
        <div className="wallet-entity-source">
          <span>
            Source
          </span>

          <strong>
            {entity.source ||
              "—"}
          </strong>

          {entity.confidence && (
            <span>
              {entity.confidence}
            </span>
          )}
        </div>
      )}

      <div className="wallet-activity-grid">
        <div>
          <span>
            Transactions
          </span>

          <strong>
            {formatNumber(
              stats.transactions
            )}
          </strong>
        </div>

        <div className="incoming">
          <span>
            Incoming
          </span>

          <strong>
            {formatNumber(
              stats.incoming
            )}
          </strong>
        </div>

        <div className="outgoing">
          <span>
            Outgoing
          </span>

          <strong>
            {formatNumber(
              stats.outgoing
            )}
          </strong>
        </div>

        <div>
          <span>
            Counterparties
          </span>

          <strong>
            {formatNumber(
              stats.counterparties
            )}
          </strong>
        </div>
      </div>

      {/* VALUE CARDS */}

      <div className="wallet-value-grid">
        <div>
          <span>
            Incoming value
          </span>

          <strong>
            {incomingValue}
          </strong>
        </div>

        <div>
          <span>
            Outgoing value
          </span>

          <strong>
            {outgoingValue}
          </strong>
        </div>

        <div>
          <span>
            Net value
          </span>

          <strong>
            {netValue}
          </strong>
        </div>

        <div>
          <span>
            Total value
          </span>

          <strong>
            {totalValue}
          </strong>
        </div>
      </div>

      {stats.activityDirection && (
        <div className="wallet-activity-direction">
          <span>
            Activity direction
          </span>

          <strong>
            {stats.activityDirection}
          </strong>
        </div>
      )}

      <div className="detail-block">
        <h3>
          Risk reasons
        </h3>

        {riskFactors.length >
        0 ? (
          <ul className="wallet-risk-reasons">
            {riskFactors.map(
              (
                reason,
                index
              ) => (
                <li
                  key={`${reason?.name || reason?.factor || "factor"}-${index}`}
                >
                  {renderRiskReason(
                    reason
                  )}
                </li>
              )
            )}
          </ul>
        ) : (
          <span className="not-provided">
            No wallet-level risk
            reasons were provided
            by the API.
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
                  key={
                    asset
                  }
                >
                  {asset}
                </span>
              )
            )}
          </div>
        ) : (
          <span className="not-provided">
            No asset data
            provided.
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
          transactions associated
          with this wallet in the
          returned investigation.
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
  response,
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

          result[hop].push(
            wallet
          );
        }
      );

      return result;
    }, [wallets]);

  const hops =
    Object.keys(groups)
      .map(Number)
      .sort(
        (a, b) =>
          a - b
      );

  return (
    <div className="relationship-graph">
      {hops.length === 0 ? (
        <div className="empty-state">
          No wallet graph data
          was returned.
        </div>
      ) : (
        <div className="hop-columns">
          {hops.map(
            (
              hop,
              index
            ) => (
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
                          normalizeAddress(
                            selectedWallet?.address
                          ) ===
                          normalizeAddress(
                            wallet.address
                          );

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
                                wallet,
                                response
                              ) ||
                                "Unknown"}
                            </span>

                            <RiskBadge
                              level={
                                getWalletRisk(
                                  wallet,
                                  response
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
              Real backend
              relationships
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
            No relationship edges
            were returned by the
            API.
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
                    {
                      edge.transactionType
                    }
                  </span>

                  <span>
                    {
                      edge.direction
                    }
                  </span>

                  {edge.hop !==
                    null && (
                    <span>
                      H
                      {
                        edge.hop
                      }
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
  walletAddress,
  onSelectTransaction,
}) {
  if (
    transactions.length === 0
  ) {
    return (
      <div className="empty-state">
        No transactions match
        the current filters.
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
            (
              tx,
              index
            ) => {
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
                  getDisplayTransactionValue(
                    tx
                  ),

                hop:
                  getTransactionHop(
                    tx
                  ),

                direction:
                  getDirection(
                    tx,
                    walletAddress
                  ),

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
                    {
                      normalized.type
                    }
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
        Select a transaction or
        relationship to inspect
        it.
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
          <span>
            Transaction type
          </span>

          <strong>
            {transaction.type ||
              "Not provided"}
          </strong>
        </div>

        <div>
          <span>
            Direction
          </span>

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
          <span>
            Timestamp
          </span>

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
      const map =
        new Map();

      transactions.forEach(
        (tx) => {
          const asset =
            getTransactionAsset(
              tx
            );

          if (!map.has(asset)) {
            map.set(
              asset,
              {
                asset,
                transactions: 0,
                totalValue: 0,
              }
            );
          }

          const item =
            map.get(asset);

          item.transactions +=
            1;

          const value =
            getDisplayTransactionValue(
              tx
            );

          if (
            value !== null
          ) {
            item.totalValue +=
              value;
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

  if (
    assets.length === 0
  ) {
    return (
      <div className="empty-state compact">
        No asset analytics are
        available.
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
            key={
              item.asset
            }
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
              Value:{" "}
              {item.totalValue ===
              0
                ? "Not provided"
                : `${formatAssetAmount(
                    item.totalValue
                  )} ${item.asset}`}
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

  const [
    selectedWallet,
    setSelectedWallet,
  ] = useState(null);

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState(null);

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

  /* -------------------------------------------------------
     METADATA
  ------------------------------------------------------- */

  const startingWallet =
    response?.wallet_address ||
    wallets.find(
      (wallet) =>
        Number(
          wallet?.hop
        ) === 0
    )?.address ||
    "";

  const network =
    response?.network ||
    "Network not provided";

  const maxHops =
    response?.max_hops ??
    null;

  /* -------------------------------------------------------
     RESET
  ------------------------------------------------------- */

  useEffect(() => {
    setSelectedWallet(null);
    setSelectedTransaction(null);

    setFilters({
      wallet: "",
      asset: "",
      type: "",
      direction: "",
      hop: "",
    });
  }, [startingWallet]);

  /* -------------------------------------------------------
     AUTO SELECT ROOT
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
              wallet?.hop
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
     KEEP SELECTION VALID
  ------------------------------------------------------- */

  useEffect(() => {
    if (
      !selectedWallet ||
      wallets.length === 0
    ) {
      return;
    }

    const exists =
      wallets.some(
        (wallet) =>
          normalizeAddress(
            wallet?.address
          ) ===
          normalizeAddress(
            selectedWallet?.address
          )
      );

    if (!exists) {
      const root =
        wallets.find(
          (wallet) =>
            Number(
              wallet?.hop
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
     EDGES
  ------------------------------------------------------- */

  const edges =
    useMemo(
      () =>
        normalizeEdges(
          response?.edges,
          transactions,
          startingWallet
        ),
      [
        response?.edges,
        transactions,
        startingWallet,
      ]
    );

  /* -------------------------------------------------------
     FILTER OPTIONS
  ------------------------------------------------------- */

  const assets =
    useMemo(() => {
      const set =
        new Set();

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
      const set =
        new Set();

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
      const set =
        new Set();

      wallets.forEach(
        (wallet) =>
          set.add(
            wallet?.hop ??
              0
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
     FILTER TRANSACTIONS
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
            getDirection(
              tx,
              filters.wallet ||
                startingWallet
            );

          const from =
            normalizeAddress(
              getTransactionFrom(
                tx
              )
            );

          const to =
            normalizeAddress(
              getTransactionTo(
                tx
              )
            );

          const wallet =
            normalizeAddress(
              filters.wallet
            );

          if (
            wallet &&
            from !== wallet &&
            to !== wallet
          ) {
            return false;
          }

          if (
            filters.asset &&
            asset !==
              filters.asset
          ) {
            return false;
          }

          if (
            filters.type &&
            type !==
              filters.type
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
      transactions,
      filters,
      startingWallet,
    ]);

  /* -------------------------------------------------------
     FILTER WALLETS
  ------------------------------------------------------- */

  const filteredWallets =
    useMemo(() => {
      return wallets.filter(
        (wallet) => {
          if (
            filters.wallet &&
            normalizeAddress(
              wallet?.address
            ) !==
              normalizeAddress(
                filters.wallet
              )
          ) {
            return false;
          }

          if (
            filters.hop !== "" &&
            String(
              wallet?.hop
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
     FILTER EDGES
  ------------------------------------------------------- */

  const filteredEdges =
    useMemo(() => {
      return edges.filter(
        (edge) => {
          if (
            filters.wallet &&
            normalizeAddress(
              edge.from
            ) !==
              normalizeAddress(
                filters.wallet
              ) &&
            normalizeAddress(
              edge.to
            ) !==
              normalizeAddress(
                filters.wallet
              )
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
     SELECTION
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
        value:
          getDisplayTransactionValue(
            edge
          ),
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
          normalizeAddress(
            item?.address
          ) ===
            normalizeAddress(
              edge.from
            ) ||
          normalizeAddress(
            item?.address
          ) ===
            normalizeAddress(
              edge.to
            )
      );

    if (wallet) {
      setSelectedWallet(
        wallet
      );
    }
  }

  /* -------------------------------------------------------
     EMPTY
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
            Enter a real wallet
            address above and run
            the investigation to load
            the dashboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="investigator-dashboard">
      <div className="dashboard-shell">

        {/* HEADER */}

        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              CRYPTOTRACE · FINAL
              INVESTIGATION
            </span>

            <h1>
              Risk & Investigation
              Assessment
            </h1>

            <p>
              Inspect the real
              blockchain
              investigation, analytics,
              wallet relationships and
              API-provided risk
              assessment.
            </p>
          </div>

          <div className="network-badge">
            <span className="network-dot" />

            {network}
          </div>
        </header>

        {/* TARGET */}

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
              {maxHops ??
                "Not provided"}
            </strong>
          </div>
        </section>

        {/* RISK */}

        <RiskSummary
          response={response}
        />

        {/* SUMMARY */}

        <InvestigationSummary
          response={response}
          wallets={wallets}
          transactions={
            transactions
          }
        />

        {/* FILTERS */}

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

        {/* WALLET RISK */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                WALLET RISK
              </span>

              <h2>
                Wallet risk
                assessment
              </h2>

              <p>
                Risk values are read
                directly from the
                returned wallet risk
                analytics.
              </p>
            </div>

            <span className="panel-count">
              {
                filteredWallets.length
              }
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
            response={
              response
            }
          />
        </section>

        {/* DETAIL */}

        <section className="detail-layout">
          <div className="dashboard-panel">
            <WalletDetail
              wallet={
                selectedWallet
              }
              transactions={
                transactions
              }
              response={
                response
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

        {/* GRAPH */}

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="section-kicker">
                RELATIONSHIP
                ANALYSIS
              </span>

              <h2>
                Wallet relationship
                graph
              </h2>

              <p>
                Relationships come from
                the investigation
                response.
              </p>
            </div>

            <span className="panel-count">
              {
                filteredEdges.length
              }
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
            response={
              response
            }
          />
        </section>

        {/* ASSETS */}

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
                Based on the
                transactions returned
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

        {/* TRANSACTIONS */}

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
                Select a transaction
                for full details.
              </p>
            </div>

            <span className="panel-count">
              {
                filteredTransactions.length
              }
            </span>
          </div>

          <TransactionTable
            transactions={
              filteredTransactions
            }
            walletAddress={
              filters.wallet ||
              startingWallet
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