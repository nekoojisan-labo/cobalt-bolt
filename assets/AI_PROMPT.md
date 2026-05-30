# AIでスプライトを作る場合のプロンプト＆技術仕様

> ねらい：青ロボ「COBALT BOLT」を**自由なデザイン**で、かつ**ゲームに載る形**で作る。

## 0. ツール選び（重要）
- ◎ **ピクセルアート特化AI**（`Retro Diffusion`, `PixelLab.ai` 等）… 本物のドット絵＋**一貫アニメ**が出せる。**最推奨**。
- △ 普通の ChatGPT / DALL·E … 1枚絵は綺麗だが**コマ間で別人化・輪郭ボケ・背景付き**になりやすい。使うなら「1ポーズだけ」用途で。
- どのツールでも、下の**技術仕様**を満たせば私の読込機構にそのまま載ります。

## 1. 技術仕様（これを守れば即組込）
- **透過背景（PNG, アルファ付き）**／背景・影・地面は描かない
- **アンチエイリアスOFF**・限定パレット（〜16色）・**濃い輪郭線**
- **キャラは各コマの中央、足が下端に接地**
- **1アニメ＝1枚の横ストリップ**でOK（コマを横一列に等間隔）。ファイルを分けて良い：
  ```
  assets/player_idle.png   (48x48 × 4コマ → 192x48)
  assets/player_run.png    (48x48 × 6コマ → 288x48)
  assets/player_jump.png   (48x48 × 2コマ → 96x48)
  assets/player_shoot.png  (48x48 × 2コマ → 96x48)
  ```
  ※フレームサイズは48x48推奨（32〜64でも可）。**全アニメで同じサイズ・同じキャラ**にすること。

## 2. 主人公プロンプト（英語推奨）
```
Pixel art sprite, side view facing right, a small heroic robot called "Cobalt Bolt"
for a Mega Man-style platformer. Cobalt/azure blue armor, glowing cyan accents,
rounded helmet with a small crest and ear pods, white-blue trim, a buster arm-cannon
on the right arm. Bold dark outline, clean readable pixel art, limited palette (~14 colors),
NO anti-aliasing, transparent background. Character centered, feet at the bottom edge.
Frame 48x48. Keep the SAME character design across all frames.
Make a horizontal animation strip:
- IDLE: 4 frames (subtle breathing)
- RUN: 6 frames (run cycle)
- JUMP: 2 frames (rising, falling)
- SHOOT: 2 frames (arm-cannon firing, muzzle flash)
```
※特化AIなら各アニメを1本ずつ生成 → 上の命名で保存。

## 3. 敵プロンプト（同じパレット帯で統一）
```
Pixel art enemy sprites for the same sci-fi platformer, matching palette and outline style,
transparent background, no anti-aliasing, frame 32x32, feet at bottom.
1) HOVER DRONE: small floating red-eyed drone, 4-frame hover loop.
2) WALKER BOT: stubby walking robot with two legs, 4-frame walk.
3) TURRET: ground turret with a cannon, 2-frame fire.
4) HELMET BOT: dome-shielded enemy that hides then pops, 2 states (hide, open).
```

## 4. ボスプロンプト
```
Pixel art BOSS sprite, same style/palette, transparent background, no anti-aliasing,
large menacing red-and-steel battle robot with glowing core and arm cannon, frame 96x96,
feet at bottom, SAME design across frames. Strips:
- IDLE: 2 frames
- JUMP: 2 frames
- SHOOT: 3 frames (spread shot)
- DASH/RUN: 2 frames
```

## 5. 背景・タイル（任意・画風を合わせる）
```
Pixel art sci-fi city tileset, 16x16 tiles, industrial neon night theme,
plus 3 parallax background layers (far skyline, mid buildings, near foreground),
limited palette matching the character sprites.
```

## 6. できたら
PNGを `assets/` に置いて「**素材置いた**」と一言。
→ 私が各ストリップのコマ割りを確認し、`index.html` の `ASSETS` に設定（当たり判定は不変、見た目だけ差し替え）→ スクショ検証 → push。
