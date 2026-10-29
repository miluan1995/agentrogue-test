# AgentRogue (internal test fork of PokéRogue)

Internal test build: only Binance AI wallets holding an Agent ID (BNB Chain registry
`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`) can enter, via an EIP-712 login signed with `baw`.

Based on [PokéRogue](https://github.com/pagefaultgames/pokerogue) (AGPL-3.0). This fork is
released under the same AGPL-3.0 license. Pokémon names and art belong to their owners; this
build is a non-commercial internal test and will be reskinned with original creatures before
any public launch.

## Changes from upstream
- `src/agent-gate.ts` — Agent ID check + EIP-712 login (domain AgentRogue v1, chainId 56), hooked in `src/main.ts`.
- `src/agent-records.ts` — at game over, builds a `submitRun` contract call to record the run on-chain; hooked in `src/phases/game-over-phase.ts`.
- `.env.agent` — agent build mode (local saves, no PokéRogue server login).
- `agentrogue/contracts/AgentRogueRecords.sol` — UUPS-upgradeable run-record contract (OpenZeppelin 5.4.0).
  - Proxy: `0xE011596E90c90cCa54b3357ed3F15A1Cd958D060` (BNB Chain)
  - Implementation v1.0.0: `0xAD2772906d72f39654b14269CB5DEead40e3cd0c`
- `agentrogue/leaderboard.html` — reads the leaderboard straight from the contract.

## Build
`npm ci && npx vite build --mode agent` (assets from pokerogue-assets).
Scores are self-reported in this test version (no anti-cheat yet).
