# COBALT BOLT 画像生成ガイド（全要素・統一画風）

ピクセルアート特化AI（**Retro Diffusion** / **PixelLab.ai** 等）での生成用。
**まず「共通スタイル指定」を毎回プロンプト先頭に貼る**こと（これで全要素の画風が揃う）。

---

## ★ 共通スタイル指定（毎回コピペで先頭に付ける）
```
Pixel art, retro 16-bit side-view platformer asset. Bold near-black outline,
clean crisp pixels on a grid, NO anti-aliasing, limited palette (~16 colors),
top-left light source. Transparent background (PNG alpha), no drop shadow, no ground.
Theme: neon-industrial night city. Character centered in frame, feet at bottom edge.
Keep the SAME design/proportions/palette across all frames of the same subject.
```
- パレットの軸：**主人公＝コバルト/アズールblue＋cyan発光＋white trim**、**敵＝鋼鉄グレー＋警告red/orange**、**ボス＝深紅＆鋼鉄＋黄発光コア**。
- 出力は**横ストリップ**（コマを横一列・等間隔）。**透過必須**。

---

## ① 主人公 COBALT BOLT（48×48 / 透過）
> 最重要。**まず idle と run の2枚だけ**作って私に見せてください（サイズ・接地・画風を私が検証→OKなら量産）。

```
[共通スタイル] a small heroic robot "Cobalt Bolt": cobalt-blue armor, glowing cyan accents,
rounded helmet with a small crest and ear pods, white-blue trim, a buster arm-cannon on the right arm.
Frame 48x48. Horizontal strip.
- player_idle  : 4 frames (subtle breathing)
- player_run   : 6 frames (run cycle)
- player_jump  : 2 frames (rising / falling)
- player_shoot : 2 frames (arm-cannon firing + muzzle flash)
```
保存: `player_idle.png(4)` `player_run.png(6)` `player_jump.png(2)` `player_shoot.png(2)`

## ② 敵 4種（32×32 / 透過 / 同パレット帯）
```
[共通スタイル] enemy robots, steel-grey with warning red/orange accents, frame 32x32, horizontal strip.
- enemy_met_hide : dome-shielded helmet enemy, CLOSED (just a metal dome), 1 frame
- enemy_met_open : same enemy OPEN (dome lifted, red eye showing), 2 frames
- enemy_walker   : stubby two-legged walker bot, 4-frame walk cycle
- enemy_flyer    : small floating drone with red eyes and side fins, 4-frame hover
- enemy_turret   : ground turret with a cannon (idle), 1 frame
- enemy_turret_fire : the turret firing, 2 frames (muzzle flash)
```
保存: `enemy_met_hide.png(1)` `enemy_met_open.png(2)` `enemy_walker.png(4)` `enemy_flyer.png(4)` `enemy_turret.png(1)` `enemy_turret_fire.png(2)`

## ③ ボス（96×96 / 透過）
```
[共通スタイル] BOSS battle robot, deep-crimson & steel armor, glowing yellow core in the chest,
horns, a large arm cannon, menacing. Frame 96x96, horizontal strip, SAME design across frames.
- boss_idle  : 2 frames (idle hover/breath)
- boss_jump  : 2 frames (crouch / airborne)
- boss_shoot : 3 frames (charge → fire spread)
- boss_dash  : 2 frames (dash pose)
```
保存: `boss_idle.png(2)` `boss_jump.png(2)` `boss_shoot.png(3)` `boss_dash.png(2)`

## ④ 弾（バスター・敵弾 / 透過）
```
[共通スタイル] projectile sprites, small, glowing, transparent background:
- bullet_buster : small cyan energy pellet, 16x16, 1 frame (or 2-frame flicker)
- bullet_charge : large bright cyan charged orb with sparks, 24x24, 2 frames
- bullet_enemy  : hostile red/orange energy bolt, 12x12, 1-2 frames
```
保存: `bullet_buster.png` `bullet_charge.png(2)` `bullet_enemy.png`

## ⑤ ステージのタイル＆オブジェクト（16×16基準 / 透過）
```
[共通スタイル] 16x16 sci-fi industrial platform TILESET on a grid sheet:
metal ground TOP edge tile, ground FILL tile, platform tile, corner/edge variants,
neon trim. Plus separate PROP sprites (transparent): crate, warning sign, pipe, barrel, antenna.
```
保存: `tiles.png`（タイル集合）, `prop_crate.png` `prop_sign.png` `prop_pipe.png` 等（任意）

## ⑥ 背景 3層パララックス（横タイル可能 / 各レイヤー1枚）
```
[共通スタイル, BUT this is a BACKGROUND not a character] seamless horizontally-tileable
pixel-art parallax layers, neon night city:
- bg_far  : far sky + moon + distant skyline silhouettes (darkest)
- bg_mid  : mid-distance lit buildings
- bg_near : near foreground rooftops/structures (most detail)
Each layer ~480px tall, wide and seamless on the left/right edges.
```
保存: `bg_far.png` `bg_mid.png` `bg_near.png`

---

## 生成の順番（おすすめ）
1. **`player_idle` + `player_run`** だけ作る → 私に見せる（検証）
2. OKなら `player_jump` `player_shoot`
3. 敵4種 → 4. ボス → 5. 弾 → 6. タイル/オブジェクト → 7. 背景3層

## できたら
PNGを `assets/` に置いて「**素材置いた**」と一言 → 私が `index.html` の設定（`ASSETS` 等）に紐付け、
`node tools/spritecheck.js` / `node tools/shot.js` で**実際に載った画面をPNGで確認**してから反映・push します。
（当たり判定は変えず、見た目だけ差し替え）
