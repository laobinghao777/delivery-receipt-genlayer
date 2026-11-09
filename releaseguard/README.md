# ReleaseGuard

ReleaseGuard records whether an exact published GitHub release explicitly supports a software announcement. It separates **evidence capture** from **AI interpretation**: validators fetch the official tag endpoint and agree on normalized evidence before an immutable claim is assessed against that frozen snapshot.

Supported means the notes support the claim, **not** that code was audited or a feature works. Missing evidence is not contradiction. Fetch failure, draft releases, identity mismatch, oversized notes and snapshot disagreements fail closed; they do not become negative judgments.

## Implementation

`contracts/release_guard.py` restricts GitHub owner/repository/tag components and constructs the HTTPS API URL itself. No arbitrary hosts, query strings or encoded path separators are accepted. Normalized release identity, publication time, prerelease flag, title and full notes are agreed with `strict_eq`. No silent truncation occurs. A SHA-256 binds the snapshot. A separate comparative AI consensus returns supported, contradicted or insufficient_evidence. Citation IDs are resolved to exact original passages by contract code. Only the creator may mutate a record; snapshots and final decisions cannot be overwritten.

Trust limits: GitHub/API availability, publisher honesty, mutable release notes before capture, AI error and validator disagreement. Supported tags are limited to ASCII letters, digits, dash, underscore and dot. Long release notes are rejected. It does not inspect code or prove functionality. No escrow or token transfers are implemented.

## Run

Requires Node.js 20+ and Python 3.12+. Install the pinned dependencies listed in package.json. Put a dedicated test wallet key in ignored `pk.txt` in the parent workspace, as used by the local signer; never upload it. Run `python tests.py`, then `node scripts/server.mjs`. Open http://127.0.0.1:4318. The browser creates a check, captures release evidence, then assesses the claim. Wait for finalized transactions before the next operation. Local HTTP requires a per-process bearer token and rejects other hosts and origins. This is a local signer workbench, not a publicly hosted multi-wallet product.

## Deployment

Bradbury Phase 2, chain 4221. Contract `0x92542C9aFb218B42C3a6bFcd3affFbA6Bd85F164`.

Deployment transaction: https://scan.bradbury.genlayer.com/tx/0x2acfe99b948b23ff3d31568bbfd72fe5cb217145bb48be752a1be4b2aa25ef65

Finalized deployment net cost: **0.000141736010002117 GEN**.

## Verified example

Record 1 checks the claim that Flask 3.1.2 fixes `stream_with_context` failing in async views. All three operations finalized successfully. The stored verdict is **supported**, with exact source passages and snapshot SHA-256 `0d17d9027d9cfb4fb359dfd20b14292507066149c0a9541b4dda665fa3315472`.

- Create: https://scan.bradbury.genlayer.com/tx/0x52ece6162d2cd644a27f3372f3d6974069ff0f76fc5893f7de6d19db618082c4
- Capture: https://scan.bradbury.genlayer.com/tx/0x1ba6450c4916c8341ee0d1f07c00f62f651a240a0d00dc1f76da4ceb44f2b41a
- Assess: https://scan.bradbury.genlayer.com/tx/0x98220efe4bc33a7830389ca9648326644c5705465bd098ba34a98d74c4a57152

Settled workflow net cost: **0.000251974810005998 GEN**. Including deployment: **0.000393710820008115 GEN**. Temporary local RPC read failures were reconciled using the original transaction IDs; no duplicate transactions were sent. No Portal approval or rewards are claimed.
