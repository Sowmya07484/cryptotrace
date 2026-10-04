import React from "react";

function shortenAddress(address) {
  if (!address) {
    return "Unknown";
  }

  if (address.length <= 18) {
    return address;
  }

  return `${address.slice(0, 9)}...${address.slice(-7)}`;
}

export default function WalletTrail({
  wallets = [],
  selectedWallet,
  onWalletSelect,
}) {
  if (!wallets.length) {
    return (
      <div className="empty-trail">
        No investigation trail is available.
      </div>
    );
  }

  const sortedWallets = [...wallets].sort(
    (a, b) => Number(a.hop || 0) - Number(b.hop || 0)
  );

  return (
    <div className="trail-container">
      <div className="trail-line" />

      {sortedWallets.map((wallet, index) => {
        const selected =
          selectedWallet?.address?.toLowerCase() ===
          wallet.address?.toLowerCase();

        const isStart = Number(wallet.hop || 0) === 0;

        const entityName =
          wallet.entity_name ||
          wallet.name_tag ||
          wallet.entity?.name ||
          null;

        return (
          <React.Fragment
            key={`${wallet.address}-${wallet.hop}`}
          >
            <button
              type="button"
              className={`trail-node ${
                selected ? "trail-node-selected" : ""
              }`}
              onClick={() =>
                onWalletSelect?.(wallet)
              }
            >
              <div className="trail-node-marker">
                {isStart ? "S" : wallet.hop}
              </div>

              <div className="trail-node-content">
                <div className="trail-node-header">
                  <span className="trail-hop-label">
                    {isStart
                      ? "STARTING WALLET"
                      : `HOP ${wallet.hop}`}
                  </span>

                  {entityName && (
                    <span className="trail-entity">
                      {entityName}
                    </span>
                  )}
                </div>

                <strong>
                  {shortenAddress(wallet.address)}
                </strong>

                <span className="trail-address">
                  {wallet.address}
                </span>

                <div className="trail-node-stats">
                  <span>
                    {wallet.transaction_count || 0} tx
                  </span>

                  <span>
                    {wallet.incoming_transaction_count ||
                      0} in
                  </span>

                  <span>
                    {wallet.outgoing_transaction_count ||
                      0} out
                  </span>

                  <span>
                    {wallet.counterpart_wallet_count ||
                      0} counterpart
                    {wallet.counterpart_wallet_count ===
                    1
                      ? ""
                      : "s"}
                  </span>
                </div>
              </div>

              <div className="trail-node-arrow">
                →
              </div>
            </button>

            {index < sortedWallets.length - 1 && (
              <div className="trail-connector">
                <span>
                  NEXT HOP
                </span>

                <div />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}