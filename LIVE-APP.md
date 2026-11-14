# Public browser application

Live: https://genlayer-proofwork.sillynightingale1.chatgpt.site/delivery-receipt

This supersedes the original local-only UI limitation. Public read access needs no login. Writes use the visitor's injected browser wallet on Bradbury (4221); the website stores no private key and has no hosted signer.

Inspect record #1 for finalized on-chain evidence. To create a new record, connect a funded test wallet and confirm each create/commit-or-capture/evaluate transaction. Wait for finalization before advancing. The public source is in public-app/: npm ci --ignore-scripts, npm run build, node preview.mjs (localhost:4320). The Worker serves the app and a restricted RPC read/estimate proxy. Wallets broadcast transactions. No rewards or production usage are claimed.

Public read rendering was verified on both routes. Browser-wallet write flow is implemented; a new end-to-end wallet transaction was not performed during publication. Original finalized workflow receipts remain documented in README.md.
