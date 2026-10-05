# 🔎 CryptoTrace

### Blockchain Wallet Investigation & Multi-Hop Risk Intelligence Platform

<p align="center">

**Trace. Understand. Connect. Assess.**

CryptoTrace is a blockchain investigation platform designed to transform raw Ethereum transaction data into an explainable investigation graph containing wallet relationships, transaction flows, entity intelligence, behavioural patterns, and wallet-level risk indicators.

</p>

---

## 🚨 The Problem

Blockchain transactions are public, but **understanding the movement of funds across multiple wallets is difficult**.

Investigators, analysts, compliance teams, and security researchers often have to manually move between blockchain explorers, transaction pages, wallet addresses, token transfers, and entity information.

This makes it difficult to answer questions such as:

* Where did funds move?
* Which wallets are connected?
* How far does a transaction trail extend?
* Is a wallet acting as an intermediary?
* Does an address belong to a known entity?
* Are there unusual fan-in or fan-out patterns?
* Which wallets deserve closer investigation?

### CryptoTrace brings these signals together into one investigation workflow.

---
# 👩‍💻 Team

### Team CryptoTrace

| # | Team Member             |
| - | ----------------------- |
| 1 | **Sowmya Nali Venkata** |
| 2 | **Rumiza M Sutar**      |
| 3 | **Safa Fatima**         |
| 4 | **Hafsa Nayeem**        |
| 5 | **Afifa Zareen**        |
| 6 | **Afifa Ahmed**         |

### Team Contribution Areas

```text
Blockchain & Backend
        +
Frontend & Dashboard
        +
Investigation Logic
        +
Analytics & Risk Intelligence
        +
Research & Documentation
        +
Testing & Presentation
```

---

# 💡 Our Solution

CryptoTrace accepts an Ethereum wallet address and performs a **real-data multi-hop investigation**.

```text
                    ┌──────────────────────┐
                    │   Ethereum Wallet    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Blockchain Data      │
                    │ Collection           │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       Transactions       Token Transfers   Internal Txns
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Multi-Hop Tracing    │
                    │ Graph Construction   │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
       Entity Analysis   Behaviour Analysis   Risk Analysis
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Investigation        │
                    │ Dashboard            │
                    └──────────────────────┘
```

---

# ⚡ Key Features

### 🔗 Multi-Hop Wallet Tracing

Investigate connected wallets across multiple transaction hops and construct a relationship graph from actual Ethereum activity.

### 📊 Transaction Intelligence

Analyze:

* Normal Ethereum transactions
* Internal transactions
* ERC-20 token transfers
* Incoming and outgoing activity
* Transaction relationships
* Counterparty connections

### 🕸️ Investigation Graph

Visualize wallet-to-wallet relationships and follow the movement of funds across the investigation network.

### 🏷️ Entity Identification

Match addresses against a public Ethereum address-label dataset to identify known entities where available.

### 🧠 Behavioural Analysis

Generate wallet-level behavioural indicators such as:

* Incoming activity
* Outgoing activity
* Activity direction
* Unique counterparties
* Asset diversity
* Active periods
* Fan-in patterns
* Fan-out patterns
* Intermediary behaviour

### ⚠️ Risk Intelligence

CryptoTrace calculates explainable wallet-level risk indicators based on observed on-chain behaviour.

Risk factors can include:

* High transaction activity
* High counterparty count
* High asset diversity
* Incoming dominance
* Outgoing dominance
* Fan-in behaviour
* Fan-out behaviour
* Intermediary behaviour
* Known entity indicators

### 💰 Asset & Value Analysis

Transactions are grouped by asset so that different assets are not incorrectly combined into a single monetary value.

### 🔍 Investigation Dashboard

The dashboard brings the complete investigation together:

```text
Wallet
  ↓
Transactions
  ↓
Connected Wallets
  ↓
Relationship Graph
  ↓
Entities
  ↓
Behaviour
  ↓
Risk Factors
  ↓
Wallet Risk Scores
  ↓
Investigation Insights
```

---

# 🏗️ System Architecture

```text
                         USER
                           │
                           ▼
                 ┌───────────────────┐
                 │ React + Vite UI   │
                 └─────────┬─────────┘
                           │
                           │ REST API
                           ▼
                 ┌───────────────────┐
                 │ FastAPI Backend   │
                 └─────────┬─────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌───────────┐ ┌────────────┐
        │ Etherscan│ │ Entity    │ │ Analytics  │
        │ API V2   │ │ Dataset   │ │ Engine     │
        └────┬─────┘ └─────┬─────┘ └──────┬─────┘
             │             │              │
             ▼             ▼              ▼
        Ethereum       Address Labels   Behaviour +
        On-Chain Data                    Risk Analysis
              \            |             /
               \           |            /
                └───────────┼───────────┘
                            ▼
                  Investigation Result
```

---

# 🧩 Investigation Pipeline

```text
1. Wallet Input
      ↓
2. Blockchain Data Retrieval
      ↓
3. Transaction Normalization
      ↓
4. Connected Wallet Discovery
      ↓
5. Multi-Hop Traversal
      ↓
6. Relationship Graph Creation
      ↓
7. Entity Lookup
      ↓
8. Behavioural Analysis
      ↓
9. Risk Factor Generation
      ↓
10. Wallet Risk Scoring
      ↓
11. Dashboard Visualization
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* CSS
* Interactive investigation dashboard
* Graph-based relationship visualization

## Backend

* Python
* FastAPI
* Uvicorn
* REST API architecture

## Blockchain Data

* Ethereum Mainnet
* Etherscan API V2
* Normal transactions
* Internal transactions
* ERC-20 token transfers

## Intelligence Layer

* Multi-hop wallet traversal
* Wallet behaviour analysis
* Entity identification
* Risk factor generation
* Wallet risk scoring
* Asset-level value analysis

## Data

* Ethereum address/entity labels
* Live blockchain transaction data
* No hardcoded blockchain transaction results

---

# 📡 API

### Investigation Endpoint

```http
POST /investigate
```

### Request

```json
{
  "wallet_address": "0xYourEthereumWallet",
  "max_hops": 2
}
```

### Response

The investigation response contains:

```text
wallet_address
network
max_hops
wallets
edges
transactions
tracing
analytics
```

The analytics layer includes:

```text
Behavioural Analysis
Entity Analysis
Wallet Behaviour
Risk Factors
Wallet Risks
```

---

# 🔗 Data Sources & Datasets

## 1. Etherscan API V2

CryptoTrace uses Etherscan as its blockchain data source for Ethereum on-chain activity.

It provides access to transaction, internal transaction, token transfer, address metadata, and other blockchain information.

🔗 [Etherscan API](https://etherscan.io/apis)

🔗 [Etherscan API Documentation](https://docs.etherscan.io/)

Etherscan API V2 provides a unified API architecture for Ethereum and other supported EVM chains.

---

## 2. Ethereum Mainnet

CryptoTrace investigates **actual Ethereum Mainnet activity** rather than using fabricated wallet or transaction examples.

🔗 [Ethereum](https://ethereum.org/)

---

## 3. Ethereum Address Labels Dataset

CryptoTrace uses the open-source `eth-labels` dataset for entity identification and address labelling.

🔗 [dawsbot/eth-labels](https://github.com/dawsbot/eth-labels)

The dataset provides labeled cryptocurrency addresses and tokens across Ethereum and other EVM ecosystems.

### Used for

```text
Wallet Address
      ↓
Entity Lookup
      ↓
Known Entity / Unknown
      ↓
Entity Name + Name Tag
```

### Dataset integration

The project uses the address-label data available under:

```text
backend/data/eth-labels/
```

Relevant data includes account and token label information.

---

# 📁 Project Structure

```text
cryptotrace/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   └── services/
│   │       ├── blockchain.py
│   │       ├── tracer.py
│   │       └── entity.py
│   │
│   ├── data/
│   │   └── eth-labels/
│   │
│   ├── .env
│   └── requirements.txt
│
├── src/
│   ├── pages/
│   │   └── InvestigatorDashboard.jsx
│   ├── components/
│   └── ...
│
├── public/
│
├── package.json
├── vite.config.js
├── README.md
└── .gitignore
```

> 🔐 API keys and secrets are stored through environment variables and should never be committed to the repository.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have:

* Python 3.x
* Node.js
* npm
* Git
* An Etherscan API key

---

## 1. Clone the Repository

```bash
git clone https://github.com/Sowmya07484/cryptotrace.git
cd cryptotrace
```

---

# 🐍 Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv venv
```

Activate it:

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
ETHERSCAN_API_KEY=your_api_key_here
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ Frontend Setup

From the project root:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL displayed by Vite.

---

# 🧪 Example Investigation

Enter an Ethereum wallet address into CryptoTrace.

For example:

```text
Wallet Address
      ↓
Set Maximum Hops
      ↓
Investigate
      ↓
Retrieve Blockchain Data
      ↓
Discover Connected Wallets
      ↓
Construct Relationship Graph
      ↓
Identify Known Entities
      ↓
Analyze Behaviour
      ↓
Generate Risk Factors
      ↓
Calculate Wallet Risk
      ↓
Explore Investigation Dashboard
```

---

# 🛡️ Design Principles

### Real Data First

CryptoTrace is designed around actual on-chain blockchain data.

### Explainable Risk

Risk indicators are derived from observable wallet behaviour rather than producing an unexplained black-box result.

### Multi-Hop Investigation

The platform goes beyond examining a single wallet and explores connected wallet relationships.

### Modular Architecture

Blockchain retrieval, tracing, entity intelligence, and analytics are separated into dedicated backend services.

### Investigation-Centric UX

The interface is designed around an investigator's workflow rather than simply displaying raw blockchain transactions.

---

# 📈 Future Scope

CryptoTrace can be extended into a broader blockchain investigation platform.

Potential future directions include:

* Multi-chain investigations
* Advanced graph analytics
* Temporal transaction analysis
* More comprehensive entity intelligence
* Custom investigation reports
* Watchlists and continuous monitoring
* Investigation case management
* Advanced anomaly detection
* ML-assisted risk intelligence
* Collaboration between investigators
* Larger address intelligence datasets
* Automated investigation alerts

---

# 🎯 Why CryptoTrace?

```text
Traditional Explorer
        │
        ├── Transaction lookup
        ├── Individual address view
        └── Manual investigation
                │
                ▼
             CryptoTrace
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
     Trace   Analyze   Assess
        │       │        │
        └───────┼────────┘
                ▼
       Investigation Graph
                +
       Entity Intelligence
                +
       Behaviour Analysis
                +
       Risk Intelligence
```

CryptoTrace turns **raw blockchain activity into an investigation-oriented view of connected wallet behaviour.**

---


# 🏆 Hackathon Project

**CryptoTrace** is developed as a hackathon project focused on applying blockchain technology to practical investigation and risk-intelligence workflows.

The project demonstrates how publicly available blockchain data can be transformed into a structured investigation system.

---

# 🔗 Project Links

### 💻 Source Code

[CryptoTrace GitHub Repository](https://github.com/Sowmya07484/cryptotrace)

### 🌐 Live Application

 https://cryptotrace-one.vercel.app/

### 📚 Blockchain Data

[Etherscan](https://etherscan.io/)

### 📊 Address Intelligence Dataset

[eth-labels](https://github.com/dawsbot/eth-labels)

### ⛓️ Ethereum

[Ethereum.org](https://ethereum.org/)

---

# ⚠️ Disclaimer

CryptoTrace is a research and hackathon project intended for educational, analytical, and investigative demonstration purposes.

Risk indicators generated by the platform are **analytical signals, not definitive accusations or proof of illicit activity**.

A high-risk wallet should be treated as a signal for further investigation rather than a conclusion about the wallet owner.

---

# ⭐ If You Find CryptoTrace Interesting

Star the repository and follow the project as we continue exploring practical applications of blockchain investigation technology.

---

<p align="center">

### 🔎 CryptoTrace

**Trace the flow. Understand the network. Investigate the risk.**

</p>
