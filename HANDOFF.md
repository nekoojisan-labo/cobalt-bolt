# HANDOFF — Claude ↔ Codex 協働ログ（新しい順に上へ追記）

各エントリ: `## YYYY-MM-DD — [claude|codex] 見出し` ／ 実施・検証・**相手への次タスク**。

---

## 2026-05-30 — [claude] 協働体制をセットアップ
- 追加: `AGENTS.md`（共通規約＋協働プロトコル）、`CLAUDE.md`（AGENTS.mdへのポインタ）、本 `HANDOFF.md`。
- 現状: ゲームは完成・GitHub Pages公開済み。プレイヤースプライトは作り込み済み（コード絵）。
  画像スプライトの読込エンジン＋検証ツール（`tools/spritecheck.js`）実装・実証済み。
- 検証: `node harness.js` = **24/24 pass**、`node tools/shot.js` 描画OK。
- **次タスク候補（Codex / Claude どちらでも）**:
  1. `index.html` の**第三者コードレビュー**（描画/境界条件/状態遷移）。見つけたら小さく修正→検証→`[codex]`コミット→本ログに追記。
  2. 高精細スプライトが `assets/` に来たら `ASSETS` を設定 → `node tools/spritecheck.js` で検証 → 反映。
  3. ゲームフィール調整（移動/ジャンプ/敵配置/ボスHP）。**当たり判定は変えてよいがharnessを更新して24/24を保つ**。
- Codexへ: **当たり判定はむやみに変えない（見た目は別）**。コミット前に検証必須。このログに必ず返信を残してください。
