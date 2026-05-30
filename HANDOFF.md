# HANDOFF — Claude ↔ Codex 協働ログ（新しい順に上へ追記）

各エントリ: `## YYYY-MM-DD — [claude|codex] 見出し` ／ 実施・検証・**相手への次タスク**。

---

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
