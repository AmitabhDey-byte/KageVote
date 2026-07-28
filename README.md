# KageVote

[![KageVote CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

KageVote is an anime-noir, privacy-first voting dApp concept for Midnight: a voter proves eligibility locally, seals a ballot without revealing their choice, and the community verifies the proposal lifecycle and aggregate result.

> Status: KageVote uses 1AM as the preferred Midnight wallet on both **Preview** and **Preprod**. **Preview is the active deployment target.** The Vite app is Vercel-ready and the Launchpad creates a wallet-approved Preview deployment only when 1AM and the Midnight network services are available.

## Verified Midnight Preview deployment

- **Network:** Midnight Preview
- **Contract address:** `1cf1bfc2defb2ecdd15afd7b9804ce1c189a87a75e0a7d84fdd36b170c1566f0`
- **Deployment transaction ID:** `0063552d8ffc38816a41d0ff0567c4d7cc61feeb5fc6a2e5d8cb669fb4c02686eb`

The contract address is the full raw 32-byte Midnight `ContractAddress` returned by the wallet-approved deployment; it is intentionally recorded in full rather than abbreviated.

## Screenshots of UI
<img width="1400" height="700" alt="Screenshot 2026-07-27 231804" src="https://github.com/user-attachments/assets/c55b1366-f238-4104-8e71-6b8547e1407f" />
<img width="1400" height="700" alt="Screenshot 2026-07-27 231739" src="https://github.com/user-attachments/assets/f9ff2961-a894-4e07-b94b-f3554071684a" />
<img width="1400" height="700" alt="Screenshot 2026-07-27 231706" src="https://github.com/user-attachments/assets/735a6103-40a2-472d-b6e1-b7c759facc55" />
<img width="1400" height="700" alt="Screenshot 2026-07-27 232017" src="https://github.com/user-attachments/assets/a4f946c8-b58a-457d-86fa-5ee23e66236c" />
## Test Passing Screenshot

<img width="1400" height="800" alt="Screenshot 2026-07-28 171306" src="https://github.com/user-attachments/assets/3619a9cc-dab2-476b-95cd-68546748e0d6" />
<img width="1400" height="300" alt="Screenshot 2026-07-28 171212" src="https://github.com/user-attachments/assets/e7ff037f-ba89-43fd-80b4-54db64f30544" />

## Mobile Responsive UI

<img width="360" height="800" alt="WhatsApp Image 2026-07-28 at 5 17 20 PM" src="https://github.com/user-attachments/assets/9c85f9c8-b082-42d4-a082-1ba6a2098df9" />
<img width="360" height="800" alt="WhatsApp Image 2026-07-28 at 5 17 20 PM (2)" src="https://github.com/user-attachments/assets/263d3b5c-e3bd-46fb-8987-d8a65caf088a" />
<img width="360" height="800" alt="WhatsApp Image 2026-07-28 at 5 17 20 PM (1)" src="https://github.com/user-attachments/assets/2b9c85a0-e44a-4770-80ca-d036b9a64f58" />


## Live Website Link
https://kage-vote.vercel.app/
## live demo video



## Initial product idea

KageVote brings private voting to communities that need credible outcomes without turning participation into a public social graph. Members prove they satisfy an eligibility rule through a local witness, while their identity and ballot selection remain private. A proposal’s text, timing, proof-validity signals, and aggregate final tally remain public so the community can audit the decision without being able to reconstruct who voted for what.

## Features

- Real multi-wallet connection through `window.midnight`: 1AM is preferred by default for both Preview and Preprod; Lace remains an explicit fallback. The app validates the returned network and displays the shielded address.
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

### Connect 1AM or Lace on Preview or Preprod

1. Install and unlock [1AM](https://1am.xyz/) or a Midnight-compatible Lace wallet.
2. Select the detected extension in KageVote's `WALLET` picker.
3. Select `PREVIEW` or `PREPROD` in KageVote's network picker.
4. In the selected wallet, switch to the same Midnight network and configure its proving service as required by the network.
5. Click **Connect wallet** and approve the wallet prompt.

KageVote discovers each compatible wallet from the official DApp Connector injection (`window.midnight`) and lets the user select it before calling `connect(network)`. It validates the returned connection/network before displaying the shielded address. It only asks the wallet for connection configuration, status, shielded address, and DUST-balance capability; it does not request a seed phrase or initiate a transfer. Midnight documents multi-wallet selection and its wallet-controlled service configuration in the [DApp Connector API](https://docs.midnight.network/api-reference/dapp-connector).

`src/lib/midnightWallet.ts` explicitly configures 1AM for both connector network IDs: `preview` and `preprod`. KageVote prefers 1AM whenever it is injected, and passes the selected ID unchanged to `connect(network)`. A contract must be deployed separately on each network, so Preview and Preprod will have different real contract addresses.

If the connection is not detected, unlock 1AM or Lace, confirm that its Midnight network matches KageVote's network picker, then refresh the page. Once connected, the voting chamber displays a copyable, shortened version of the confirmed shielded address.

### Deploy Veil Allowlist on Preview

The deployment happens in the browser through the selected 1AM wallet; it is **not** a Vercel server action and it is not a terminal command. After funding 1AM on Preview:

1. Open the deployed KageVote app in the same browser as 1AM.
2. Select **PREVIEW**, choose **1AM**, and click **Connect wallet**.
3. Open **Launchpad** and choose **Deploy Veil Allowlist to Preview**.
4. Approve any 1AM prompts and wait for finalization.
5. Copy the full contract address and transaction ID shown in the Launchpad. Send them to the maintainer to record at the top of this README.

The browser deployment client at [`src/lib/veilAllowlistDeploy.ts`](src/lib/veilAllowlistDeploy.ts) fetches the bundled ZK keys, follows 1AM's configured Preview indexer/prover endpoints, asks the wallet to balance/sign the transaction, and submits it only through the wallet. If Preview is offline, the transaction cannot finalize and no address will be displayed.

> Important: Veil Allowlist proves private membership; it does **not** contain `castPrivateBallot()`. To submit a real ballot, deploy the separate `contracts/KageVote.compact` contract from the Launchpad's **Deploy KageVote to Preview** button, then cast a ballot against that new contract address.

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

Never place the key in a `VITE_*` variable, frontend bundle, or repository. Locally, the Express endpoint in `server/index.mjs` holds the key; in production, `api/kiri.mjs` is a Vercel Function. Set `GEMINI_API_KEY` and optional `GEMINI_MODEL` in **Vercel Project Settings -> Environment Variables** for Preview and Production. The key stays server-side and Kiri falls back to local replies if it is absent. See the [Gemini API reference](https://ai.google.dev/api) for current server-side API guidance.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. Keep the detected **Vite** framework settings: build command `npm run build` and output directory `dist`.
3. Add `GEMINI_API_KEY` (and, optionally, `GEMINI_MODEL=gemini-3.5-flash`) under Environment Variables. Do not use the `VITE_` prefix.
4. Deploy. `vercel.json` preserves SPA deep links such as `/privacy`; `/api/kiri` is served by the included serverless function.

Vercel automatically serves functions placed in the root `api/` directory, and its Vite deployment guide documents the SPA rewrite used here. See [Vercel Functions](https://vercel.com/docs/functions) and [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Midnight contract and Preview path

The primary rubric contract is [`contracts/veil-allowlist.compact`](contracts/veil-allowlist.compact): it proves private allowlist membership with a witness, deliberately discloses only the Boolean rule outcome, and records only aggregate successful entries as public state. The voting prototype remains at [`contracts/KageVote.compact`](contracts/KageVote.compact). `npm run contract:check` validates the privacy primitives in both contracts.

`managed/` is checked in and was generated from Veil Allowlist by the official Compact compiler `0.31.1`. It contains the generated client, ZKIR circuits, and prover/verifier keys; see [`managed/compiler/contract-info.json`](managed/compiler/contract-info.json) for compiler-produced metadata and [`managed/README.md`](managed/README.md) for regeneration instructions.

For a real Preview deployment:

1. Install the official Midnight Compact compiler so `compact compile` resolves to the compiler, not Windows’ built-in `compact.exe`.
2. Provision a funded Preview wallet in 1AM outside this repository.
3. Confirm the Preview indexer/proving service is reachable in 1AM.
4. Deploy from the browser Launchpad button. It uses the wallet's `getProvingProvider`, `balanceUnsealedTransaction`, and `submitTransaction` methods.
5. The generated `managed/` circuits and keys are checked in and bundled at build time under `/keys` and `/zkir` for the browser proof flow.
6. After successful finalization, put the complete verified Preview contract address and transaction ID at the top of this README. Never use a shortened or placeholder address.

The contract’s design follows Midnight’s public-ledger / private-witness model: [Compact language overview](https://midnight.network/blog/compact-the-smart-contract-language-of-midnight) and [Midnight network overview](https://midnight.network/overview).

### Network-specific deployment records

- Preview: deployment requires a funded 1AM Preview wallet; record its complete address and transaction hash after wallet approval and finalization.
- Preprod: deployment requires a funded 1AM Preprod wallet; record its complete address and transaction hash after approval.
- Never copy an address between the networks or submit a shortened/placeholder address.

## Project structure

```text
src/                    React voting UI, routes, styles, local Kiri guide
api/kiri.mjs            Production Vercel Function for the Gemini proxy (optional)
server/index.mjs        Local Express Gemini proxy (optional)
contracts/KageVote.compact
scripts/check-contract.mjs
public/assets/kiri-guide.png
.github/workflows/ci.yml
```

## CI

The GitHub Actions workflow installs the official Compact compiler, compiles Veil Allowlist to `managed/`, validates the contract source, runs ten tests, type checks, and builds the production app on every push and pull request.

## Important limitations

- Wallet connection and Preview deployment are real when 1AM is installed, selected, and confirms the selected network. The vote interaction remains disabled until a deployed contract is joined and the voting circuit is wired to the UI.
- The included Compact contract is deliberately a first-cycle foundation; it counts valid participation but does not yet implement production-grade encrypted ballot storage, nullifiers, authority checks, or final tally aggregation.
- Do not use it for real elections or handling funds without a formal security review and a completed protocol design.
