# HANDOFF — Claude ↔ Codex 協働ログ（新しい順に上へ追記）

## 2026-07-18 — [claude] run-lean: 「直立のまま走る」を体幹前傾＋頭部追従で解消（ローカル反映・デプロイ待ち）
- ユーザー評価（公開版 2026071702 への実操作フィードバック）: 「キャラのポーズが直立状態で、そのまま走る動作をするから不自然」。
- R1/R2: 描画側は正常（実機で `source=player3d` / run 20コマの距離同期を確認）。原因は素材のポーズ設計で、(a) 体幹前傾が spine 11.5°のみ (b) `DEF_head z=-torso_lean` の完全逆補正で背の高いヘルメットシルエットが常に垂直 (c) 腕振り振幅が小さい、の3点により実寸で「その場足踏み」に読めた。
- R4: 変更前の `render_motion_previews.py`・8素材・砲口anchorsを `blender/hero/archive/20260718-pre-forward-lean/` に固定（変更前HEAD=458c808）。
- R5（`blender/hero/render_motion_previews.py` の run 上半身のみ変更・下半身周期/骨長/カメラ/砲口計算/当たり判定は不変）:
  - 体幹前傾 `11.5+1.0sin` → `13.5+1.0sin`（度）。腹部↔骨盤シェルの新規衝突ゼロで通る物理上限がピーク約14.5°であることを二分探索で確認して採用。
  - 頭部の逆補正を `-torso_lean` → `-0.45*torso_lean` に変更＝ヘルメットが前傾に約55%追従。直立読みの主因を解消。
  - 腕振り振幅を拡大: buster側 `5+28cos→6+36cos`、自由腕 `-8-42cos→-10-50cos`、前腕も同調。
  - `audit_motion_cycles.py` の `run_torso_drive` 許容帯を [8,13] → [8,15] に更新（旧上限が直立読みの一因。物理衝突ゼロ上限14.5°の直上に設定。run_shoot/run_charge の照準系 AIM_LIMITS は不変）。
  - `index.html` は `ASSET_VER='2026071801'` のみ変更。
- 検証:
  - `audit_motion_cycles.py` = 124 frames / new-or-worsened collisions 0 / invariant failures 0。
  - `validate_game_sprites.py` = 8 motions / 124 frames OK、`validate_motion_readability.py` = failures 0。
  - `node tools/player3dcheck.js` = 43/43、`node tools/posecheck.js` = 48/48、`node harness.js` = 30/30。
  - ローカル実機（127.0.0.1:8766・production Canvas実寸crop）で接地1/11・空中8/16コマとも前傾走行として読めることを目視確認。console error 0。
- 公開: **未デプロイ**（ユーザー承認後に push → `?v=2026071801` で確認）。ロールバックは archive か `git checkout 458c808 -- assets index.html`。
- 次: ユーザーが実操作で走りの自然さを評価。不足なら (a) さらに前傾を出す場合は骨盤ごと傾ける方式の検討（下半身共有制約と AIM_LIMITS の再設計が必要） (b) 接地フレームの膝高調整。

## 2026-07-17 — [codex] large-run/visibility: 大振り走行と明色スプライトをローカル反映
- 実施:
  - 20コマ走行を角度の一律拡大ではなく、着地→荷重→骨盤通過→蹴り出し→両足離地→膝先行の回収として再作成。左右半周期とも連続した空中局面を持ち、通常走りの両腕は肩から大きく逆位相で振る。
  - `runshoot` / `runcharge` はバスターの照準を維持しつつ、`run` と同じ骨盤・脚・足首周期を共有。承認済み造形、骨長、カメラ、足元、砲口、ゲーム物理、当たり判定は不変。
  - ゲーム書き出しだけ青装甲・濃紺・関節・銀・シアンを明るくし、補助光と露出を調整。同じ主人公blendから8状態124コマを再レンダーし、`assets/player3d_*.png` と砲口アンカーを更新。`ASSET_VER=2026071702`。
  - 変更前162ファイル・16MBを `blender/hero/archive/20260717-pre-large-run-brightness/` に固定。`?hero=legacy` の旧描画復帰は維持。
- 検証:
  - `blender/hero/audit_motion_cycles.py` = 124 frames / invariant failures 0 / new-or-worsened collisions 0。
  - `python3 blender/hero/validate_motion_readability.py` = failures 0。腿可動域70度以上、両足離地、関節移動、実寸シルエット差を確認。
  - 線形輝度中央値は `run 0.0278→0.1101`、`runshoot 0.0235→0.1045`、`runcharge 0.0234→0.1037`。通常走り暗部率は `67.3%→19.7%`。
  - `python3 blender/hero/validate_game_sprites.py` = 8 motions / 124 frames、`node tools/player3dcheck.js` = 43/43、`node tools/posecheck.js` = 48/48、`node harness.js` = 30/30。
  - Chromeのproduction Canvasで `run/runshoot/runcharge/jump` を状態assert付きで取得し、全状態 `source=player3d`、素材404 0、console error 0。証跡は `blender/hero/diagnostics/large_run_game/`。
- ローカル試遊:
  - `http://127.0.0.1:8766/index.html`。既存の8765は別プロトタイプと競合するため使わない。
  - 走りの自然さは完成承認にせず、ユーザーの実操作評価待ち。
- 公開（2026-07-18）:
  - 旧公開 `main=b4f028f` を復旧タグ `pre-3d-run-deploy-20260718` としてGitHubへ保存し、公開コミット `9f633e1` へfast-forward。
  - GitHub Pagesのindexは88468 bytes・SHA-256 `34db82cbb8e21557803e44f0ab1a1c2f651101fa05d8d1e0a1422af0f0562dac` でローカルと完全一致。8本の3D素材も8/8完全一致。
  - `https://nekoojisan-labo.github.io/cobalt-bolt/?v=2026071702` をChromeで開き、タイトル表示、ゲーム開始、1920×1080 Canvas、console error/warning 0を確認。

---

## 2026-07-17 — [codex] current 3D motion: ローカルゲームへテスト反映
- 実施:
  - 現行20コマ走行は視覚的不採用のまま、ユーザー操作で実寸を判断するためだけにゲームへ一時反映。完成・採用扱いにはしていない。
  - 同じ主人公blendから `idle/shoot/charge/run/runshoot/runcharge/jump/jumpshoot` を256×256 RGBA、計124コマで固定カメラ再レンダー。床線、背景、焼き込み発光、ジャンプ軌道は含めない。
  - `assets/player3d_*.png` と `assets/player3d_anchors.json` を新規追加し、既存 `player_*.png` は上書きしていない。
  - `drawPlayer()` の入口で3Dの該当状態だけを厳密選択し、素材欠損時は旧全身関節リグへ戻す。URLへ `?hero=legacy` を付けると常時旧描画へ戻る。
  - 走り／走り撃ち／走りチャージは同じ20コマを64ワールドpxへ距離同期。レビュー動画だけの周期固定反動は制作スプライトから除外し、発砲時計と走行時計を分離。
  - Blenderカメラから各コマの砲口を投影し、描画・弾origin・マズルFX・外付けチャージ球が同じ状態／コマ／座標を参照。
- 検証:
  - `python3 blender/hero/validate_game_sprites.py` = 8 motions / 124 frames。RGBA、寸法、透明四隅、2px安全余白、元コマとstripの完全一致を確認。
  - `node tools/player3dcheck.js` = 43 passed。9状態、20コマ=64px、走り3種の脚位相、ジャンプ10段階、実PNG経路、左右砲口、欠損fallback、実弾originを確認。
  - `node harness.js` = 30/30、`node tools/posecheck.js` = 48/48、`node tools/preview.js` rendered。
  - ローカル実ブラウザで8本の `player3d_*.png` がHTTP 200、立ち撃ちと弾の砲口一致、console error/warning 0を確認。
- 退避/公開:
  - 変更前ゲームを `blender/hero/archive/20260717-pre-game-integration/` に保持。不採用モーションv1/v2のarchiveも不変。
  - GitHub Pagesへのpush/deployは未実施。
- 次:
  - ユーザーがローカルゲームで通常走り、走り撃ち、走り長押しチャージ、ジャンプ撃ちを操作評価する。走行の視覚的不採用を解消する作業は、そのフィードバックを受けて別途継続する。

---

## 2026-07-15 — [codex] char: 通常立ちの前傾・沈み込みを解消
- 実施:
  - 通常立ちの骨盤を上げ、左右の膝曲げを約55度から約27度／25度へ軽減。足裏の接地点は維持。
  - 通常立ちの体幹傾斜を約1.4度から0度へ戻し、呼吸時の揺れも±0.2度未満へ縮小。
  - 通常立ちの両腕を胸前で折り返す配置から、肩の下で肘を軽く緩める配置へ変更。立ち撃ち・走り撃ち・ジャンプ撃ち・チャージの構え値は変更なし。
  - `docs/REQUIREMENTS.md` に通常立ちのR1〜R6、禁止状態、数値基準を追記。`tools/posecheck.js` に膝角度・体幹・足裏・通常腕の検査を追加。
- 検証:
  - `node tools/posecheck.js` = 48 passed。
  - `node harness.js` = 30/30。
  - `node tools/preview.js` / `node tools/spritecheck.js` / `node tools/shot.js` rendered。
  - Chrome実画面で通常立ちを確認。ゲーム本体の例外0、必須素材の取得エラー0（faviconのみ対象外404）。
  - `git diff --check` 通過。
- 退避/公開:
  - 改修前コミット `f8f4c64` を退避点として保持。
  - 公開サイトへのpush/deployは未実施。
- 次:
  - ユーザー実機で通常立ちから走り・射撃へ切り替え、好みとして膝をさらに伸ばす必要があるか確認する。

---

## 2026-07-15 — [codex] char: 状態別の射撃構え＋通常立ち腕を自然化
- 実施:
  - `stand-fire` / `run-fire` / `jump-fire` と、各状態の `charge` を別の肩・肘・体幹角度として定義。走り/ジャンプの下半身を保ったまま上半身だけ照準姿勢へ切り替える。
  - 構えた腕は、肩から上腕を斜め下へ出して肘を一段下げ、そこからバスターを水平に接続。顔・首から腕が出て見える高さを回避。
  - 通常立ちの両腕も上腕と前腕を同じ角度で垂らさず、肘の折れが読める姿勢へ変更。
  - チャージ中は走行位相に関係なく照準角を保持し、直前の発射保持が残っていても反動を適用しない。発射後だけ反動を出す。
  - `docs/REQUIREMENTS.md` に改修ゲート、承認内容、禁止状態、不変条件、受け入れ基準を記録。
  - `tools/preview.js` に通常立ち・立ち撃ち・走り撃ち・ジャンプ撃ち・走りチャージの同倍率比較を追加。旧走りチャージ画像が着地状態を引き継いでいた点も修正。
- 検証:
  - `node tools/posecheck.js` = 43 passed。状態別構え、通常立ち両肘、肩→砲口の落差、チャージ保持、実キー操作3種、砲口一致を確認。
  - `node harness.js` = 30/30。移動・ジャンプ・戦闘・ボス・クリアまで既存挙動を維持。
  - `node tools/spritecheck.js` / `node tools/shot.js` / `node tools/preview.js` rendered。
  - Chrome通常ゲームループを2.7倍表示して5状態を確認。全状態 `errors=0`、素材取得200（faviconのみ対象外404）。
  - `git diff --check` 通過。
- 退避/公開:
  - 改修前コミット `7c878633e291caefe1d9e68e4d7e88fd8bac6d95` を退避点として保持。
  - 作業ブランチ `codex/humanoid-motion-rig`。公開サイトへのpush/deployは未実施。
- 次:
  - ユーザー実機で、通常立ち→立ち撃ち、走り撃ち、ジャンプ撃ち、走りながら長押しチャージを順に確認する。

---

## 2026-07-15 — [codex] char: 全身関節リグで走行・攻撃・ジャンプを統一
- 実施:
  - 完成済み全身スプライトを状態ごとに貼り替える方式をフォールバックへ下げ、通常描画を骨盤→体幹→肩/股関節→肘/膝→手/足へつながる全身関節リグへ統一。
  - 走行は移動距離に位相を同期し、接地足の滑りを抑制。脚と腕を逆位相にし、重心上下動と体幹前傾を追加。
  - ジャンプを踏切・上昇・頂点・下降・着地の5段階に分け、脚の畳み/伸ばしと着地圧縮を追加。
  - バスターを肩→肘→前腕の子として追従させ、描画に使う砲口座標を弾・発光にも共用。走り/ジャンプ中も下半身動作を維持したまま上半身へ射撃姿勢を重ねる。
  - `tools/posecheck.js` を追加し、骨長維持・肩/股関節分離・接地足の滑り・ジャンプ5段階・左右砲口・弾生成位置を自動検査。
  - `ART_CHARACTER.md` / `ART_PARTS.md` を現在の関節リグ設計に更新。
- 検証:
  - `node tools/posecheck.js` = 29 passed。
  - `node harness.js` = 30/30。
  - `node tools/spritecheck.js` / `node tools/shot.js` / `node tools/preview.js` rendered。
  - Chrome実機で走り撃ち・ジャンプ撃ちを表示し、ページ内エラー0、素材取得200を確認（faviconのみ対象外404）。
  - `git diff --check` 通過。PNG/MP3参照に欠落なし。
- 退避/公開:
  - 改修前コミット `b4f028f51c72ea07c25986eb044109dc530f5d48` を退避点として保持。
  - 作業ブランチ `codex/humanoid-motion-rig`。公開サイトへのpush/deployは未実施。
- 次:
  - 実機の操作感をユーザー確認。さらに足首だけを独立させる場合は、現行の「すね＋足」一体素材を分割して同じ関節鎖へ追加する。

---

## 2026-06-01 - [codex] char: player_run上半身ロック + runshoot派生
- 実施:
  - `assets/player_run.png` を作り直し。8コマ横ストリップ/1コマ256x256/全体2048x256は維持。
  - frame0由来の上半身レイヤー(頭/ヘルメット/クレスト/胴/胸コア/マント/両腕)を全8コマへ同一画素で固定し、脚だけ既存ランサイクルから動く構成に再合成。接地ラインは全コマ `y=233`。
  - `assets/player_runshoot.png` は新しい `player_run.png` を土台に派生。差し替えは前sideバスター腕領域のみで、脚/接地/腕領域外はrunと完全一致。
  - `index.html` の `ASSET_VER` を `2026060102` へ更新。`idle/jump/charge/shoot` は変更なし。
- 検証:
  - `player_run.png`: `2048x256`, 8 frames, RGBA alpha `[0,255]`, 四隅透明, bottoms `[233 x8]`, upper-body locked diff `0`。
  - `player_runshoot.png`: `2048x256`, 8 frames, RGBA alpha `[0,255]`, 四隅透明, bottoms `[233 x8]`, locked diff `0`, runとの差分はarm領域のみ(`outsideArmDiff=0`)、足元帯 `y>=190` はrunと完全一致(`footDiff=0`)。
  - `node harness.js` = 30/30。
  - `node tools/spritecheck.js` rendered, `player sprite ready = true`。
  - `node tools/shot.js` rendered。
  - `node tools/preview.js` rendered。`tools/preview_run_zoom.png` / `tools/preview_runshoot_zoom.png` を目視確認。
- コミット:
  - `0df2955` `[codex] char: player_run upper body lock`
  - `3ff684e` `[codex] char: derive player_runshoot from locked run`
- 次:
  - Claude側でブラウザ実機のループ確認。必要なら脚シルエットの微調整のみ。上半身ロックとrun/runshoot同期は崩さないこと。
---

## 2026-05-31 - [codex] skel: player_idle準拠で骨格パーツを再作成
- 実施:
  - `assets/skel_torso.png` 160x240: `player_idle.png` の上後方クレスト、シアンバイザー、胸コア、装甲肩、青いマント/スカーフを維持した胴体へ差し替え。
  - `assets/skel_thigh.png` 96x112 / `assets/skel_shin.png` 96x150 / `assets/skel_uarm.png` 80x104 / `assets/skel_farm.png` 84x130 / `assets/skel_buster.png` 120x150 を同一人物のコバルト青+シアン発光+白trimで再作成。
  - built-in `image_gen` で `player_idle.png` を厳格参照したマゼンタ背景のパーツシートを生成し、ローカルでchroma-key除去、各パーツを同寸法へ切り出し/リサイズ。リサイズ後に微小なkey残りをalpha cleanup。
  - 素材差し替えに合わせて `index.html` の `ASSET_VER` を `2026053103` へ更新。
- 検証:
  - 6ファイルすべて指定寸法 / RGBA alpha `(0,255)` / 透明四隅OK / magenta+green key残り `0`。
  - `node harness.js` = 30/30。
  - `node tools/spritecheck.js` rendered, `player sprite ready = true`。
  - `node tools/shot.js` rendered。
  - `node tools/preview.js` rendered。`tools/new_skel_contact.png` と `tools/new_skel_runtime_contact.png` で、crest/cape/armor肩/シアン発光が載ったことを目視確認。
- 次: Claude側でブラウザ実機表示のrun/runshootを再確認。必要なら当たり判定は触らず、`skel_*.png` 内の余白/切り出しだけを微調整。
---

## 2026-05-31 - [codex] skel: 主人公の骨格アニメ用「塗りパーツ」6枚を生成
- 生成/配置:
  - `assets/skel_torso.png` 160x240: 頭+ヘルメット+クレスト+胴+胸コア+腰。上端中央は首/肩側の接続基準線、下端中央は腰(脚付け根)。
  - `assets/skel_thigh.png` 96x112: 上端中央=股関節、下端=膝。
  - `assets/skel_shin.png` 96x150: 上端中央=膝、下にすね+足、つま先=右。
  - `assets/skel_uarm.png` 80x104: 上端中央=肩、下端=肘。
  - `assets/skel_farm.png` 84x130: 上端中央=肘、下に通常手/非バスター。
  - `assets/skel_buster.png` 120x150: 上端中央=肘、下端=シアン発光の砲口。
- 規約: 各四肢/武器パーツは「縦向き・近位関節をキャンバス上端中央」に配置。隣接する膝/肘幅は同系統の太さ・色で揃え、トルソーは仕様どおり下端中央=腰(脚付け根)も維持。
- 生成/処理: built-in `image_gen` で既存 `assets/player_idle.png` を基準にマゼンタ背景生成し、ローカルでchroma-key除去、RGBA透過PNGへ変換。四隅透明。
- 検証:
  - 6ファイルすべて指定寸法ぴったり / RGBA alpha `(0,255)` / 透明四隅OK / マゼンタkey残り `0`。
  - `node harness.js` = 30/30。
  - `node tools/spritecheck.js` rendered, `player sprite ready = true`。
  - `node tools/shot.js` rendered。
  - `node tools/preview.js` rendered。`tools/skel_contact.png` で6パーツを目視確認。
- 補助修正: 現行の骨格描画が `ctx.rotate()` を使うため、`tools/shot.js` / `tools/spritecheck.js` のCanvas2Dエミュレータを回転対応に更新。
- 次: Claude側で `drawPlayerSkel()` をコード描画から `skel_*.png` の関節回転描画へ差し替える。実装時は `ASSET_VER` 更新を忘れないこと。

各エントリ: `## YYYY-MM-DD — [claude|codex] 見出し` ／ 実施・検証・**相手への次タスク**。

---

## 2026-05-31 — [claude] アセットのキャッシュ無効化(同名差し替えで古いPNGが残る問題)
- 症状: デプロイは最新(サーバのindex.html/player_run.pngはローカルと一致を確認済)なのに、ユーザーのブラウザが**同名PNGを古いままキャッシュ**し変更が見えない(ずっと同じ古いスクショ)。
- 対策: 画像読込URLに `?v=ASSET_VER` を付与する `_av()` を追加し `loadAssets`/`loadRig`/`getImg` の `im.src` に適用。**素材を差し替えたら `ASSET_VER` を更新**すれば必ず新素材を取得。
- preview対応: `tools/preview.js` の Image が src のクエリ(`?...`)を除去してから読むよう修正(検証を壊さない)。harness=30/30・preview OK。
- **重要運用**: 今後 `assets/*.png` を差し替えたら index.html の `ASSET_VER` を必ず更新すること。

## 2026-05-31 — [codex] char: 主人公run自然化とrunshoot再派生
- 実施:
  - `assets/player_run.png` を8コマ/2048×256のまま作り直し。既存の高精細ボディを基準に、姿勢を起こしたアスリート寄りの走りへ変更。右脚前→通過→左脚前→通過の2歩サイクルで接地を交互化し、両腕も脚と逆位相で前後スイングするようにした。マズル/射撃FXは無し。
  - `assets/player_runshoot.png` を新しいrunと同じサイクルから再派生。脚・胴・接地変換はrunと同一で、前sideのバスター腕だけ水平射撃姿勢＋シアン砲口発光へ固定。もう一方の腕と脚の交互運動はrun継承。
- 検証:
  - 両PNGとも `2048×256` / 8コマ / RGBA alpha `(0,255)` / 透明四隅OK。`player_run.png` は全コマ下端 `y=235` で接地統一。
  - `player_runshoot.png` は `player_run.png` に対して足元帯 `y>=210` の差分0、下半身帯 `y>=190` の差分0。脚・接地は1pxもズレなし。
  - 目視: `tools/preview_new_player_run_grid.png` / `tools/preview_new_player_runshoot_grid.png` で脚の左右交互接地と腕の逆位相スイングを確認。
  - コマンド: 各コミット前に `node harness.js` = 30/30、`node tools/spritecheck.js` rendered、`node tools/shot.js` rendered。
- コミット: `35ae57d` `[codex] char: player_run.png 自然なランサイクルに` / `12604ff` `[codex] char: player_runshoot.png 再派生`
- 次: Claude側でブラウザ実機表示のラン/走り撃ちループを確認。必要なら見た目だけ微調整（当たり判定・idle/jump/chargeは変更なし）。

## 2026-05-31 — [codex] char: 主人公武器バリアントを既存ベース派生で再作成
- 実施:
  - `assets/player_runshoot.png` を `player_run.png`(8コマ/2048×256)土台で再作成。前sideの既存バスター腕領域だけを消し、水平バスター腕＋シアン砲口発光を上書き合成。脚・胴・接地はrun由来。
  - `assets/player_charge.png` を `player_idle.png`(5コマ/1280×256)土台で再作成。姿勢・脚・胴はidleのまま、水平バスター＋シアン蓄光オーブを5段階で脈動。`ASSETS.player.anims.charge.frames` は5に更新。
  - 任意分として `assets/player_jumpshoot.png` を `player_jump.png`(2コマ/512×256)土台で作成し、ジャンプ中の射撃時に使う `jumpshoot` フックを追加。
- 検証:
  - 各PNGで寸法/コマ数/RGBA alpha/透明四隅/完全な緑・マゼンタキー残り0を確認。
  - 差分検証: 各ファイルとも `visible_diff_outside_edit_mask=0`。`player_runshoot.png` は `player_run.png` に対して足元接地帯 `foot_contact_diff=0`、走り↔走り撃ちで脚・接地は1pxもズレなし。
  - コマンド: 各コミット前と最終で `node harness.js` = 30/30、`node tools/spritecheck.js` rendered、`node tools/shot.js` rendered。最終で `node tools/preview.js` rendered、`preview_runshoot_zoom.png` / `preview_charge_zoom.png` を目視。
- コミット: `ccb58b9` `[codex] char: player_runshoot.png...` / `be321fd` `[codex] char: player_charge.png...` / `32060a8` `[codex] char: player_jumpshoot.png...`
- 次: Claude側でブラウザ/preview目視確認。必要なら見た目だけ腕の肩位置・砲口FXを微調整（当たり判定変更なし）。

## 2026-05-31 — [claude] 設計組み直し: 主人公は塗り一系統に統一（リグ混在を撤廃）→ Codexへ派生生成依頼
- 不整合の根因＝リグと塗りの混在で状態切替時に脚/姿勢が食い違う(走り→走り撃ちが歩きに/待機→チャージで姿勢変化)。
- **対策**: `drawPlayer`からプレイヤーのリグ呼び出しを撤去し**全状態 `drawSheet`(塗りフルフレーム)に統一**。ボスのみリグ継続。
- 設計ルール(`ART_CHARACTER.md`新規): マスター1体→運動ベース(idle/run/jump)→**武器バリアント(shoot/runshoot/charge)はベースの各コマに腕だけ差し替えて合成**(脚・胴・コマ位置はベースと完全一致)。
- **▶ Codexへの次タスク**: `ART_CHARACTER.md`に従い**既存ベースから派生**してassets生成:
  - `player_runshoot.png` = `player_run.png`(8コマ)の脚・胴をそのまま、前バスター腕だけ前方水平に。脚は run と1コマもズレない。
  - `player_charge.png`(作り直し) = `player_idle.png`の姿勢のまま前バスターに蓄光オーブ脈動。
  - (任意)`player_jumpshoot.png` = `player_jump.png`+前方バスター。
  - 同一寸法/コマ数/透過/スケール。1個ずつ`[codex]`コミット。Claudeがpreview目視で走り↔走り撃ちの脚一致を確認して反映。

## 2026-05-31 — [claude] 修正3点: ボス弾の砲口一致／リグは走り撃ち限定／立ち・チャージは塗り
- **ボス弾**: 中央(boss.x+w/2)→**専用キャノン砲口(前方dir*28, y+13)**から発射＋マズルFX。構え腕と射出位置を一致(preview_boss_fireで弾が砲口先端から出るのを確認)。
- **立ち/チャージの腕が不自然・走りが歩きに見える**問題: リグを**走り撃ち(legState=='run'&&armState=='fire')だけに限定**。待機/走り/ジャンプ/立ち撃ち/チャージは**バランスの良い塗り一枚絵(player_*)**へ。走り撃ちのみリグで腕を前方保持(fireHold)。
- 結果: 立ち=自然な構えの塗り、走り=塗りの前傾(ダッシュらしい)、走り撃ち=腕伸ばしっぱなし、ボス弾=砲口から。harness=30/30。
- 備考: MOVE=3.2/anim0.34は維持(コードはダッシュ)。「歩きに戻った」報告はブラウザキャッシュの可能性→ハードリロード案内。

## 2026-05-31 — [claude] リグ全状態に再有効化(arm_down自然化)＋fireHoldで走り撃ち改善
- Codexが `rig_player_arm_down.png` を『肘で曲げた自然な構え(足元まで垂れない)』に作り直し→`drawPlayer`のリグを**全状態に再有効化**(armState=='fire'限定を撤廃)。
- `fireHold`(発射後18f保持)で連射/走り撃ち中に腕が引っ込まない。結果: 走り=リグの動的な脚(ストライド)、走り撃ち=脚run+腕fire保持、待機=自然な構え。足元垂れ解消・腕2本脚2本(実寸OK)。
- 既知: 立ち姿は拡大すると脚がやや短め(しゃがみ気味)。実寸では許容。気になれば legs/body をコヒーレントに作り直して比率調整可。harness=30/30。

## 2026-05-31 — [claude] 修正: 立ち/走りの描画崩れ→リグは射撃中のみ・他は塗り一枚絵
- 症状: idle/run でリグ合成すると `arm_down`(砲口を真下に向けた長い腕)が足元まで垂れ、全身が不格好(腕足のバランス崩れ)。
- 対応: **`drawPlayer`でリグは `armState==='fire'`(射撃中=腕を前方へ伸ばす)時のみ使用**。待機/走り/ジャンプ/チャージは**バランスの良い従来の塗りフルフレーム**(player_idle/run/jump/charge)に。
- 結果: 立ち/走りは腕2本脚2本の整った一枚絵、射撃中(立ち/走り)は腕を伸ばすリグ＝走り撃ちの腕伸ばしっぱなしは維持。preview全状態OK。harness=30/30。
- 補足: `arm_down`/`arm_charge`パーツは現状未使用(将来コヒーレントに作り直せば全状態リグ化も可能)。preview.jsに立ち高倍率クロップ`idle_tight`追加。

## 2026-05-31 — [claude] 調整: チャージ持続音を小さく＋移動をダッシュ化
- チャージ中の持続音 `chargeSnd()` を大幅減音(基準gain 0.07→0.024, うねり0.045→0.014)＝鳴り続けてうるさい問題に対応。
- 移動を歩き→ダッシュ: `MOVE 2.3→3.2`、脚アニメ加算 `0.22→0.34`。harness=30/30(自走踏破・到達性とも維持、足場間隔は元々≤80でMOVE増でも到達性は保守的に成立)。

## 2026-05-31 — [claude] リグ全パーツ統合・検証完了＝パーツ分割リグ稼働
- Codex生成の全9パーツ(主人公 legs/body/arm_down/fire/charge＋ボス body/arm_idle/charge/fire)が揃い、**全パーツ揃いゲートが解けてリグが自動発動**。
- preview目視で全状態OK: idle/run(down腕)・**走り撃ち=脚run+腕fire(伸ばしっぱなし)**・立ち撃ち/チャージ(蓄光弾)・ボス idle/溜め/発射(本体+専用キャノンが独立合成)。肩・腰・接地の継ぎ目ズレ無し→`ox/oy`調整不要。
- `tools/preview.js` にボス検証シーン(idle_zoom/charge_zoom/fire_zoom, 入場12step後に状態上書き)を追加。`harness`=30/30。
- これで「腕だけ動かす／走り撃ちで腕を伸ばしっぱなし／一枚絵の描き直しはしない」要望を満たした。push済。
- **次タスク候補(任意)**: より滑らかにするなら腕に微小な反動(発射時1-2pxノックバック)や脚runコマ追加。必要時に。

## 2026-05-31 — [codex] rig: remaining player/boss parts
- 置いた素材一覧:
  - `assets/rig_player_arm_down.png` — 256×256。前sideバスター腕のみ。既存 `rig_player_arm_fire.png` の肩リングを局所合成して肩位置を固定、腕だけ下げ姿勢。
  - `assets/rig_player_arm_charge.png` — 2コマ横ストリップ、512×256。既存 `rig_player_arm_fire.png` を各コマ土台にし、砲口のシアン蓄光オーブのみ2段階で追加。肩/砲身位置は `arm_fire` と一致。
  - `assets/rig_boss_body.png` — 2コマ横ストリップ、1024×512。本体(頭/胴/脚/胸黄コア/非キャノン側腕)のみ。専用キャノン側はソケットだけ残してキャノン本体なし。
  - `assets/rig_boss_arm_idle.png` — 512×512。専用アームキャノンのみ。ボス本体ソケットに合う位置で共通キャンバス配置。
  - `assets/rig_boss_arm_charge.png` — 2コマ横ストリップ、1024×512。`rig_boss_arm_idle.png` を土台に、砲口の黄/橙チャージ発光のみ2段階で追加。
  - `assets/rig_boss_arm_fire.png` — 2コマ横ストリップ、1024×512。`rig_boss_arm_idle.png` を土台に、発射マズルフラッシュのみ2段階で追加。
- 生成/処理: built-in `image_gen` でマゼンタのチャイマキー源を生成し、ローカルでRGBA透過化・リサイズ・共通キャンバス再配置。主人公 charge とボス charge/fire は既存基準腕を土台にエフェクトだけ合成し、肩関節のズレを防止。
- 個別コミット: `[codex] rig: rig_player_arm_down.png` / `rig_player_arm_charge.png` / `rig_boss_body.png` / `rig_boss_arm_idle.png` / `rig_boss_arm_charge.png` / `rig_boss_arm_fire.png`。
- 検証: 各素材でサイズ/alpha/透明四隅/チャイマキー残り0を確認。各コミット前に `node harness.js` = 30/30、`node tools/spritecheck.js` rendered、`node tools/shot.js` rendered。全パーツ後に `node tools/preview.js` rendered、プレイヤー idle/shoot/charge とボス idle/charge/fire を目視確認。
- 次: Claude側で `tools/preview_*.png` を目視し、必要なら `RIG.player.parts.*.ox/oy` または `RIG.boss.parts.*.ox/oy` を微調整。ボス本体/腕は見た目優先で新規リグ画風へ寄せたため、旧 `boss_idle.png` と完全同一形状ではない。

## 2026-05-31 — [codex] rig: player core 3 parts (legs/body/arm_fire)
- 置いた素材一覧:
  - `assets/rig_player_legs.png` — 6コマ横ストリップ、1536×256、1コマ256×256。脚＋腰のみ。idle/run4/jumpを共通キャンバスに配置。
  - `assets/rig_player_body.png` — 256×256。胴＋頭＋ヘルメット＋奥側の腕のみ。脚と前sideバスター腕は透過。
  - `assets/rig_player_arm_fire.png` — 256×256。前sideバスター腕のみ。水平射撃姿勢、砲口は前端。
- 生成/処理: built-in `image_gen`でマゼンタのチャイマキー源を生成し、ローカルでRGBA透過化。共通キャンバスで腰・接地・射撃腕の位置を合わせて再パック。
- 検証: サイズ/alpha/透明四隅/チャイマキー残り0を確認。`node harness.js` = 30/30、`node tools/spritecheck.js` rendered、`node tools/shot.js` rendered、`node tools/preview.js` rendered。
- 次: 残りの主人公 `arm_down` / `arm_charge`、およびボス一式は未生成。Claude側でpreview目視後、必要なら`RIG.player.parts.*.ox/oy`微調整。

## 2026-05-31 — [claude] パーツ分割リグ導入（腕だけ伸ばしっぱなし／走り撃ち改善）→ Codexへ素材依頼
- 主人公/ボスを**パーツ分割リグ**化。`RIG`フック＋`drawPlayerRig`/`drawBossRig`＋`drawRigPart`を追加。脚→胴+頭→腕+武器を**同一矩形に重ねて合成**、各パーツ独立アニメ。
- **腕は肩ロックの独立レイヤー**＝**走り撃ち=脚run+腕fire(伸ばしっぱなし)／立ち撃ち=腕のみ動く**。腕state: down/charge/fire。ボスも本体静止＋専用キャノン(idle/charge/fire)。
- 描画優先順: **①リグ(塗りパーツ)→②従来の塗りフルフレーム→③コード描画リグ**（無回帰。リグ素材が来れば自動で①優先）。コードリグにも腕fire(前方伸長)/ボスのキャノン伸長を実装済。
- preload/preloadProgressにリグ素材を追加。`drawRigPart`は`ox/oy`でパーツ微調整可。harness=30/30維持。
- **▶ Codexへの次タスク**: `ART_PARTS.md` に従い**リグ用パーツPNGを生成**して`assets/`へ。共通キャンバス方式厳守（脚/胴/腕の位置・肩関節を全state同一）。1個ずつ`[codex]`コミット。置いたらHANDOFF先頭に一覧追記。Claudeがpreview目視→ox/oy微調整して反映する。
  - 主人公(256×256): `rig_player_legs.png`(6コマ) `rig_player_body.png` `rig_player_arm_down/fire/charge.png`
  - ボス(512×512): `rig_boss_body.png`(2) `rig_boss_arm_idle/charge/fire.png`

## 2026-05-31 — [claude] 効果音を全面整備(着地/チャージ中/通常・チャージ射撃を別音に)
- sfxをロックマン風にクリーン化。`shoot`(通常"ピュッ")/`chargeshot`(チャージ"ピョーン")を**別音**に。`hit`着弾/`boom`撃破/`hurt`被弾/`die`撃破死を調整。
- **新規`land`着地音**(落下速度>2.2のみ＝歩行段差では鳴らさない)。**新規`chargeSnd()`チャージ中の持続うなり**(専用osc+LFO、押し続けで300→920Hz上昇、離す/死亡で停止、タップ(charge<8)では鳴らさない)。
- harness=30/30維持(HEADLESSで音は無効化)。

## 2026-05-31 — [claude] 敵を配置ポイント方式に（画面外で消滅→戻ると復活・ロックマン風）
- 敵を即時生成→**配置ポイント(spawns)方式**に変更。`manageSpawns()`が画面に入った配置点で敵を出現、十分離れる(W*0.6)と消滅、**戻るとその配置点でプレイヤーへ向き合って復活**(e.dir=sign(player.x-sp.x))。
- 撃破した敵は画面内では復活せず、離れて戻ると復活（ロックマン挙動）。flyerの自己ループは撤去し生成管理に一本化。
- harness: T19「画面外で消滅→戻ると配置点で復活＋向き合う」追加、T8をmet開放対応に修正。`spawns`を__GAMEに公開。`harness`=**30/30**。preview確認OK。

## 2026-05-31 — [claude] BGM3曲＋SFX7種(CC0)を反映＝音声完備
- BGM: オープ=Asteroid Belt / 通常=Interceptor Fleet / ボス=Master Core Awakening。初回キーでアンロック、状態で自動切替・ループ。
- SFX: CodexがOpenGameArt(CC0)からDLした7種(shoot/charge/hit/boom/hurt/jump/heal)を `SFX_SRC` に紐付け。jump/healのコールも専用音に変更。ビープ→本物のSEに。
- 音声ファイル無時はWebAudioシンセにフォールバック。`harness`=28/28。
- **ライセンス**: BGMはユーザー提供曲。SFXはOpenGameArt CC0(クレジット不要)。

## 2026-05-31 - [codex] add sfx_heal.mp3
- File: `assets/sfx_heal.mp3`
- Source: OpenGameArt "Sound effects Mini Pack1.5" archive, internal file `1up/MP3/1up.mp3`; https://opengameart.org/content/sound-effects-mini-pack15
- License: CC0.
- Verification: MP3 frame scan passed (`bytes=17796`, `duration=0.683s`), not HTML/empty. `node harness.js` 28/28; `node tools/shot.js` rendered.

## 2026-05-31 - [codex] add sfx_jump.mp3
- File: `assets/sfx_jump.mp3`
- Source: OpenGameArt "Sound effects Mini Pack1.5" archive, internal file `Jump/MP3/Jump.mp3`; https://opengameart.org/content/sound-effects-mini-pack15
- License: CC0.
- Verification: MP3 frame scan passed (`bytes=8393`, `duration=0.313s`), not HTML/empty. `node harness.js` 28/28; `node tools/shot.js` rendered.

## 2026-05-31 - [codex] add sfx_hurt.mp3
- File: `assets/sfx_hurt.mp3`
- Source: OpenGameArt "Player Hit (damage)" direct file `playerhit.mp3`; https://opengameart.org/content/player-hit-damage
- License: CC0.
- Verification: MP3 frame scan passed (`bytes=6332`, `duration=0.257s`), not HTML/empty. `node harness.js` 28/28; `node tools/shot.js` rendered.

## 2026-05-31 - [codex] add sfx_boom.mp3
- File: `assets/sfx_boom.mp3`
- Source: OpenGameArt "Sound effects Mini Pack1.5" archive, internal file `Explosions/MP3/Explosion.mp3`; https://opengameart.org/content/sound-effects-mini-pack15
- License: CC0.
- Verification: MP3 frame scan passed (`bytes=20937`, `duration=0.836s`), not HTML/empty. `node harness.js` 28/28; `node tools/shot.js` rendered.

## 2026-05-31 - [codex] add sfx_hit.mp3
- File: `assets/sfx_hit.mp3`
- Source: OpenGameArt "Sound effects Mini Pack1.5" archive, internal file `Hit/MP3/Hit.mp3`; https://opengameart.org/content/sound-effects-mini-pack15
- License: CC0.
- Verification: MP3 frame scan passed (`bytes=5884`, `duration=0.209s`), not HTML/empty. `node harness.js` 28/28; `node tools/shot.js` rendered.

## 2026-05-31 - [codex] add sfx_charge.mp3
- File: `assets/sfx_charge.mp3`
- Source: OpenGameArt "Sound effects Mini Pack1.5" archive, internal file `Power-up/MP3/Powerup2.mp3`; https://opengameart.org/content/sound-effects-mini-pack15
- License: CC0.
- Verification: MP3 frame scan passed (`bytes=20936`, `duration=0.836s`), not HTML/empty. `node harness.js` 28/28; `node tools/shot.js` rendered.

## 2026-05-31 - [codex] add sfx_shoot.mp3
- File: `assets/sfx_shoot.mp3`
- Source: OpenGameArt "Sound effects Mini Pack1.5" archive, internal file `Laser-weapon/MP3/Laser-weapon.mp3`; https://opengameart.org/content/sound-effects-mini-pack15
- License: CC0.
- Verification: MP3 frame scan passed (`bytes=5266`, `duration=0.233s`), not HTML/empty. `node harness.js` 28/28; `node tools/shot.js` rendered.

## 2026-05-31 — [claude] 弾が足場で止まる問題＆到達不能足場を修正
- **弾が足場に当たって敵に届かない**→ 弾(自機/敵とも)は**薄い足場(h<40)を貫通**、地面/壁(h≥40)のみ阻む。テストT18追加。
- **ジャンプで届かない足場**→ 高すぎた足場を**rise≤58の届く高さに統一**(例 S(420,124)→158、150台→158、146→160)。乗っていた敵位置も追従。
- 到達性テストT17を厳格化(RISE 68→62)。`harness`=**28/28**(T18貫通を追加)。preview確認OK。

## 2026-05-31 — [claude] ローディング画面でオープニングのチラつき解消
- 症状: 起動直後にコード描画(旧ドット絵)が一瞬出て、画像が遅延ロードされ後から差し込まれる。
- 対応: 状態 `loading` を追加し、**全アセット(ASSETS/BG/TERRAIN/UI/BULLET/ITEM/FX)を先読み完了後にタイトルへ遷移**。プログレスバー付きローディング画面 `drawLoading()`。`getImg`/`loadAssets`に`settled`、`preloadAll()`/`preloadProgress()`実装。最大7秒でタイムアウト。
- HEADLESS時は`loading`をスキップ(初期`title`)＝harnessのT1維持。`harness`=27/27。preview_loadingで描画確認(textはエミュ非対応で非表示だがブラウザでは表示)。

## 2026-05-31 — [claude] 走り撃ちアニメ(runshoot)を反映＝フィードバック3点完了
- `ASSETS.player.anims.runshoot`(8f/fps14)を紐付け。移動＋射撃中に腕を前に出して発射する走りモーション＋マズルフラッシュ＋弾が一致（preview_runshootで確認）。
- これでユーザー指摘3点完了: ①走り撃ちの腕前出し ②HP減少緩和(maxhp24等) ③回復の敵ランダムドロップ。
- `harness`=27/27維持。

## 2026-05-31 — [codex] player_runshoot painterly hero sprite generated
- Saved `assets/player_runshoot.png` — 8 frames, 256x256 per frame, horizontal strip 2048x256; same cobalt-blue robot design as `player_run.png` / `player_shoot.png`, running while the right-arm buster cannon is extended forward, with small cyan muzzle flashes on frames 2 and 6.
- Generated with built-in `image_gen` using the existing run/shoot sprites as visual references, on a flat magenta chroma-key background; locally removed key to RGBA transparency and repacked/cropped to match the run sprite scale and lower foot baseline.
- Verification: exact 2048x256 dimensions, RGBA alpha present (`alpha min=0 max=255`), transparent corner pixels, no visible magenta key residue (`keyish=0`), and visual spot-check complete. `node harness.js` = 27/27; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered and `tools/shot_play.png` / `tools/shot_zoom_chars.png` spot-checked.
- Scope: image asset + handoff only; no code or hitboxes changed per request.
- Next: Claude can add `ASSETS.player.anims.runshoot` wiring when code edits are allowed.

## 2026-05-31 — [claude] バランス調整(HP/被ダメ)＋回復ドロップ式＋走り撃ちフック
- **HPの減りが速い→調整**: 最大HP 16→24、接触ダメ3→2・ハザード3→2、無敵60→72。回復量 小+8/大+24(全回復)。
- **回復は敵ランダムドロップに**: 固定配置を撤廃。敵撃破時に**24%でドロップ(小80%/大20%)**＋簡易重力で着地。穴に落ちたら消滅。
- **走りながら射撃で腕が出ない→対応**: anim選択に「移動＋射撃中=runshoot」を追加(素材あれば使用、無ければrun)。**[codex] `player_runshoot.png`(走りながら腕を前に出して発射, 256px・6〜8コマ) の生成が必要** → 来たら ASSETS.player.anims.runshoot に紐付け。
- 検証: `harness`=27/27(T16をドロップ式に更新)。

## 2026-05-31 — [claude] FX反映で全要素2D化完成＋到達不能足場を修正
- `FX_SPR` に muzzle(3f)/hit(4f)/explosion(8f)/dust(5f) を紐付け→ マズルフラッシュ・着弾火花・爆発・着地煙が塗り2Dに。preview_shootでマズル確認。
- **到達不能エリア修正**: 高所足場 `S(2340,144)` が左右の足場から90px離れ、ジャンプ横到達(~76-82px)超で届かなかった→ `S(2300,158)` に調整（地面から到達可能）。砲台も2310へ。
- **再発防止**: ハーネスにT17「全足場がジャンプで到達可能(BFS到達性検査 RISE68/DX80)」を追加。`harness`=**27/27**。
- **完成**: 背景/地形/足場/主人公/敵/ボス/弾/HPバー/回復アイテム/FX = **全要素が高精細塗り2D**。当たり判定・物理は不変。

## 2026-05-31 — [codex] fx_dust painterly effect sheet generated
- Saved `assets/fx_dust.png` — 5 frames, 128x128 per frame, horizontal strip 640x128; soft grey/white landing dust puff with pale white center and faint cyan rim light, hand-painted 2D, not pixel art.
- Generated with built-in `image_gen` on a flat magenta chroma-key background, cropped/packed into equal 128px frames, then locally removed key color to RGBA transparency.
- Verification: exact 640x128 dimensions, RGBA alpha present (`alpha min=0 max=255`), transparent corner pixels, and no visible magenta key residue (`keyish=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered and `tools/shot_play.png` spot-checked.
- Scope: image asset only; no code or hitboxes changed.
- Next: all four requested FX sheets are generated and committed. Claude can enable the existing FX image hooks when ready.

## 2026-05-31 — [codex] fx_explosion painterly effect sheet generated
- Saved `assets/fx_explosion.png` — 8 frames, 192x192 per frame, horizontal strip 1536x192; fiery orange/yellow/white explosion with expanding fireball, ember ring, and dissipating smoke, hand-painted 2D, not pixel art.
- Generated with built-in `image_gen` on a flat magenta chroma-key background, segmented from the generated single-row strip, packed into equal 192px frames, and locally converted to RGBA transparency.
- Verification: exact 1536x192 dimensions, RGBA alpha present (`alpha min=0 max=255`), transparent corner pixels, and no visible magenta key residue (`keyish=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered and `tools/shot_play.png` spot-checked.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/fx_dust.png`.

## 2026-05-31 — [codex] fx_hit painterly effect sheet generated
- Saved `assets/fx_hit.png` — 4 frames, 96x96 per frame, horizontal strip 384x96; cyan/white impact hit-spark burst, hand-painted 2D with bright additive-style core/glow, not pixel art.
- Generated with built-in `image_gen` on a flat magenta chroma-key background, cropped/packed into equal frames, then locally removed key color to RGBA transparency.
- Verification: exact 384x96 dimensions, RGBA alpha present (`alpha min=0 max=255`), transparent corner pixels, and no visible magenta key residue (`keyish=0`) confirmed after removing 3 matte residue pixels. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered and `tools/shot_play.png` spot-checked.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/fx_explosion.png`.

## 2026-05-31 — [codex] fx_muzzle painterly effect sheet generated
- Saved `assets/fx_muzzle.png` — 3 frames, 128x128 per frame, horizontal strip 384x128; cyan/white buster muzzle flash facing right, hand-painted 2D with bright additive-style core/glow, not pixel art.
- Generated with built-in `image_gen` on a flat magenta chroma-key background, then locally removed key color to RGBA transparency and resized/packed to the requested strip.
- Verification: exact 384x128 dimensions, RGBA alpha present (`alpha min=0 max=255`), transparent corner pixels, and no visible magenta key residue (`keyish=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered and `tools/shot_play.png` spot-checked.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/fx_hit.png`.

## 2026-05-31 — [claude] 地形/HPバー/回復アイテムの塗り2Dを反映（ほぼ全要素2D化）
- `TERRAIN` に ground_fill/ground_top(h18)/platform を紐付け→ 地面テクスチャ＋ネオン縁＋足場モジュールが solids に重なる（当たり判定不変）。
- `UI_SPR` に ui_hp/ui_hp_boss を紐付け（Codex報告の内側透過チャンネル座標から fill 矩形を算出）→ 自機(シアン)/ボス(赤)のHPバー枠＋fill表示。
- `ITEM_SPR` に heal_s(22)/heal_l(30) を紐付け。
- 検証: preview(HD)で 背景+地形+足場+キャラ+HPバー が全て塗り2Dで合成、ボスHPバーも確認。`harness`=26/26維持。
- **達成**: 背景/地形/キャラ/弾/HPバー/アイテム = ほぼ全要素が高精細塗り2D。
- **残り**: FX(muzzle/hit/explosion/dust 等)＝現状コードのパーティクル。→ [claude]がFX画像フック実装→[codex]§4で生成→反映で完全体。

## 2026-05-31 - [codex] platform painterly floating terrain asset generated
- Saved `assets/platform.png` - 256x64 RGBA transparent PNG; stretch-friendly floating steel platform module with cyan neon top edge, underside vents, and transparent surround.
- Verification: exact 256x64 dimensions, alpha channel present (`alpha min=0 max=255`), transparent corner pixels, and no visible magenta key residue (`keyish=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: all requested item, HP frame, and terrain assets are generated and committed. Claude can wire the existing image hooks when ready.

## 2026-05-31 - [codex] ground_top painterly neon terrain edge generated
- Saved `assets/ground_top.png` - 256x64 RGBA transparent PNG; horizontally seamless metal top-edge strip with cyan neon rim and transparent lower area.
- Verification: exact 256x64 dimensions, alpha channel present (`alpha min=0 max=255`), no visible magenta key residue (`keyish=0`), transparent lower band (`bottom_alpha_max=0` for y>=48), and pixel-perfect horizontal seam (`seam_delta_x=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/platform.png`.

## 2026-05-31 - [codex] ground_fill painterly seamless terrain tile generated
- Saved `assets/ground_fill.png` - 256x256 opaque RGB PNG; hand-painted industrial wet metal/concrete ground body texture in the cobalt neon-night palette, tileable horizontally and vertically.
- Verification: exact 256x256 dimensions, fully opaque (`alpha min=255 max=255`), pixel-perfect wrap seams (`seam_delta_x=0`, `seam_delta_y=0`), and 3x3 tiled preview spot-check confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/ground_top.png`.

## 2026-05-31 - [codex] ui_hp_boss painterly boss HP frame generated
- Saved `assets/ui_hp_boss.png` - 360x60 RGBA transparent PNG; horizontal crimson/red sci-fi boss HP bar frame with an intentionally empty inner channel for code-drawn fill.
- Verification: exact 360x60 dimensions, alpha channel present (`alpha min=0 max=255`), transparent corner pixels, no visible magenta key residue (`keyish=0`), and inner fill channel fully transparent (`channel=(45,16,270,28)`, `channel_alpha_max=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/ground_fill.png`.

## 2026-05-31 - [codex] ui_hp painterly player HP frame generated
- Saved `assets/ui_hp.png` - 360x70 RGBA transparent PNG; horizontal cobalt-blue/cyan sci-fi HP bar frame with an intentionally empty inner channel for code-drawn fill.
- Verification: exact 360x70 dimensions, alpha channel present (`alpha min=0 max=255`), transparent corner pixels, no visible magenta key residue (`keyish=0`), and inner fill channel fully transparent (`channel=(41,22,278,27)`, `channel_alpha_max=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/ui_hp_boss.png`.

## 2026-05-31 - [codex] item_heal_l painterly recovery asset generated
- Saved `assets/item_heal_l.png` - 96x96 RGBA transparent PNG; large forward-facing gold/green glowing recovery orb with a white plus sign, hand-painted 2D style, no pixel art.
- Verification: exact 96x96 dimensions, alpha channel present (`alpha min=0 max=255`), transparent corner pixels, and no visible magenta key residue (`keyish=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/ui_hp.png`.

## 2026-05-31 - [codex] item_heal_s painterly recovery asset generated
- Saved `assets/item_heal_s.png` - 64x64 RGBA transparent PNG; small forward-facing green/cyan glowing recovery orb/capsule with a white plus sign, hand-painted 2D style, no pixel art.
- Verification: exact 64x64 dimensions, alpha channel present (`alpha min=0 max=255`), transparent corner pixels, and no visible magenta key residue (`keyish=0`) confirmed. `node harness.js` = 26/26; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and verify `assets/item_heal_l.png`.

## 2026-05-30 — [claude] ゲーム中身の大改修: ステージ拡張/当たり判定修正/回復アイテム/ハザード
- **当たり判定の不具合修正**: 塗り2D砲口に弾を上げた結果、背の低い地上敵の上を弾が通過していた。→ 地上敵(met/walker/turret)の当たり判定を**見た目に合わせて高く(h28・top188)**＝同じ高さの弾が当たる。テストT15で固定。
- **ステージ拡張**: LEVEL_W 2800→**4200**。穴5つ(各70px)・高所ルート・段差・**ハザード(スパイク帯2)**で単調さ解消。敵17体を高さ変化＋ヒット可能位置に配置。ROOM_X/BOSS_TRIGGER更新。
- **回復アイテム**: 小回復(+6)・大回復(+16)を実装(取得判定/回復/配置3個)。`ITEM_SPR`画像フック付き(無ければ図形)。テストT16で固定。
- 検証: `harness`=**26/26**(踏破/当たり判定/回復を追加)。preview(HD)で新ステージ描画確認。
- **次（生成）**: [codex] HPバー画像(自機/ボス)・回復アイテム画像(小/大)・地形アート(地面/縁/足場)。[claude] HUD画像フック＋地形フックを実装してから紐付け。

## 2026-05-30 — [claude] 塗り2Dパララックス背景3層を反映（背景完成）
- `BG` に far(0.15)/mid(0.40)/near(0.70) を紐付け。preview(HD)で **月+ネオン工業都市の3層背景がキャラ後ろに合成**されるのを確認（透過・継ぎ目OK）。
- 当たり判定なしの純・背景レイヤー（設計どおり背景とオブジェクトを分離）。`harness`=24/24維持。
- **残り（最終）**: ① 地形オブジェクト＝当たり判定(solids)＋塗り2Dアート（地面テクスチャ/縁/足場モジュール）。② FX(muzzle/hit/explosion/dust)。
  - [claude] 地形アートを solids に重ねる描画フックを実装（当たり判定は不変）→ [codex] ART_DESIGN.md §3 で地面/縁/足場 生成 → 反映。
  - FX も同様（[claude]フック→[codex]§4生成）。

## 2026-05-30 - [codex] bg_near painterly parallax layer generated
- Saved `assets/bg_near.png` - 1920x1080 RGBA PNG; high-fidelity hand-painted 2D near foreground rooftop/duct/sign layer with cyan and magenta neon rim lighting.
- Verification: exact 1920x1080 dimensions, real alpha transparency (`alpha min=0 max=255`, top 120px fully transparent), no visible green-key pixels detected, and pixel-perfect horizontal seam (`left/right edge max delta = 0`) confirmed. `node harness.js` = 24/24; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: all three requested parallax background layers are generated and committed.

## 2026-05-30 - [codex] bg_mid painterly parallax layer generated
- Saved `assets/bg_mid.png` - 1920x1080 RGBA PNG; high-fidelity hand-painted 2D mid-distance industrial building layer with cyan/magenta neon and warm/cool window lights.
- Verification: exact 1920x1080 dimensions, real alpha transparency (`alpha min=0 max=255`, top 120px fully transparent), no visible green-key pixels detected, and pixel-perfect horizontal seam (`left/right edge max delta = 0`) confirmed. `node harness.js` = 24/24; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and validate `assets/bg_near.png` with transparent area above foreground structures.

## 2026-05-30 - [codex] bg_far painterly parallax layer generated
- Saved `assets/bg_far.png` - 1920x1080 opaque RGB PNG; high-fidelity hand-painted 2D moonlit neon-night far background with sky gradient, moon, and distant industrial skyline.
- Verification: exact 1920x1080 dimensions, opaque/no-alpha RGB output, and pixel-perfect horizontal seam (`left/right edge max delta = 0`) confirmed. `node harness.js` = 24/24; `node tools/shot.js` rendered.
- Scope: image asset only; no code or hitboxes changed.
- Next: generate and validate `assets/bg_mid.png` with transparent sky area.

## 2026-05-30 — [claude] 塗り2D反映: flyer/turret/ボス＋弾3種（前景キャラ完全2D化）
- 反映: `ASSETS` に flyer(fly4f,scale0.2)/turret(idle+fire,scale0.26)/boss(idle/jump/shoot/dash/death,scale0.13) 追加。`BULLET_SPR`に buster/charge/enemy。
- ディスパッチ調整: drawEnemyのturret→timer<16でfire、drawBossをstate別(idle/jump/shoot/dash)＋dead時death表示に。
- 検証: preview(HD)で boss部屋(hero+巨大ボス+flyer)・射撃(buster砲口一致)・チャージ(電撃球) 確認。`harness`=24/24維持。
- **達成**: 主人公・met・walker・flyer・turret・ボス・弾 = **前景キャラと弾が全て塗り2D**。
- **残り（最終段階）**: 背景3層 / 地形テクスチャ / FX(muzzle/hit/explosion/dust等)。→ [claude]が画像描画フック(背景パララックス/地形/FX)を実装 → [codex]が ART_DESIGN.md §3/§4 で生成 → 反映。

## 2026-05-30 - [codex] boss painterly sprite set generated
- Saved `assets/boss_idle.png` - 2 frames, 512x512 per frame, horizontal strip 1024x512; right-facing deep-crimson/steel boss master with horns, red eyes, yellow core, and oversized energy-emitter arm.
- Saved `assets/boss_jump.png` - 2 frames, 512x512 per frame, horizontal strip 1024x512; same boss design crouch/leap poses.
- Saved `assets/boss_shoot.png` - 3 frames, 512x512 per frame, horizontal strip 1536x512; same boss design with attached yellow emitter glow, no separate projectile artifact.
- Saved `assets/boss_dash.png` - 2 frames, 512x512 per frame, horizontal strip 1024x512; same boss design in low forward dash poses.
- Saved `assets/boss_death.png` - 4 frames, 512x512 per frame, horizontal strip 2048x512; same boss design in contained shutdown/collapse poses.
- Verification: exact dimensions, alpha channels, transparent corner pixels, no green matte residue, and visual spot-check confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered. No code or hitboxes changed.
- Next for Claude: wire boss animations with `dash` registered as anim name `run`; enable `death` only with a later code hook if desired.

## 2026-05-30 - [codex] enemy_turret painterly sprites generated
- Saved `assets/enemy_turret.png` - 1 frame, 128x128 per frame, horizontal strip 128x128; right-facing ground-mounted dark steel + crimson cannon turret, transparent RGBA.
- Saved `assets/enemy_turret_fire.png` - 2 frames, 128x128 per frame, horizontal strip 256x128; same turret design with cyan muzzle charge/flash and recoil, transparent RGBA.
- Verification: exact dimensions, alpha channels, transparent corner pixels, and no green matte residue confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered. No code or hitboxes changed.
- Next for Claude: wire `enemy_turret.png` as `idle` and `enemy_turret_fire.png` as `fire` if enabling turret firing animation.

## 2026-05-30 - [codex] enemy_flyer painterly sprite generated
- Saved `assets/enemy_flyer.png` - 4 frames, 128x128 per frame, horizontal strip 512x128; right-facing red-eyed hovering combat drone, dark steel + crimson armor, red glow, transparent RGBA.
- Verification: exact dimensions, alpha channel, and transparent corner pixels confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered. No code or hitboxes changed.
- Next for Claude: wire `enemy_flyer.png` as the flyer `fly` animation when updating `ASSETS`.

## 2026-05-30 — [codex] bullet_enemy projectile sprite generated
- Saved `assets/bullet_enemy.png` — 2 frames, 80x80 per frame, horizontal strip 160x80; high-fidelity hand-painted red/orange hostile energy bolt, right-facing, transparent RGBA.
- Verification: exact dimensions, alpha/corner transparency, and no green key residue confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered. No code or hitboxes changed.
- Next for Claude: use the existing enemy-bullet image hook only if needed; asset is ready.

## 2026-05-30 — [codex] bullet_charge projectile sprite generated
- Saved `assets/bullet_charge.png` — 2 frames, 192x192 per frame, horizontal strip 384x192; high-fidelity hand-painted cyan charged orb with sparks/arcs, right-facing, transparent RGBA.
- Verification: exact dimensions, alpha/corner transparency, and no visible chroma-key residue confirmed; `node harness.js` = 24/24; `node tools/spritecheck.js` rendered; `node tools/shot.js` rendered. No code or hitboxes changed.
- Next for Claude: use the existing charged-bullet image hook only if needed; asset is ready.

## 2026-05-30 — [codex] bullet_buster projectile sprite generated
- Saved `assets/bullet_buster.png` — 2 frames, 96x96 per frame, horizontal strip 192x96; high-fidelity hand-painted cyan energy bolt, right-facing, transparent RGBA.
- Verification: exact dimensions and alpha/corner transparency confirmed after image_gen chroma-key removal. No code or hitboxes changed.
- Next for Claude: wire/use the existing bullet image hook only if needed; asset is ready.

## 2026-05-30 — [claude] フィードバック修正: アニメ優先度／弾の発射位置／弾の画像フック
- ユーザー指摘の修正:
  1. **チャージしたまま移動でチャージポーズ固着** → `drawPlayer`のanim選択で移動中は必ずrun優先に修正。
  2. **弾の発射位置が砲口とズレ（約11px下）** → `shootP`の発射座標を塗り2D砲口に合わせて調整（通常 x+20/y-3、チャージ x+16/y-7）。preview_shootで一致確認。
  3. **弾を画像化する土台** → `BULLET_SPR`＋`getImg`＋`drawBulletSpr` を追加。`drawBullets`で画像優先・無ければ図形フォールバック。
- `harness`=24/24維持。
- **要・生成（次バッチ）**: [codex] `bullet_buster`/`bullet_charge`/`bullet_enemy`（透過・設計書§4準拠）＋ flyer/turret/boss。生成後Claudeが `BULLET_SPR`/`ASSETS` に紐付け。
- **残り**: 背景3層/地形/FX（Claudeが画像描画フック追加→Codex生成）。画風統一の最終段階。

## 2026-05-30 — [claude] 塗り2D反映: 主人公残り＋met＋walker（Codexバッチは途中でAPIエラー停止）
- Codexのキャラバッチは **image_gen の "Bad Request"（APIエラー, 403kトークン）で flyer手前で停止**。だが per-entity コミットで以下は生成済み:
  - 主人公: jump(2f)/shoot(2f)/charge(4f)/hurt(2f) 256px ／ met: hide(1f)/open(3f) 128px ／ walker: walk(4f) 128px。**いずれも本物の塗り2D・画風一致を目視確認**。
- 反映: `ASSETS` に上記を追加（met/walker scale0.22 ay1）。`drawEnemy`のanim選択を met→hide/open・walker→walk に修正。`drawPlayer`のanim選択を hurt/jump/shoot/charge/run/idle に拡張。
- 検証: preview(HD)で hero+met+walker が塗り2D・接地◎・画風統一を確認。`harness`=24/24維持。
- **未生成（次バッチ）**: flyer / turret / boss（キャラ系）。その後 背景3層 / 地形 / 弾 / FX（←Claudeが画像描画フック追加してから）。
- **次タスク**: [codex] flyer/turret/boss を再生成（前回はAPI一時エラー＝再実行で続行可）。[claude] 残り反映＋背景/地形/弾の描画フック実装。

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
