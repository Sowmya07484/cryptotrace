import React, { useState } from "react";
import InvestigatorDashboard from "./pages/InvestigatorDashboard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [maxHops, setMaxHops] = useState(2);

  const [investigation, setInvestigation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runInvestigation(event) {
    event.preventDefault();

    const wallet = walletAddress.trim();

    if (!wallet) {
      setError("Please enter a wallet address.");
      return;
    }

    setLoading(true);
    setError("");
    setInvestigation(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/investigate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            wallet_address: wallet,
            max_hops: Number(maxHops),
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let result;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();

        throw new Error(
          text ||
            `Backend returned HTTP ${response.status}`
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            result?.message ||
            `Investigation failed with HTTP ${response.status}`
        );
      }

      setInvestigation(result);
    } catch (err) {
      console.error("Investigation error:", err);

      setError(
        err?.message ||
          "Unable to connect to the investigation backend."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-root">
      <div className="app-command-bar">
        <div className="app-brand">
          <div className="app-brand-mark">◇</div>

          <div>
            <strong>CryptoTrace</strong>
            <span>Blockchain Investigation</span>
          </div>
        </div>

        <div className="api-status">
          <span
            className={`status-dot ${
              loading ? "loading" : ""
            }`}
          />

          {loading
            ? "Investigating..."
            : "Investigation API"}
        </div>
      </div>

      <section className="investigation-form-wrapper">
        <div className="investigation-form-card">
          <div className="form-heading">
            <div className="form-icon">⌁</div>

            <div>
              <span className="form-kicker">
                NEW INVESTIGATION
              </span>

              <h1>Trace a wallet</h1>

              <p>
                Submit a real wallet address to retrieve
                blockchain relationships, transactions,
                entities, analytics and risk assessment.
              </p>
            </div>
          </div>

          <form
            className="investigation-form"
            onSubmit={runInvestigation}
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
                  setWalletAddress(
                    event.target.value
                  )
                }
                placeholder="0x..."
                autoComplete="off"
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
                  setMaxHops(event.target.value)
                }
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
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
                <>
                  Run Investigation
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="app-error">
              <strong>Investigation failed</strong>

              <span>{error}</span>
            </div>
          )}

          <div className="api-endpoint">
            API endpoint:
            <code>
              {API_BASE_URL}/investigate
            </code>
          </div>
        </div>
      </section>

      <InvestigatorDashboard
        investigation={investigation}
      />
    </div>
  );
}

export default App;