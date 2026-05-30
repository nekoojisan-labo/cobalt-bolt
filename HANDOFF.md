# HANDOFF — Claude ↔ Codex 協働ログ（新しい順に上へ追記）

各エントリ: `## YYYY-MM-DD — [claude|codex] 見出し` ／ 実施・検証・**相手への次タスク**。

---

## 2026-05-30 - [codex] Walker enemy painterly sprite generated
- Generated with built-in `image_gen` using `ART_DESIGN.md` enemy/boss shared style rules and the walker brief; post-processed chroma-key source to a transparent RGBA PNG strip.
- Saved `assets/enemy_walker.png` - 4 frames, 128x128 per frame, horizontal strip 512x128.
- Verification: exact dimensions and alpha/corner transparency confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Next for Claude: wire walker walk animation when adding enemy sprite ASSETS. No code or hitboxes changed.

## 2026-05-30 - [codex] Met enemy painterly sprites generated
- Generated with built-in `image_gen` using `ART_DESIGN.md` enemy/boss shared style rules and the met brief; post-processed chroma-key sources to transparent RGBA PNG strips.
- Saved `assets/enemy_met_hide.png` - 1 frame, 128x128 per frame, horizontal strip 128x128.
- Saved `assets/enemy_met_open.png` - 3 frames, 128x128 per frame, horizontal strip 384x128.
- Verification: exact dimensions and alpha/corner transparency confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Next for Claude: wire met hide/open when adding enemy sprite ASSETS. No code or hitboxes changed.

## 2026-05-30 - [codex] Hero remaining painterly sprites generated
- Generated with built-in `image_gen` using `ART_DESIGN.md` hero STYLE HEADER and existing `assets/player_idle.png` / `assets/player_run.png` as visual style references; post-processed chroma-key sources to transparent RGBA PNG strips.
- Saved `assets/player_jump.png` - 2 frames, 256x256 per frame, horizontal strip 512x256.
- Saved `assets/player_shoot.png` - 2 frames, 256x256 per frame, horizontal strip 512x256.
- Saved `assets/player_charge.png` - 4 frames, 256x256 per frame, horizontal strip 1024x256.
- Saved `assets/player_hurt.png` - 2 frames, 256x256 per frame, horizontal strip 512x256.
- Verification: exact dimensions and alpha/corner transparency confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Next for Claude: wire these assets into `ASSETS.player` when ready. No code or hitboxes changed.

## 2026-05-30 — [claude] エンジン1920×1080化＋塗り2D主人公を反映（HD化成功）
- Codexの塗り2D素材(player_idle 5f/1280×256, player_run 8f/2048×256)は**本物の高精細2D**を確認（金属艶・発光・マント・設計書準拠）。
- **エンジンHD改修**: 内部1920×1080化（RS=4／render冒頭で`setTransform(RS,...)`／`imageSmoothingEnabled=true`／CSS`image-rendering:auto`／fitをスムーズ拡縮）。ワールド座標(480×270)・物理・当たり判定は**不変**。
- `ASSETS.player` を fw256/fh256・idle5f・run8f・scale0.16・ay0.98 に更新。
- `tools/preview.js` を 1920×1080・setTransform対応に更新→ idle/run/反転すべて**接地◎・高精細表示◎**を確認。`node harness.js`=24/24維持。
- **既知**: `tools/shot.js`・`tools/spritecheck.js` は旧480×270前提でsetTransform未対応＝HD化後は要更新（未対応のまま。検証はpreview.jsを使う）。
- **次タスク（分担）**:
  - [codex] ART_DESIGN.md に沿って塗り2Dを継続生成: 主人公 jump/shoot/charge/hurt → 敵4種 → ボス → 弾/FX → 地形/背景/プロップ → UI。**Codex内蔵image_gen＋各章STYLE HEADER**で。
  - [claude] 背景3層/地形テクスチャ/弾・FX の**画像描画フック追加**＋各素材の反映・検証。`shot/spritecheck`のHD対応。

## 2026-05-30 - [codex] High-fidelity 2D player idle/run assets generated
- Used real image generation: Codex built-in `image_gen` with the `ART_DESIGN.md` section 1 STYLE HEADER plus the `player_idle` / `player_run` English prompts, generated on chroma-key green and locally converted to alpha PNGs.
- Saved `assets/player_idle.png` - 5 frames, 256x256 per frame, horizontal strip 1280x256, RGBA transparent PNG.
- Saved `assets/player_run.png` - 8 frames, 256x256 per frame, horizontal strip 2048x256, RGBA transparent PNG.
- Verification: exact dimensions and alpha confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Note for Claude: code/hitboxes were not modified per request, so `index.html` still contains the old player sprite metadata (`fw:48`, idle 4f, run 6f) until a later wiring pass.

## 2026-05-30 — [claude] ★アート方針転換: 高精細2D(塗り/フルHD)＋設計書ART_DESIGN.md作成
- ユーザー判断: **現状の画質は低すぎ→ドット絵をやめ高精細イラスト2Dへ転換**、解像度フルHD(1920×1080)。素材は別途ちゃんと作る。
- 作成: **`ART_DESIGN.md`**（5章942行のアートバイブル: 主人公/敵ボス/環境/弾FX UI/技術。各アセットにサイズ・コマ・fps・ファイル名・視覚ブリーフ・英語painterlyプロンプト・STYLE HEADER）。
- AGENTS.md更新: アート公式設計書=ART_DESIGN.md。旧 `assets/AI_PROMPT.md`/`ASSETS_GUIDE.md`(ピクセル時代)は**廃止**。
- **次タスク（分担）**:
  - [codex] ART_DESIGN.md に従い素材生成（まず主人公 idle/run の塗り2D・256×256）→assets/保存→[codex]コミット。**毎回プロンプト先頭に各章STYLE HEADERを付ける**。
  - [claude] **エンジンを1920×1080化**（RENDER_SCALE=4・スムージングON・image-rendering解除・ASSETS scale再計算・背景/地形/弾FXの画像描画フック追加）。素材到着で反映・検証(preview/harness)。

## 2026-05-30 — [claude] Codex生成スプライトをゲームに反映・検証・公開
- `ASSETS.player` に `player_idle`(4f)/`player_run`(6f) を紐付け（scale0.62, ax0.5, ay1）。jump/shootは未生成→idleで自動代用。
- `tools/preview.js`（実PNG読込→ゲーム画面PNG出力）を新規作成し検証:
  - idle接地◎ / 走行アニメ(右)◎ / 左右反転(左)◎ / サイズ感◎ → **動きに合わない箇所なし＝調整不要**。
- `node harness.js` = 24/24維持。コミット＆push済み（公開URLに反映）。Codexの 9ae1f2a も同時push。
- **次タスク候補（Codex/Claudeどちらでも）**: 同じ流れで `player_jump`/`player_shoot`、敵4種、ボス、弾、タイル/背景を生成→反映。背景/タイル/弾は画像対応の配線を追加実装してから紐付け。

## 2026-05-30 - [codex] player idle/run PNG assets saved
- Saved `assets/player_idle.png` - 4 frames, 48x48 per frame, horizontal strip 192x48, RGBA transparent PNG.
- Saved `assets/player_run.png` - 6 frames, 48x48 per frame, horizontal strip 288x48, RGBA transparent PNG.
- Verification: files exist/non-empty with alpha; `node harness.js` = 24/24 pass; `node tools/spritecheck.js` rendered OK; `node tools/shot.js` rendered OK.
- Next for Claude: wire these two files into `ASSETS` and check in-game visual alignment. Codex did not modify code or hitboxes.

## 2026-05-30 — [claude→codex] 画像生成タスク（主人公 idle/run）
**Codexへの依頼**: COBALT BOLT の主人公スプライトを生成して `assets/` に保存してください。
- 参照: `assets/AI_PROMPT.md`（共通スタイル指定＋プロンプト）。
- computer-use が使えるなら **PixelLab.ai か Leonardo.ai の無料機能**をブラウザ操作して生成可。
- 仕様（厳守）:
  - `assets/player_idle.png` … 48×48 ×**4コマ**の横ストリップ（192×48）、**透過PNG**、待機モーション
  - `assets/player_run.png`  … 48×48 ×**6コマ**の横ストリップ（288×48）、**透過PNG**、走行モーション
  - 主人公＝コバルトブルー＋cyan発光＋white trim の小型ロボ。**全コマ同一デザイン**。背景・影なし。
- **コード/当たり判定は一切変更しない**（画像を置くだけ）。
- 完了したら `[codex]` でコミットし、このログ先頭に「保存ファイル名・コマ数・サイズ」を追記して Claude に返すこと。
- **次は Claude が `ASSETS` 設定→`tools/spritecheck.js`/`tools/shot.js` で検証→動きに合わなければ調整**します。

## 2026-05-30 — [claude] 専用フォルダ cobalt-bolt に移設（Codex/Claude 共有）
- ローカル正本を `C:\Users\withd\Desktop\cobalt-bolt` に変更（GitHubからclone。git履歴・remote・Pages URLは不変）。
- **Codex/Claude は今後この1フォルダを共有**して作業する。
- 旧 `rockman-style-game` は破棄予定（Codex Desktop等のロック解除後に削除）。**旧フォルダは触らないこと**。
- 検証: 新フォルダで `node harness.js` = 24/24、`node tools/shot.js` 描画OK、remote正常。
- Codexへ: ワークスペースは **cobalt-bolt** を開くこと。

## 2026-05-30 — [claude] 全要素の画像生成ガイドを整備
- ユーザー方針: **まず画像を作る**（背景/ステージobj/ボス/敵/主人公/弾 の全要素を高精細化）。
- 更新: `assets/AI_PROMPT.md` を全要素・統一画風の完全版に（共通スタイル指定＋各プロンプト＋サイズ/コマ/ファイル名/生成順）。
- 状態: キャラ（主人公/敵/ボス）の画像スプライト機構＆検証は実装済。背景/タイル/弾の画像対応は**素材到着時に配線予定**（現状はコード描画フォールバック）。
- 次タスク: ユーザーが `player_idle/run` を生成→`assets/`配置→Claudeが `ASSETS` 設定＋`spritecheck`/`shot` 検証→反映。

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
