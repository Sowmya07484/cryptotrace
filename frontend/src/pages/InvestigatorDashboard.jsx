import { useState } from "react";

import WalletInput from "../components/WalletInput";
import WalletInfo from "../components/WalletInfo";
import RiskCard from "../components/RiskCard";
import VerdictCard from "../components/VerdictCard";
import HopTrail from "../components/HopTrail";
import ExplanationPanel from "../components/ExplanationPanel";
import IntelligenceSummary from "../components/IntelligenceSummary";

import { investigateWallet } from "../services/api";


function InvestigatorDashboard() {
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleInvestigate = async (address) => {
    setLoading(true);
    setError("");

    try {
      const result = await investigateWallet(address);

      console.log(
        "Investigation API response:",
        result
      );

      setInvestigation(result);

    } catch (err) {
      console.error(
        "Investigation failed:",
        err
      );

      setError(
        err.message ||
          "Unable to complete the investigation."
      );

      setInvestigation(null);

    } finally {
      setLoading(false);
    }
  };


  /*
   * The backend currently returns the main
   * investigation data at the top level.
   */

  const investigationInfo = investigation
    ? {
        wallet_address:
          investigation.wallet_address,

        network:
          investigation.network,

        max_hops:
          investigation.max_hops,
      }
    : null;


  const tracingInfo = investigation
    ? {
        wallets_traced:
          investigation.wallets?.length ?? 0,

        truncated:
          investigation.truncated ?? false,
      }
    : null;


  const wallets =
    investigation?.wallets || [];


  const intelligence =
    investigation?.analytics
      ?.behavioral_analysis || {};


  const riskAnalysis =
    investigation?.analytics
      ?.risk_analysis || {};


  return (
    <div className="dashboard">

      <header className="header">

        <div className="logo">
          CryptoTrace
        </div>

        <div className="header-role">
          INVESTIGATOR
        </div>

      </header>


      <main className="main">

        <section className="investigation-section">

          <WalletInput
            onInvestigate={
              handleInvestigate
            }
            loading={loading}
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

        </section>


        {investigation && (
          <>

            {/* WALLET + RISK */}

            <section className="investigation-section">

              <div className="result-grid">

                <WalletInfo
                  investigation={
                    investigationInfo
                  }
                  tracing={
                    tracingInfo
                  }
                />

                <RiskCard
                  riskAnalysis={
                    riskAnalysis
                  }
                />

              </div>

            </section>


            {/* INTELLIGENCE */}

            <section className="investigation-section">

              <IntelligenceSummary
                intelligence={
                  intelligence
                }
              />

            </section>


            {/* VERDICT */}

            <section className="investigation-section">

              <VerdictCard
                riskAnalysis={
                  riskAnalysis
                }
                tracing={
                  tracingInfo
                }
              />

            </section>


            {/* HOP TRAIL */}

            <section className="investigation-section">

              <HopTrail
                wallets={wallets}
                tracing={
                  tracingInfo
                }
              />

            </section>


            {/* EXPLANATION */}

            <section className="investigation-section">

              <ExplanationPanel
                intelligence={
                  intelligence
                }
                riskAnalysis={
                  riskAnalysis
                }
              />

            </section>

          </>
        )}

      </main>

    </div>
  );
}


export default InvestigatorDashboard;