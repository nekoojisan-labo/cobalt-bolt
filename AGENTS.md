# AGENTS.md — COBALT BOLT（Codex / Claude 共通プロジェクト規約）

> このファイルは **Codex と Claude Code の共通の指示書**です。両エージェントはこの1ファイルを真実の源とし、
> `HANDOFF.md` と `git log` を読んでから作業を始めること。

## プロジェクト概要
**COBALT BOLT** — HTML5 Canvasの**単一ファイル**横スクロールアクションゲーム（ロックマン風）。
1ステージ＋雑魚4種（met / walker / flyer / turret）＋ボス（行動3パターン）。素材なしでも動く（ドット絵はコード描画）。

- リポジトリ: `nekoojisan-labo/cobalt-bolt`（Public）
- 公開URL: https://nekoojisan-labo.github.io/cobalt-bolt/ （`git push origin main` で自動更新）
- ローカル正本（Codex/Claude 共有フォルダ）: `C:\Users\withd\Desktop\cobalt-bolt`

## ファイル構成
| ファイル | 役割 |
|----------|------|
| `index.html` | ゲーム本体（ロジック＋描画）。これ単体で動く自己完結ファイル |
| `harness.js` | ヘッドレスでゲームループを実走させる**ロジック自動テスト（24項目）** |
| `tools/shot.js` | Canvas2Dを自作エミュ→**画面をPNG出力**（描画の目視確認用） |
| `tools/spritecheck.js` | PNGデコーダ＋drawImageで**画像スプライトの載りを検証** |
| `assets/` | スプライトシート置き場。`ASSETS_GUIDE.md` / `AI_PROMPT.md` 参照 |

## 絶対ルール（破らない）
1. **`index.html` は単一・自己完結・常にプレイ可能**に保つ。ビルド手順や外部ライブラリを足さない。
2. **当たり判定はコード定義**（`PW/PH`、各エンティティの `w/h`）。**見た目／スプライト変更で当たり判定を変えない**（ビジュアルだけ差し替え）。
3. **コミット前に必ず検証**（私たちはブラウザを直接見られない＝この検証が“目”）:
   - `node harness.js` … **24/24 を維持**すること
   - `node tools/shot.js` … `tools/shot_*.png` を開いて**描画の回帰がないか目視**
   - スプライトを触ったら `node tools/spritecheck.js`
   → 検証OKを確認してからコミットする。
4. ゲームは検証用に `globalThis.__GAME`（state/player/enemies/boss/step/hold/release/draw/assets/loadAssets）を公開。**壊さない**。
5. スプライトエンジン: `ASSETS[entity] = { fw,fh,scale,ax,ay, anims:{ name:{src,frames,fps} } }`。
   素材が無い／未ロードなら**コード描画にフォールバック**（ゲームは絶対に壊れない）。

## 実行・確認
- 遊ぶ: `index.html` をブラウザで開く
- ロジック: `node harness.js`
- 描画: `node tools/shot.js` → `tools/shot_*.png` を見る

## Claude ↔ Codex 協働プロトコル
同じgitリポジトリを受け渡しの場にする。

1. 作業を1単位終えたら：
   - 上記の**検証を実行**
   - **コミットのprefixで担当を明示**（Codexは `[codex] ...`、Claudeは `[claude] ...`）
   - `HANDOFF.md` の先頭に**実施内容・検証結果・相手への次タスク提案**を追記
2. 着手前に **`HANDOFF.md` と `git log --oneline -10`** を読み、相手の最新ハンドオフを確認
3. **小さく検証可能なコミット**を心がける。並行で危険な編集をするときは**ブランチを切る**
4. 迷ったら相手に判断を委ねる旨を `HANDOFF.md` に書いて渡す

## 現状（最新は HANDOFF.md）
- ゲーム完成・公開済み。プレイヤースプライトは作り込み済み（コード絵）。
- 画像スプライト・パイプライン実装＆検証済み。**高精細スプライト（assets/配置）待ち**（ピクセル特化AIで生成する方針）。
