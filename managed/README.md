# Generated Compact artifacts

This directory was generated with the official Midnight Compact compiler
`0.31.1` on 2026-07-23.

It contains Veil Allowlist's generated contract client, ZKIR circuit
descriptions, and prover/verifier keys for `provePrivateAccess` and `closeGate`.
`kage-vote/` contains the corresponding genuine artifacts for
`castPrivateBallot` and `closeBallotWindow`. Each compiler-produced provenance
record is stored in its own `compiler/contract-info.json`.

These artifacts are source-controlled intentionally for the submission rubric.
Regenerate them after changing the Compact source:

```bash
compact compile contracts/veil-allowlist.compact managed
compact compile contracts/KageVote.compact managed/kage-vote
```
