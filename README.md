# KageVote

[![KageVote CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

KageVote is an anime-noir, privacy-first voting dApp concept for Midnight: a voter proves eligibility locally, seals a ballot without revealing their choice, and the community verifies the proposal lifecycle and aggregate result.

> Status: the app now uses Midnight's DApp Connector to connect a compatible wallet extension (such as Lace) on **Preview** or **Preprod** and display its confirmed shielded address. A real contract call is intentionally not claimed yet because this workstation does not have the official Compact compiler, Docker/proof server, generated ZK artifacts, or a deployed/funded contract.

## Initial product idea

KageVote brings private voting to communities that need credible outcomes without turning participation into a public social graph. Members prove they satisfy an eligibility rule through a local witness, while their identity and ballot selection remain private. A proposal’s text, timing, proof-validity signals, and aggregate final tally remain public so the community can audit the decision without being able to reconstruct who voted for what.

## Features

- Real wallet-extension connection through `window.midnight`: choose Preview or Preprod, connect Lace, validate the returned network, and display the shielded address.
- Safe live-voting gate: the interface refuses to fabricate a receipt or submit a ballot until the contract address, generated contract client, and ZK artifacts exist.
- Light and dark modes, persisted locally.
- Five navigable product views: voting chamber, proposal archive, privacy model, Kiri guide, and developer launchpad.
- Kiri, an original in-app privacy guide with safe local fallbacks and an optional Gemini server integration.
- Responsive manga-panel visual system with reduced-motion support.
- Compact starter contract with public ledger state, local witnesses, and deliberate `disclose()` use.

## Privacy model

| Data | Observer can learn? | Reason |
| --- | --- | --- |
| Proposal text and ID | Yes | A community needs a common object to decide on. |
| Voting window | Yes | Anyone can verify when a ballot can be accepted. |
| Aggregate participation / final tally | Yes | The collective result needs auditability. |
| Wallet address or identity | No | Eligibility is proven from a private witness. |
| Ballot choice | No | It is a private witness and is never assigned to public ledger state. |
| Credential evidence | No | The circuit proves the rule outcome, not the underlying credential. |

`disclose()` is used only for the eligibility predicate and a range-validity predicate in the starter contract. The raw credential and raw ballot selection are not disclosed or written to the public ledger. This first-cycle contract deliberately exposes only aggregate participation; production tally encryption / aggregation must be added before claiming private-choice tallies on a live network.

## Run locally

Prerequisite: Node 22+.

```bash
npm install
npm run dev
```

Open the Vite address shown in the terminal (normally `http://localhost:5173`). The UI connects to the local API at port `8787` through Vite’s proxy.

### Connect Lace on Preview or Preprod

1. Install and unlock a Midnight-compatible Lace wallet.
2. Select `PREVIEW` or `PREPROD` in KageVote’s network picker.
3. In Lace, switch to the same Midnight network and configure its proving service as required by the network.
4. Click **Connect Lace** and approve the wallet prompt.

KageVote discovers the wallet from the official DApp Connector injection (`window.midnight`), calls `connect(network)`, and validates the returned connection/network before it displays the shielded address. It only asks the wallet for connection configuration, status, shielded address, and DUST balance capability; it does not request a seed phrase or initiate a transfer. Midnight documents this connector pattern and its wallet-controlled service configuration in the [DApp Connector API](https://docs.midnight.network/api-reference/dapp-connector).

```bash
npm test
npm run typecheck
npm run build
npm run contract:check
```

## Optional Gemini-powered Kiri

Kiri works out of the box with local, privacy-scoped replies. To enable Gemini answers, copy `.env.example` to `.env` and configure the secret **on the server only**:

```bash
GEMINI_API_KEY=your_restricted_key
GEMINI_MODEL=gemini-3.5-flash
```

Never place the key in a `VITE_*` variable, frontend bundle, or repository. The Express endpoint in `server/index.mjs` holds the key, constrains Kiri’s scope, and falls back to local replies if it is absent. See the [Gemini API reference](https://ai.google.dev/api) for current server-side API guidance.

## Midnight contract and Preprod path

The Compact starter is at [`contracts/KageVote.compact`](contracts/KageVote.compact). It has public proposal state plus private witness declarations. `npm run contract:check` validates the expected privacy primitives without pretending to be a compiler.

Before a real deployment:

1. Install the official Midnight Compact compiler so `compact compile` resolves to the compiler, not Windows’ built-in `compact.exe`.
2. Install Docker and run the Midnight proof server required by your selected network setup.
3. Provision a funded Preprod wallet outside the repository.
4. Run `npm run prepare:preprod`, which calls `compact compile contracts/KageVote.compact --output managed`.
5. Add the generated `managed/` circuits and keys, then record the actual deployed address in a release note or deployment file.
6. Generate the contract TypeScript client and wire `castPrivateBallot` to Midnight.js. The connector is already in place; the remaining call must use the compiled contract, wallet proving provider, ZK artifact provider, `balanceUnsealedTransaction`, and `submitTransaction`.

The contract’s design follows Midnight’s public-ledger / private-witness model: [Compact language overview](https://midnight.network/blog/compact-the-smart-contract-language-of-midnight) and [Midnight network overview](https://midnight.network/overview).

## Project structure

```text
src/                    React voting UI, routes, styles, local Kiri guide
server/index.mjs        Server-side Gemini proxy (optional)
contracts/KageVote.compact
scripts/check-contract.mjs
public/assets/kiri-guide.png
.github/workflows/ci.yml
```

## CI

The GitHub Actions workflow runs contract source validation, type checking, four tests, and the production build on every push and pull request. The workflow will appear after this repository is pushed to GitHub.

## Important limitations

- Wallet connection is real when a compatible Lace extension is installed and confirms the selected Preview/Preprod network. Ballot submission is not enabled until the proof server, generated artifacts, and deployed contract are present.
- The included Compact contract is deliberately a first-cycle foundation; it counts valid participation but does not yet implement production-grade encrypted ballot storage, nullifiers, authority checks, or final tally aggregation.
- Do not use it for real elections or handling funds without a formal security review and a completed protocol design.
