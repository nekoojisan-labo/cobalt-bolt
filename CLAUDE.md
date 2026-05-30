# CLAUDE.md — COBALT BOLT

このプロジェクトは **Codex と共通の指示書 [`AGENTS.md`](./AGENTS.md) を真実の源**とする。
作業前に必ず **`AGENTS.md` → `HANDOFF.md` → `git log --oneline -10`** を読むこと。

要点（詳細は AGENTS.md）:
- `index.html` は単一・自己完結・常にプレイ可能に保つ。当たり判定は変えず、見た目だけ差し替える。
- **コミット前に必ず検証**: `node harness.js`（24/24維持）＋ `node tools/shot.js`（PNG目視）。スプライト変更時は `node tools/spritecheck.js`。
- 協働: コミットprefixは `[claude] ...`。終わったら `HANDOFF.md` 先頭に「実施・検証・次タスク」を追記して Codex に渡す。
- 公開: `git push origin main` で https://nekoojisan-labo.github.io/cobalt-bolt/ が自動更新。
