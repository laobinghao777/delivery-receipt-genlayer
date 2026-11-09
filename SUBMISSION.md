# Delivery Receipt — contribution submission

## Suggested title
Delivery Receipt: evidence-bound text acceptance with immutable criteria and GenLayer consensus

## Summary
Delivery Receipt is a working text-delivery acceptance application on GenLayer Bradbury Phase 2. A creator commits 1–8 acceptance criteria, then commits the actual delivery text. GenLayer validators evaluate each criterion through `gl.eq_principle.prompt_comparative`. The contract derives the aggregate verdict and permanently stores the assessment with the SHA-256 of the committed delivery.

## The trust problem
A client and a writer can disagree about whether a delivered document meets their written requirements. A single operator-hosted LLM can be replaced or its output rewritten. This implementation makes the agreed criteria, submitted text, per-criterion decision and source evidence independently inspectable on GenLayer. It is scoped to supplied text, not code execution or external URL verification.

## What is implemented
- Creator-only mutation; criteria and evidence cannot be overwritten after commitment.
- One final assessment per brief; revisions require a new brief.
- `met`, `not_met` and `unclear` decisions, with an explicit non-pass state for insufficient evidence.
- AI cites numbered passages. The contract copies the exact original passage; it never trusts model-generated quotations.
- The consensus principle requires the same status for every criterion while allowing semantically equivalent explanations.
- The contract, not the model, computes the aggregate verdict and binds it to the evidence hash.
- A Chinese responsive web workbench, read-back verification, tracked transaction finalization and actual test-GEN cost export.

## Why GenLayer is necessary
The acceptance decision is subjective natural-language judgment. It is executed through GenLayer's multi-validator AI consensus, rather than an external API whose verdict is merely copied to a blockchain. The frontend reads real contract state and invokes real contract writes through the local backend.

## Evidence
- Source: https://github.com/laobinghao777/delivery-receipt-genlayer
- Network: Bradbury Phase 2, chain ID 4221.
- Contract: `0x054a7a333A488af1C65A603edBcC7862aB2F2311`
- Deployment: https://scan.bradbury.genlayer.com/tx/0x745ceb9e3bab815a74981bae8784ce5dc993d49c24b3ab524f2c9461d3a7e7ae
- Create brief: https://scan.bradbury.genlayer.com/tx/0xb7966380f81d2e6f3115f8e12b6fec1e6c2a8e7839c125b333640fab8b01db3c
- Commit delivery: https://scan.bradbury.genlayer.com/tx/0x7e14d72330a8c935c4daddb6e838ff1f0a3496fb4e6297826248916b2ffaac32
- Evaluate: https://scan.bradbury.genlayer.com/tx/0xe6d00a0cb2075822f4b6ac301aeb71e152e98f7ea7e8674e337ce220be98a424
- Brief `1` has three accepted criteria with stored Chinese explanations and exact original passages.
- Deployed contract SHA-256: `323c65f0838bbf6e3ad3bb1a00bc29221a471984059b835dc3101e7e21c211d7`.
- Eight business-rule tests cover ownership, immutable commitments, invalid evidence IDs, omitted criteria, non-pass ambiguity, finality, response shape and invalid criteria. Real consensus was tested separately with the transactions above.

## Reproduction
Node.js 20+ and Python 3.12+ are required. Install with `npm ci --ignore-scripts`. Use a dedicated test wallet in a local, ignored `pk.txt`; never upload it. Run `npm test`, then `npm start`, and open http://127.0.0.1:4317. The published deployment is reused automatically. The local demo runner is resumable with `npm run demo`.

## Current scope and limitations
This is a functioning local development application, not a publicly hosted multi-wallet product. No production users, usage figures, partnerships or Portal rewards are claimed. The public source and public deployed contract are available for verification. AI consensus can still make mistakes; quote integrity and consensus checks are safeguards, not a correctness guarantee. There is no escrow or token transfer feature.

## Cost evidence
The successful create → commit → evaluate workflow cost `0.000256033440005644 GEN` after final refunds. The one-time final deployment cost `0.000145349030002117 GEN`. Total development including the earlier deployment, an EVM revert and a rejected assessment was `0.000735629410014112 GEN`.

## Submission status
Prepared for submission. Not submitted or approved yet. Portal account login and the actual category-specific form must be verified before submitting. Do not represent this document as evidence that points have been awarded.
