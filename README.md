# Zeinyra: AI-Driven Decentralized Portfolio Optimization Protocol

**Zeinyra** is a DeFi portfolio optimization protocol that integrates artificial intelligence with non-custodial blockchain execution. Users deploy autonomous AI agents that analyze on-chain markets, identify yield opportunities, and execute optimization strategies through user-defined intents.

The goal is to transform DeFi portfolio management from a manual, reactive process into an intelligent, autonomous, and continuously optimizing financial system—without sacrificing custody or transparency.

## Problem

DeFi offers open market access, but effective portfolio management remains complex and fragmented:

- **High complexity** — users must interact with many protocols and interfaces
- **Manual optimization** — yield farming and liquidity allocation need constant monitoring
- **Fragmented data** — market signals are scattered without unified intelligence
- **Execution inefficiency** — delayed reactions reduce yield performance
- **Risk gaps** — limited real-time adaptive risk modeling

## Solution

Zeinyra adds an AI-driven abstraction layer that automates decision-making while preserving full user custody.

Each user deploys a **Zeinyra AI Agent** that:

- Continuously scans DeFi protocols
- Analyzes yield opportunities and risk metrics
- Executes predefined optimization strategies
- Operates under strict user-defined constraints and permissions

All transactions require user-signed authorization. Assets never leave the user’s control.

## Product architecture

| Layer | Role |
| --- | --- |
| **AI Agent** | User-specific agents, continuous market monitoring, strategy evaluation, learning from on-chain history |
| **Market Intelligence** | Aggregates DEX, lending, LP, incentive, volatility, and risk data |
| **Intent Execution** | Turns high-level goals (yield max, stablecoin yield, capital preservation) into executable actions |
| **Smart Contract** | Non-custodial, wallet-signed execution with transparent on-chain settlement |

### Key features

- **Autonomous portfolio optimization** — continuous reallocation across protocols from AI analysis
- **Intent-based control** — users define objectives instead of manually executing every trade
- **Real-time risk assessment** — protocol risk, liquidity depth, and volatility exposure
- **Non-custodial design** — no protocol private-key storage; user-signed authorization only
- **Cross-protocol intelligence** — unified monitoring across DeFi ecosystems

### Security model

- No private key storage by the protocol
- User-signed transaction authorization
- Smart contract–based execution only
- Transparent, verifiable on-chain activity

### Use cases

Automated yield farming, stable portfolio yield enhancement, passive DeFi strategies, risk-adjusted capital allocation, and treasury optimization for DAOs and Web3 organizations.

### Long-term vision

Evolve into a foundational autonomous financial execution layer for DeFi: modular intents, multi-chain AI agents, self-optimizing capital allocation, and a decentralized “financial autopilot” for Web3.


## Roadmap

- [x] Wallet connect + smart-account prediction
- [x] Portfolio overview, DeFi position discovery, and yield strategy UI
- [x] Agent optimize/discovery API integration + Intent Registry reads/writes
- [x] Harden autonomous intent execution (session modules, safer defaults)
- [ ] Expand protocol coverage and live APY / risk sourcing
- [ ] Multi-chain agent operation and modular intent strategies
- [ ] Production agent backend, monitoring, and contributor env docs

## Install & run (PowerShell)

Node.js (LTS): https://nodejs.org/

1. Install dependencies

```powershell
npm install
```

2. Start the development server

```powershell
npm run dev
```

Open http://localhost:8080 in your browser. The app will hot-reload on changes.
