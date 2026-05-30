# COBALT BOLT — アート設計書 (Art Bible) v1.0 ／ 高精細2D・フルHD

> 本書は **Codex（または絵師/AI）に渡して素材を制作するための公式設計書**です。
> 全アセットをこの1冊の画風・仕様に統一すること。ゲームへの反映・エンジン改修は **Claude** が担当。

## 0. 画風・前提（確定事項）
- **画風**: 高精細イラスト/塗りの2D（**ピクセルアートではない**）。Ori / Hollow Knight / Dead Cells 寄りの手描き×塗り×大気感。滑らかなアンチエイリアス表示。
  - 方針転換の理由: 「ゲームとして画質が低い」を解消するため、画材をドット絵→**高精細2D**へ転換。**主人公だけでなく全アセットを新画風に統一**する（混在は画風破綻のためNG）。
- **解像度**: 内部レンダリング **1920×1080**。ワールド座標(480×270)・物理・**当たり判定はコード据え置き**で、描画のみ **RENDER_SCALE=4＋スムージング**（Claudeがエンジン改修）。
- **当たり判定とアートは別物**: アートは当たり判定枠より大きく描いてよい（オーバーフロー可）。接地基準は **足元(底辺中央)**、アンカー `ax:0.5, ay:1`。素材は**右向き基準**（左向きは描画側で水平フリップ）。

## 1. 使い方（Codex運用フロー）
1. 各セクションの仕様＋英語プロンプトで生成（**毎回プロンプト先頭に各章の STYLE HEADER を付ける**＝画風統一の要）。
2. 透過PNGを `assets/` に保存（命名は「5. 納品・技術仕様」の一覧表に従う）。
3. `[codex]` でコミット＋ `HANDOFF.md` に結果追記。
4. Claudeが `ASSETS`／描画フックへ反映 → `node tools/preview.js` `node harness.js` で検証 → push。
- **生成順（推奨）**: 主人公 idle/run → Claude検証 → 主人公残り → 敵 → ボス → 弾/FX → 地形/背景 → UI/ロゴ。**まず1〜2枚で画風・サイズを検証してから量産**（作り直し防止）。

## 2. エンジン改修（Claude担当・素材制作と並行）
- 内部解像度 1920×1080 化（RENDER_SCALE=4 ／ `imageSmoothingEnabled=true` ／ CSS `image-rendering` の pixelated 解除）。
- ワールド座標・当たり判定は不変。`ASSETS` の `scale` を新フレーム寸法に合わせ再計算。
- 背景3層パララックス／地形テクスチャ＋縁／弾・FX の**画像描画フックを追加**（現状はキャラのみ画像対応）。HUDも高精細化。
- 既存のロジック自動テスト（`harness.js` 24項目）を**維持**。

## 3. 目次
1. 主人公(COBALT BOLT) ／ 2. 敵4種＋ボス ／ 3. 環境(地形・背景・プロップ) ／ 4. 弾・エフェクト・UI・画面 ／ 5. 納品・技術仕様＆Codex運用

---

I now have full context: engine collision values, anchor conventions (ax:0.5, ay:1, foot-bottom-center), existing identity, and the established asset-naming pipeline. Note the project's `assets/AI_PROMPT.md` is written for *pixel-art-specialized* AI, but the new directive (共通コア) overrides this with **painterly 2D, NOT pixel art** at 256×256 frames. I will write the character section to the new high-fidelity spec while keeping engine compatibility (anchor, hitbox, foot-bottom-center, horizontal strips).

Here is the design section.

---

# キャラ担当 ── 主人公「COBALT BOLT」高精細2D設計

## 0. 共通コア準拠（この章の全アニメに適用）

- **画風**: 高精細イラスト/塗りの2D（**ピクセルアートではない**）。Ori / Hollow Knight / Dead Cells 寄りの手描き×塗り×大気感。アンチエイリアスあり・nearest不使用。輪郭は黒1px固定線ではなく、**濃いリムライト＋締めライン**で立体を出す。
- **フレーム**: 256×256 透過PNG。キャラ身長 ~150px、**足の底辺を枠下端付近**に置く（接地基準）。
- **アンカー / 当たり判定対応**: エンジンは `ax:0.5, ay:1`（底辺中央＝足元）でスプライトを置く。当たり判定は **コード据え置きの 18×24（=オンスクリーン 72×96px）**。アートは枠内で当たり判定より大きく描いてよい（オーバーフロー可）が、**全アニメで足元中央・身長・装甲ボリュームを一定**に保ち、コマ間のブレ（ジッター）を出さないこと。
- **1作品=1画風**: 下の「マスターデザイン／パレット／ライティング」を全アニメ・全コマで完全共有する。コマごとに装甲ディテールや配色が変わるのは禁止。

---

## 1. マスターデザイン（全アニメ共通の確定仕様）

スリムで俊敏な小型ロボヒーロー。重量級ではなく、**軽快で前傾しやすいアスリート体型**。

| 部位 | デザイン確定事項 |
|------|------------------|
| **頭部** | ラウンド型ヘルメット。中央に小さなクレスト（ひれ状の稜線）、両側にイヤーポッド。フェイスは**シアン発光バイザー**（目はバイザー内の2点グロー）。 |
| **胴** | コバルト装甲の**面構成**（フラットな装甲パネルを角度で割る）。胸センターに**小型シアンコア**（菱形/円）。白トリムがパネルの境界を走る。 |
| **右腕** | **バスター砲**（前腕一体型アームキャノン）。砲口リング内側がシアン発光。左腕は通常マニピュレーター。 |
| **脚** | スリムな二脚。膝・足首に装甲ノード。足裏に小型**ブースター口**（着地・ジャンプで発光）。 |
| **背面** | 軽い**ショートマント/ブースターフィン**（腰丈・布ではなく硬質フィン寄り）。走り/ジャンプでなびきシルエットを作る。マントは胴色より一段濃いコバルト＋裏地シアン。 |
| **発光ライン** | 肩・腰・脛・バイザーに**シアンの発光ピンストライプ**。常時うっすら自発光、charge時に増光。 |

### マスターパレット（全アニメ厳守 / HEXは塗りの基準色、実塗りはグラデで滑らかに）

```
ARMOR_BASE   #2F6DF0  cobalt blue (装甲主面)
ARMOR_SHADOW #173C88  deep cobalt (陰・面の暗側)
ARMOR_DARK   #0C1C44  near-black cobalt (リム締め・接地影側)
ARMOR_HILITE #6AA6FF  azure highlight (面の明側・反射)
TRIM_WHITE   #EAF2FF  white-blue trim (エッジトリム)
GLOW_CYAN    #5AD1FF  cyan emissive (ライン・コア・バイザー)
GLOW_CORE    #BFE6FF  bright cyan (発光の芯・ホットスポット)
METAL_GREY   #5A6488  neutral steel (関節・砲身内部)
ACCENT_GOLD  #FFD23F  ※ごく一部のアクセント（被弾UI連動色／常用しない）
```

- **ライティング（固定）**: メイン光源＝**左上**（ネオン夜の都市光）。装甲上面・左面が明（ARMOR_HILITE）、右下が陰（ARMOR_SHADOW→ARMOR_DARK）。**リムライトはシアン**（背面/輪郭にGLOW_CYANの薄い縁）で、ネオン夜の大気感を出す。金属反射は**スペキュラのホットスポット1〜2点**を装甲の角に置く。

### 命名・配置（エンジン互換）

- 形式: **横ストリップ**（全コマ等間隔・同寸 256×256）。透過PNG・背景/影なし。
- `ASSETS.player` 想定値: `fw:256, fh:256, scale:0.375?`（※実寸は実物を見てClaudeがエンジン側で再調整／現行はfw48・scale0.62。256版導入時に `fw:256` と `scale` を実測で合わせる。**当たり判定は不変**）。`ax:0.5, ay:1`。
- 反転: 左向きは描画側で水平フリップ（コードの `dir<0` 経路）。**素材は右向き基準**で作る。

| アニメ | ファイル名 | コマ | fps |
|--------|-----------|------|-----|
| idle | `player_idle.png` | 5 | 6 |
| run | `player_run.png` | 8 | 14 |
| jump (上昇) | `player_jump_rise.png` | 2 | 8 |
| jump (落下) | `player_jump_fall.png` | 2 | 8 |
| shoot | `player_shoot.png` | 3 | 18 |
| charge | `player_charge.png` | 6 (ループ) | 12 |
| hurt | `player_hurt.png` | 2 | 10 |

> 補足: 現行エンジンは `jump` を1アニメ名で参照（`_anim='jump'`）。上昇/落下を分けて納品する場合は、Claudeが描画分岐（`player.vy<0`で rise / `>0`で fall）を追加する。分けない簡易運用なら `player_jump.png`（4コマ: rise2+fall2）として1枚化も可。

---

## 2. 各アニメ詳細（目的 / コマ表 / 視覚ブリーフ / 英語プロンプト）

各プロンプトは先頭に下記**共通スタイルヘッダ**を付けて生成する（画風統一）。

```
STYLE HEADER (prepend to every prompt):
Hand-painted high-detail 2D game sprite, painterly rendering, smooth anti-aliased
shading (NOT pixel art, no visible pixel grid). Ori / Hollow Knight / Dead Cells
illustrative tone with atmospheric neon-night lighting. Subject: "Cobalt Bolt", a
small agile heroic robot — cobalt-blue paneled armor, glowing cyan visor and pin-stripe
light lines, white-blue trim, a buster arm-cannon on the RIGHT arm, slim two legs with
foot boosters, a short hard rim-fin cape. Main light from UPPER-LEFT, cyan rim light on
edges, 1-2 specular metal hotspots. Transparent background, NO ground, NO drop shadow.
Character facing RIGHT, feet near the bottom edge of the frame. 256x256 per frame,
even horizontal strip, IDENTICAL design/proportions/palette across all frames.
```

### ② idle ── 待機（5コマ / 6fps）
- **目的**: 静止時の生命感。微細な呼吸＋バイザー明滅＋マント/フィンの微揺れ。シルエットはほぼ不変、内部のみ動く。
- **コマ表**: ①基準 → ②胸+1px沈み・肩わずか下げ → ③最沈・バイザー最明 → ④戻り上昇 → ⑤基準＋クレスト先端わずか戻り。胸コアは①〜⑤で弱→強→弱に脈動。
- **視覚ブリーフ**: 正面やや右向き、バスター砲は下げて待機。足元は両足接地で安定。マントは静かに重力でたれ、コマ③で1〜2px内側へ。被弾なし。

```
[STYLE HEADER] player_idle: 5 frames, subtle idle breathing loop. Chest core glows
soft→bright→soft, cyan visor faint pulse, short cape sways 1-2px. Buster arm relaxed
downward, both feet planted, stable upright stance. Calm, alive, almost-still.
```

### ③ run ── 走行（8コマ / 14fps）
- **目的**: 俊敏感の主役アニメ。**走りでシルエットが明快に変化**（前傾＋脚の大きな振り＋マントの流れ）。
- **コマ表**（標準ランサイクル8）: ①コンタクト(右足前/接地) → ②ダウン(沈み) → ③パス(後脚通過・最沈) → ④ハイ(浮き上がり) → ⑤コンタクト(左足前) → ⑥ダウン → ⑦パス → ⑧ハイ。上体は**やや前傾固定**、腕は逆位相で振る（バスター腕は構えすぎず自然に）。足裏ブースターはパス/ハイで小さくシアン噴射。マントは進行と逆へ強くなびく。
- **視覚ブリーフ**: 接地時に足元が枠下端へ来るよう上下動を最小化（接地基準を崩さない）。モーションブラーは付けない（コマ送りで滑らかに見せる）。

```
[STYLE HEADER] player_run: 8-frame run cycle, dynamic forward-leaning sprint.
Strong leg swing (contact→down→passing→high), arms counter-swinging, hard rim-fin
cape streaming back, small cyan foot-booster puffs on passing/high frames. Clear,
readable running silhouette distinct from idle. Keep feet landing near bottom edge.
```

### ④ jump ── 上昇（2コマ / 8fps）＋落下（2コマ / 8fps）
- **目的**: 跳躍の上下を表情で分ける。上昇＝伸び・脚を引き上げ、落下＝着地構え・脚を下ろす。
- **コマ表**: 
  - rise: ①踏み切り直後（体を縦に伸ばし脚をたたむ、足裏ブースター強発光） → ②上昇継続（腕で空を切る、マント上方へ流れる）。
  - fall: ①頂点〜落下開始（やや丸まり脚を前へ） → ②着地直前（脚を下ろし衝撃に備える、ブースター弱噴射）。
- **視覚ブリーフ**: 空中なので足は枠下端に接しなくてよいが、**重心（腰）位置を接地時と揃える**（着地でガタつかせない）。マントが空中で最も大きくなびく。

```
[STYLE HEADER] player_jump RISE: 2 frames, vertical stretched ascent, legs tucked up,
bright cyan foot-booster burst, cape flowing upward, arms slicing air.
player_jump FALL: 2 frames, descent pose, legs lowering into a landing-ready stance,
faint booster flicker, body slightly curled. Same design/scale as run, airborne.
```

### ⑤ shoot ── 射撃（3コマ / 18fps / 砲口発火）
- **目的**: 撃った瞬間の手応え。**砲口マズルフラッシュ**と反動を3コマで表現。立ち撃ち基準（走り撃ちは別途エンジン側で run と合成 or 流用）。
- **コマ表**: ①構え（バスター砲を水平に上げ、砲口リング内が予兆発光・体わずか後傾） → ②**発火**（砲口前面に**シアンのマズルフラッシュ**＝GLOW_CORE芯＋GLOW_CYAN拡散、肩/胴に反動の沈み、バイザー増光） → ③戻り（砲口に残光リング、体が構えへ復帰）。
- **視覚ブリーフ**: マズルフラッシュは砲口中心から前方へ。フラッシュ自体は弾アセットと干渉しないよう**砲口直近に小さく**（弾本体は別アセット）。足元は固定、上半身のみ動く。

```
[STYLE HEADER] player_shoot: 3 frames firing the right buster arm-cannon.
F1 aim (cannon raised horizontal, muzzle ring pre-glow, slight back-lean).
F2 FIRE (bright cyan muzzle flash at the cannon mouth: hot core + cyan bloom, recoil
sink in shoulder/torso, visor brightens). F3 recover (afterglow ring at muzzle, settling
back). Feet planted, upper body only animates. Muzzle flash small, at the cannon mouth.
```

### ⑥ charge ── チャージ（6コマ ループ / 12fps / 溜め発光）
- **目的**: 長押し溜め中の演出。**バスター砲先に増大するシアンの溜め発光オーラ**を循環ループで表現（コード上 charge≥40 で大弾）。
- **コマ表**: ①小さな光球出現 → ②球が脈動拡大＋火花点 → ③オーラ最大・砲身に沿ってシアンライン流入 → ④火花飛散 → ⑤やや収縮（脈動） → ⑥再拡大へ（①へシームレス接続）。全コマで**胸コアとバイザーも同調増光**。体は軽い踏ん張り（やや腰落とし）で力をためる姿勢、全コマ同一スタンス。
- **視覚ブリーフ**: ループ前後（⑥→①）が連続するよう光量・球サイズを合わせる。火花は短命の小点（GLOW_CORE）。装甲の発光ピンストライプが順に明滅して「充填中」感を出す。

```
[STYLE HEADER] player_charge: 6-frame seamless LOOP, charging energy in the buster
cannon mouth. A growing pulsing cyan orb (hot core + cyan bloom) with small sparks,
energy lines flowing along the cannon, chest core and visor brighten in sync, pin-stripe
light lines blink in sequence ("charging"). Stance: braced, slightly lowered hips,
identical across all frames. First and last frame match for clean loop.
```

### ⑦ hurt ── 被弾（2コマ / 10fps）
- **目的**: ダメージの一瞬の反応。のけぞり＋発光フラッシュ。エンジンは被弾後 `inv` 中に点滅描画するため、**hurt自体は短く強い1ポーズの2コマ**で十分。
- **コマ表**: ①衝撃（上体を後方へのけぞり、頭を引き、腕が跳ねる、全身に**白〜シアンのリムフラッシュ**） → ②揺り戻し（やや前へ戻りつつ硬直、発光やや減）。バイザーは一瞬白く飛ぶ。
- **視覚ブリーフ**: コード側でノックバック（`vx=-dir*2, vy=-3.5`）するので、アートは**過剰に動かさず**のけぞりに集中。足元中央は維持（空中被弾もあるが基準ポーズは接地）。色は被弾UI連動でACCENT_GOLD/redは使わず、機体は**白飛び＋シアン**で痛みを表現。

```
[STYLE HEADER] player_hurt: 2 frames damage reaction. F1 impact (torso recoils
backward, head pulls back, arms flinch, full-body white-to-cyan rim flash, visor blows
out white). F2 settle (slight return, stiff brace, flash fading). Short and punchy,
feet centered. No red/gold tint — pain shown via white blowout + cyan glow.
```

---

## 3. シルエット差分チェック（受け入れ基準）

各アニメが**シルエットだけで判別可能**であること（共通コアの「走り/射撃でシルエットが明快に変化」要件）:

- **idle**: 直立・腕下げ・マント垂直 → 縦長静的シルエット。
- **run**: 前傾・脚開き・マント水平流れ → 斜め動的シルエット（idleと一目で別物）。
- **jump**: 縦伸び（rise）/丸まり（fall）・マント最大なびき → 空中シルエット。
- **shoot**: バスター腕が水平に前方へ突出＋砲口フラッシュ → 横長シルエット。
- **charge**: 砲口前に大きな発光球 → 球を抱えたシルエット。
- **hurt**: 後方のけぞり＋白飛び → 反り返りシルエット。

**全アニメ共通で固定**: 足元中央アンカー / 身長~150px / コバルト面構成＋シアン発光＋白トリム＋右腕バスターのマスターデザイン / 左上光源＋シアンリム。コマ間で装甲ディテール・配色・プロポーションがブレないこと。

---

## 4. エンジン反映メモ（Claude実装側 / 当たり判定不変）

- `ASSETS.player.fw/fh` を `256` に、`scale` は実物の身長~150pxが**当たり判定72×96px**と整合する値へ実測調整（現行 fw48/scale0.62 を 256版へ置換）。`ax:0.5, ay:1` は維持。
- jump を rise/fall で分けるなら `drawPlayer()` の `_anim` 決定に `player.vy<0 ? 'jump_rise' : 'jump_fall'` を追加。分けない場合は4コマ `player_jump.png` で代用。
- `charge` は `player.charge>0` を条件に `shoot` より優先（溜め中はchargeループ）。発火の瞬間のみ `shoot` を1ショット。
- 反映後の検証: `node tools/spritecheck.js`（コマ載り）→ `node tools/shot.js`（接地・反転・サイズ目視）→ `node harness.js`（24/24維持）。**当たり判定値（PW18/PH24）は変更しない。**

---

参照した正本ファイル（いずれも絶対パス）:
- `C:\Users\withd\Desktop\cobalt-bolt\index.html`（当たり判定 PW=18/PH=24、anchor ax:0.5/ay:1、`drawSheet`/`ASSETS`機構、`_anim`分岐 idle/run/jump/shoot）
- `C:\Users\withd\Desktop\cobalt-bolt\assets\AI_PROMPT.md` / `ASSETS_GUIDE.md`（既存のキャラ識別・命名規約。※旧仕様はピクセルアート前提のため、本設計は共通コアの painterly 2D / 256×256 へ上書き）

---

I've read index.html and confirmed all hit-box values, the existing identity (cobalt-blue hero with cyan glow, crimson×steel boss with yellow core, neon-night industrial city), and the engine's behavior states. The doc below is ready to paste into the design spec.

---

# 敵・ボス アセット設計（高精細 painterly 2D / ピクセルアートではない）

## 0. 共通レギュレーション（敵ボス担当分）

- **画風**: Ori / Hollow Knight / Dead Cells 寄りの手描き×塗り×大気感。滑らかなレンダリング（アンチエイリアスあり・nearest禁止）。輪郭は黒1px固定ではなく、濃いリム/締めラインで「絵」として表現。
- **共有ライティング**: メインキーは画面奥上方からの寒色（ネオン夜の都市光・薄いシアン〜青紫）。発光部（敵=赤眼/赤コア、ボス=黄コア）が唯一の暖色アクセントで、周囲ににじむブルームを必ず付ける。被弾時は全身が一瞬フラットな白へ（エンジンの `hit` フラッシュに対応）。
- **接地**: 全アセット **底辺中央（足元）アンカー**。`drawSheet` の `ax:0.5, ay:1` 基準。アートは当たり判定枠より大きく描いてよい（オーバーフロー可）。影はキャラPNGに描かない（エンジンが別途処理）。
- **形式**: 透過PNG。アニメは**横ストリップ（等間隔・全コマ同寸・1行）**。各animごとに1枚。命名は `assets/<entity>_<anim>.png`。
- **当たり判定（コード不変・ワールド座標）**: met 22×18 / walker 22×22 / flyer 20×16 / turret 24×26 / boss 36×46。オンスクリーンは×4。
- **配色トークン（敵ボス共通パレット）**

| 用途 | HEX | メモ |
|---|---|---|
| 鋼・ダーク鉄 | `#2a3146` / `#3a4564` | 装甲のベース陰影 |
| 鋼・ハイライト | `#7c8ab2` / `#aeb9d8` | エッジ反射（寒色寄り） |
| 深紅（敵/ボス装甲） | `#9c1f15` / `#d63a2a` | ボス主装甲・met外殻赤 |
| 深紅ハイ/リム | `#ff6a4a` / `#ff8a66` | リム反射 |
| 赤コア発光 | `#ff2a1a`→`#ffae6a`グラデ | met/walker/flyer/turret の眼・コア |
| 黄コア発光（ボス） | `#ffe27a`→`#ff9a3c`→白芯 | ボス胸コア・角の専用色 |
| シアン発光（敵タレット弾源） | `#5ad1ff` | 主人公色との対比 |
| 黒締め（リム） | `#0a0612`（紫みの黒） | 純黒禁止 |

---

## 1. met — 装甲ドーム（地上据置／隠れ→展開）

- **目的**: 主人公の象徴オマージュ的な「閉じると無敵・開くと攻撃」のドーム型雑魚。エンジンでは `phase:'hide'`（隠れ＝無敵、通常弾を弾く）/`'open'`（展開して赤コア露出・3方向に黄弾扇射）。
- **サイズ**: フレーム **96×96**（小型枠）。当たり判定 22×18。キャラは枠下〜中央に、ドーム底辺を枠下端付近へ。
- **視覚ブリーフ**: 半球の重装甲ドーム。`hide`は厚い深紅×鋼のシェルが地面に伏せ、継ぎ目から赤い光が**わずかに漏れる**だけ（威圧の予兆）。`open`は前面ハッチが上方へ割れて開き、内部の**赤い単眼コア**と左右の小砲口が露出、コアからブルームが溢れる。質感は鋳造金属＋擦れ・リベット。シルエットは「閉=なめらかな半球」「開=口を開けた装甲頭」で一目で状態が読める。

### anim
| anim | コマ | fps | ファイル名 | 内容 |
|---|---|---|---|---|
| hide | 4 | 6 | `assets/met_hide.png` | 閉じドームの微呼吸＋継ぎ目の赤がゆっくり明滅 |
| open | 6 | 10 | `assets/met_open.png` | 1-2:ハッチ割れ開始 → 3-4:全開＋コア最大発光（撃つ瞬間） → 5-6:閉じ戻り |

> エンジン対応: `e.phase==='hide'`→`met_hide`、`'open'`→`met_open`。`open`の発射は内部timer16フレーム目（=open3コマ目あたり）にコア最大が来るよう作画。

**EN prompt (hide)**: *Painterly 2D game sprite, NOT pixel art, smooth anti-aliased rendering. A heavy armored dome turret enemy, crimson-and-steel cast metal half-sphere closed shut, resting on the ground, riveted plating with worn scratches, thin red light leaking faintly from the seams, cool cyan-blue neon rim light from upper-left, deep purple-black edge lining (not pure black), subtle ambient bloom, horizontal sprite strip of 4 frames of slow idle breathing with pulsing seam glow, transparent background, no cast shadow, bottom-center grounded, Ori / Hollow Knight illustrated style.*

**EN prompt (open)**: *Same crimson-steel armored dome enemy now OPEN: front hatch split and hinged upward revealing a glowing red single-eye core and two small barrel ports, intense red core bloom spilling out, hot orange-red gradient glow (#ff2a1a to #ffae6a), molten light reflecting on inner steel, painterly 2D not pixel art, smooth rendering, cool neon rim light, deep purple-black lining, horizontal strip of 6 frames: hatch cracking open, fully open with peak core flare (firing moment), closing back, transparent background, no shadow, Hollow Knight / Dead Cells painterly style.*

---

## 2. walker — 二脚巡回ロボ

- **目的**: 床端・壁で反転しながら巡回する歩行雑魚（`patrol`）。接触ダメージのみ（飛び道具なし）。
- **サイズ**: フレーム **128×128**。当たり判定 22×22。二脚の足裏を枠下端付近、本体は中央。
- **視覚ブリーフ**: ずんぐりした装甲ボディ＋逆関節の二脚。深紅の胸甲＋鋼の関節、頭頂に短いアンテナ。**横長の単眼バイザー**が赤く光り、歩行に合わせて視線がわずかに揺れる。質感は艶消し塗装の金属、関節にオイル汚れ、足裏に都市の照り返し。シルエットは「丸い胴＋細い逆関節脚」で機敏さより重さを感じさせる。進行方向に体をわずかに傾ける。

### anim
| anim | コマ | fps | ファイル名 | 内容 |
|---|---|---|---|---|
| walk | 6 | 12 | `assets/walker_walk.png` | 二脚の交互ステップ1周期。胴は上下に軽くバウンド、アンテナが遅れて揺れる、眼の明滅微変化 |

> dir反転はエンジンが左右フリップ（`drawSheet`が`dir<0`で水平反転）。**作画は右向き(dir>0)基準**で統一。これは全敵共通。

**EN prompt**: *Painterly 2D game sprite, NOT pixel art, smooth anti-aliased. A stocky bipedal patrol robot, crimson matte-painted armored torso with steel reverse-jointed legs, short antenna on top, a wide horizontal red glowing eye-visor, oily worn joints, neon city reflections on its feet, cool cyan-blue key light from upper-left, warm red eye bloom as the only warm accent, deep purple-black rim lining (not pure black), facing right, horizontal sprite strip of 6 walk-cycle frames with alternating steps and slight body bob and trailing antenna sway, transparent background, no cast shadow, bottom-center grounded, Ori / Dead Cells illustrated style.*

---

## 3. flyer — 赤眼の浮遊ドローン

- **目的**: 画面右から左へ流れ、sin波で上下する浮遊ドローン（HP1の軽量機）。接触ダメージのみ。
- **サイズ**: フレーム **96×96**（小型枠）。当たり判定 20×16。本体中央＝飛行体なので「足元アンカー」は機体下端を枠下寄りに置く（接地はしないが座標基準は底辺中央）。
- **視覚ブリーフ**: 涙滴〜レンズ型のコンパクトな機体。中央に**大きな赤い単眼レンズ**（被写界の光彩リング付き）、上部に小型ローター（残像ブラー）または左右に短い推進翼、底部にシアンではなく**赤い推進グロー**の小ノズル。質感は滑らかな塗装金属＋ガラスレンズの反射。常時わずかに前傾し、警戒灯が点滅。シルエットは小さく俊敏、「赤い目玉が飛んでくる」読みやすさ重視。

### anim
| anim | コマ | fps | ファイル名 | 内容 |
|---|---|---|---|---|
| fly | 4 | 14 | `assets/flyer_fly.png` | ローター/翼のブレ2状態＋眼の光彩リング呼吸＋推進グローのちらつき。ループでホバー感 |

> エンジンは`flyer`に常に`fly`を渡す（`drawEnemy`参照）。上下動はコード側のsinで付くので、**作画では機体姿勢を水平基準**にしてホバー微動だけ。

**EN prompt**: *Painterly 2D game sprite, NOT pixel art, smooth anti-aliased rendering. A compact teardrop hovering surveillance drone, smooth painted metal shell with a single large glowing red eye-lens in the center, iris light-ring, small blurred top rotor and short side thruster fins, a red propulsion glow nozzle underneath, glassy lens reflections, cool cyan-blue neon ambient, warm red eye and thruster as the only warm accents, deep purple-black rim lining (not pure black), slight forward tilt, horizontal sprite strip of 4 hover frames with rotor blur and pulsing eye-ring, transparent background, no cast shadow, bottom-center anchored, Ori / Hollow Knight painterly style.*

---

## 4. turret — 固定砲台

- **目的**: 地面/足場に据え置き、視界内で主人公へ照準しシアン弾を撃つ（`idle`待機→`fire`発砲）。HP3で雑魚最硬。
- **サイズ**: フレーム **128×128**。当たり判定 24×26（縦長）。重い基部を枠下端、砲塔を中央上。
- **視覚ブリーフ**: 床に**ボルト固定された台形の重基部**＋回転する砲塔。砲塔前面に装甲シャッターと**単一の主砲口**。エンジンでは砲口が主人公方向（左右）を向く＝作画は右向き砲身基準でフリップ運用。`idle`はセンサーが赤く周回スキャン、`fire`は砲口に**シアン白のマズルフラッシュ**＋反動で砲身が後退。基部にケーブルと冷却フィン、都市光の照り返し。質感は重工業の鋳鉄＋塗装剥げ。

### anim
| anim | コマ | fps | ファイル名 | 内容 |
|---|---|---|---|---|
| idle | 4 | 6 | `assets/turret_idle.png` | 砲身わずかに上下スキャン、センサー赤の周回明滅、冷却フィンの蒸気ゆらぎ |
| fire | 4 | 16 | `assets/turret_fire.png` | 1:チャージ集光 → 2:シアン白マズル最大（発砲） → 3-4:砲身後退→復帰 |

> エンジン対応: `drawEnemy`は現状turretに`idle`しか渡さないため、**発砲演出はマズルFX側（FX担当）で重ねる前提**でも成立する。ただし`turret_fire`を用意しておけば、Codex側で発砲timerに合わせ`fire`へ差し替え可能（受け入れ後に有効化）。発砲は内部timer90周期・1発のタイミングで2コマ目が来るよう作画。

**EN prompt (idle)**: *Painterly 2D game sprite, NOT pixel art, smooth anti-aliased. A heavy bolted-down floor turret, trapezoidal cast-iron base with cables and cooling fins, a rotating armored turret head with a single main cannon barrel facing right, a scanning red sensor light, chipped industrial paint, neon city reflections, cool cyan-blue key light, warm red sensor as the only warm accent, deep purple-black rim lining (not pure black), horizontal strip of 4 idle frames with subtle barrel scan and pulsing sensor, transparent background, no cast shadow, bottom-center grounded, Dead Cells / Hollow Knight painterly style.*

**EN prompt (fire)**: *Same heavy floor turret FIRING: cyan-white muzzle flash bursting from the cannon, barrel recoiling backward, bright cyan bloom (#5ad1ff) lighting the surrounding plating, hot energy charge in frame one then peak flash, smoke wisp, painterly 2D not pixel art, smooth rendering, cool neon ambient, deep purple-black lining, barrel facing right, horizontal strip of 4 frames (charge, peak muzzle flash, recoil, return), transparent background, no shadow, painterly industrial style.*

---

## 5. BOSS — 深紅×鋼の大型戦闘ロボ

- **目的**: ステージ唯一のボス。HP30。エンジン状態: `intro`（着地/起動演出90f）→`think`（待機）→`jump`（2連ジャンプ突進）/`shoot`（チャージ→拡散5方向×3バースト）/`dash`（横突進）→`death`（多段爆散）。被弾で全身白フラッシュ。
- **サイズ**: フレーム **512×512**、キャラ身長 ~360px。当たり判定 36×46（→オンスクリーン144×184）。アームキャノンや角はオーバーフローで枠いっぱいに。足裏を枠下端付近、コアを胸中央。
- **視覚ブリーフ**: 深紅の重装甲＋鋼の関節骨格の大型戦闘ロボ。頭部に**鋭い角**と二つの赤い眼、胸中央に大きな**黄発光コア**（六角フレーム内・白芯＋黄→橙グラデ、強いブルームと放射状の光条）。右腕は巨大な**アームキャノン**（多砲身/エネルギーリング）、左腕は装甲ガントレット。肩・膝に角ばった装甲、各所のパネルラインから黄/赤の発光が漏れる。被弾発光は装甲の縁が一瞬オーバーロードして白熱。シルエットは「角＋広い肩＋片腕が巨大」で遠目でもボスと分かる威圧感。質感はヘビーデューティな塗装金属、焼け・煤・擦過、コア周辺だけ高温で発光。**威圧感＞可愛さ**、読みやすい大シルエット最優先。

### anim（512×512・全コマ同寸・横ストリップ）
| anim | コマ | fps | ファイル名 | エンジン状態 | 内容 |
|---|---|---|---|---|---|
| idle | 6 | 8 | `assets/boss_idle.png` | think / intro | 重い呼吸でコアが脈動、装甲がわずかに上下、眼と角の明滅。intro時は最初の数コマを起動点灯として流用可 |
| jump | 5 | 12 | `assets/boss_jump.png` | jump | 1:沈み込み(アンティシペーション) → 2-3:跳躍上昇(脚を畳む) → 4:頂点 → 5:落下/着地構え。2連ジャンプにループ適用 |
| shoot | 7 | 14 | `assets/boss_shoot.png` | shoot | 1-3:アームキャノンにエネルギー充填（リング点灯・コア増光・引き構え） → 4:発射閃光（拡散弾の起点・最大ブルーム） → 5-7:反動→リカバリ。3バースト(timer18/38/58)に合わせ4コマ目が撃発に来るループ |
| dash | 5 | 16 | `assets/boss_dash.png` | dash | 前傾の高速突進。1:踏み込み → 2-4:疾走（残像/モーションブラー、コアが尾を引く）→ 5:制動。横移動の勢いを強調 |
| death | 8 | 12 | `assets/boss_death.png` | death/dead | 多段爆散: 1-2:硬直して各所から閃光噴出 → 3-5:装甲が部分崩落＋連鎖爆発 → 6-7:コア暴走で過露光 → 8:崩れ落ち残骸。エンジンは`deadT`で爆発パーティクルを重ねるので、本体は「崩壊していく姿」を描く |

> エンジン対応（`drawBoss`の`_bs`マップ）: `shoot`→`boss_shoot` / `dash`→**`run`** / `jump`→`boss_jump` / その他→`idle`。**dashのファイル名は`boss_dash.png`だが、ASSETS登録時のanim名は`run`**にすること（`drawSheet`が`run`を引くため）。`death`はコード側が現状`idle`系を引かない（dead時returnで非描画＋パーティクル）ので、`boss_death`を有効化するには受け入れ後にCodexが`drawBoss`へdead時の`drawSheet('boss','death',...)`を一行追加する（当たり判定・ロジックは不変）。

**EN prompt (idle / master sheet — この1枚で全体の質感・色・ライティングを確定)**: *Painterly 2D boss sprite, NOT pixel art, smooth high-detail anti-aliased rendering, 512x512 frames. A massive crimson-and-steel heavy battle robot, towering and intimidating, sharp horns and two glowing red eyes on the head, a large hexagonal-framed YELLOW glowing energy core in the center chest (white-hot center fading yellow #ffe27a to orange #ff9a3c) with strong radial bloom and light shafts, a huge multi-barrel arm-cannon on the right arm with glowing energy rings, an armored gauntlet on the left, angular shoulder and knee armor, panel-line cracks leaking yellow and red light, heavy-duty painted metal with soot, burn marks and scratches, cool cyan-blue neon city key light from upper-left, the yellow core as the dominant warm accent, deep purple-black rim lining (not pure black), readable powerful silhouette (horns + broad shoulders + oversized cannon arm), facing right, horizontal sprite strip of 6 idle frames with heavy breathing core pulse and slight armor bob, transparent background, no cast shadow, bottom-center grounded, Ori / Hollow Knight / Dead Cells cinematic painterly style.*

**EN prompt (shoot)**: *Same crimson-steel boss CHARGING then FIRING its arm-cannon: frames 1-3 energy rings light up and the yellow chest core swells, pulling back into a firing stance; frame 4 a massive white-yellow muzzle blast erupts (origin of a spreading 5-way shot) with peak bloom and radial flare; frames 5-7 recoil and recovery, smoke and ember trails; painterly 2D not pixel art, smooth high-detail rendering, cool neon ambient, intense warm core glow, deep purple-black lining, 512x512, facing right, horizontal strip of 7 frames, transparent background, no shadow, cinematic painterly boss style.*

**EN prompt (jump)**: *Same crimson-steel boss JUMPING: frame 1 deep crouch anticipation with core compressing brighter, frames 2-3 explosive leap upward with legs tucking and armor plates flaring light, frame 4 apex, frame 5 falling/landing stance with cannon arm braced; painterly 2D not pixel art, smooth rendering, cool neon key light, glowing yellow core trail, deep purple-black rim lining, 512x512, facing right, horizontal strip of 5 frames, transparent background, no cast shadow, intimidating cinematic painterly style.*

**EN prompt (dash → file boss_dash.png, anim name "run")**: *Same crimson-steel boss DASHING forward at high speed, low aggressive forward lean, frame 1 explosive push-off, frames 2-4 full-speed charge with motion-blur streaks and the yellow core dragging a comet-like light trail, frame 5 hard braking skid; painterly 2D not pixel art, smooth high-detail rendering, cool neon city light, intense warm core streak, deep purple-black lining, 512x512, facing right, horizontal strip of 5 frames, transparent background, no shadow, dynamic cinematic painterly style.*

**EN prompt (death — multi-stage explosion)**: *Same crimson-steel boss being DESTROYED in a multi-stage explosion: frames 1-2 the robot freezes as light bursts erupt from every panel seam, frames 3-5 armor plates blow off with chained internal explosions and flying debris, frames 6-7 the yellow core overloads into blinding overexposure, frame 8 collapsing into a smoking wreck; painterly 2D not pixel art, smooth high-detail rendering, hot orange-yellow explosion light overwhelming the cool ambient, deep purple-black lining, 512x512, facing right, horizontal strip of 8 frames, transparent background, no cast shadow, cinematic painterly destruction sequence.*

---

## 6. 受け入れチェック（敵ボス担当）

- [ ] 全アセットが**右向き(dir>0)基準**で作画されている（エンジンが左右フリップ）。
- [ ] 横ストリップが**等間隔・全コマ同寸**（`drawSheet`は `fw×fh` 等割りで切り出す）。
- [ ] met: `hide`は閉=なめらか半球で**通常弾を弾く無敵感**、`open`の発射コマでコア最大発光。
- [ ] boss: dashの**anim名は`run`**で登録（ファイル名は`boss_dash.png`可）。`shoot`の撃発コマ(4)がエンジンtimer18/38/58と視覚的に一致。
- [ ] 全アセットで**同一のライティング/色設計/タッチ**（マスターシート＝boss_idleを基準に色味を合わせる）。
- [ ] 透過PNG・影なし・底辺中央アンカー・painterly（**ピクセルアートでない**）。
- [ ] ASSETS登録例（Codex運用）: 各entityに `fw,fh,scale,ax:0.5,ay:1` と各animの `src/frames/fps` を記述。scaleは「当たり判定枠に対しアートが自然な大きさに見える」値を実機（`node tools/shot.js`/`spritecheck.js`）で調整。

### ASSETS登録テンプレ（参考・Codexが index.html の `ASSETS` に追記）
```js
met:   { fw:96, fh:96, scale:0.30, ax:0.5, ay:1, anims:{
  hide:{src:'assets/met_hide.png',frames:4,fps:6},
  open:{src:'assets/met_open.png',frames:6,fps:10} }},
walker:{ fw:128,fh:128,scale:0.26, ax:0.5, ay:1, anims:{
  walk:{src:'assets/walker_walk.png',frames:6,fps:12} }},
flyer: { fw:96, fh:96, scale:0.30, ax:0.5, ay:1, anims:{
  fly:{src:'assets/flyer_fly.png',frames:4,fps:14} }},
turret:{ fw:128,fh:128,scale:0.28, ax:0.5, ay:1, anims:{
  idle:{src:'assets/turret_idle.png',frames:4,fps:6},
  fire:{src:'assets/turret_fire.png',frames:4,fps:16} }},
boss:  { fw:512,fh:512,scale:0.40, ax:0.5, ay:1, anims:{
  idle :{src:'assets/boss_idle.png', frames:6,fps:8},
  jump :{src:'assets/boss_jump.png', frames:5,fps:12},
  shoot:{src:'assets/boss_shoot.png',frames:7,fps:14},
  run  :{src:'assets/boss_dash.png', frames:5,fps:16},   // dash は anim名 run で登録
  death:{src:'assets/boss_death.png',frames:8,fps:12} }},
```
> ※ `scale` は当たり判定不変のまま見た目だけ調整する値。上表は初期目安で、`tools/shot.js`・`tools/spritecheck.js`の目視で最終調整する。

---

I have everything I need: the engine constants (W=480/H=270, GROUND_Y=216, LEVEL_W=2800, ROOM_X=2320, RENDER_SCALE=4 target), the parallax speeds already in code (far 0.08-0.15, mid 0.25, near 0.5), the solid platform layout, and the established color identity. Now I'll write the environment design section.

# 環境担当セクション — ステージ環境の高精細2D設計

> 共通コア準拠：painterly 2D（**not pixel art**）／アンチエイリアスあり・nearest不使用／内部1920×1080（ワールド480×270 × RENDER_SCALE 4）。当たり判定・物理・`solids`座標は**据え置き**。本セクションは「描画レイヤーの差し替え」のみを定義する。
> 世界観：ネオン夜の工業都市。コバルト機体のシアン発光と、深紅ボスの黄発光に呼応する**寒色ベース＋紫マゼンタの大気＋琥珀の窓灯**で統一。

---

## 0. 環境パレット（全環境アセット共有・確定）

`index.html` の既存色から逆算した「塗り版マスター」。全PNGはこの範囲内で塗る（キャラのコバルト/シアン/黄と衝突しないよう、地形・背景は**彩度を落とした寒色＋紫**に寄せる）。

| 役割 | 基準色 | 用途 |
|---|---|---|
| 夜空・最暗部 | `#05060c → #0a0e2c` | bg_far 上空グラデ起点 |
| 夜空・中間 | `#231a4a / #3a2160` | bg_far 中天〜地平のマゼンタ大気 |
| 地平グロー | `#522a66`（紫） | 地平線の発光にじみ |
| 遠景ビル | `#0d1030 / #191c40` | シルエット |
| 窓灯（寒） | `#46579c` | 遠景の冷たい窓 |
| 窓灯（暖） | `#ffcf6b / #ffd23f` | 中近景の生活灯・看板 |
| 地面コンクリ | `#2a3358`（明 `#4a5a96` / 影 `#171c34`） | 地面テクスチャ本体 |
| 金属パネル | `#39477a / #5a6aa8` | 足場・縁の金属 |
| ネオン縁（シアン） | `#5ad1ff`（コア `#bfe6ff`） | 足場・縁の発光ライン（自機色と共鳴） |
| ネオン縁（マゼンタ） | `#ff4fa0`（アクセント） | 看板・一部プロップ（差し色） |
| 警告/赤 | `#ff3b3b / #ff7a4a` | 危険プロップ・バレル |
| 霧・大気 | `rgba(120,80,160,a)` 〜 `rgba(90,140,255,a)` | 各層に薄く重ねる体積光 |

ライティング基準：**キーライト＝右上の月（寒色）＋下方からのネオン地明かり（シアン/マゼンタ）**。全アセットでハイライトは上面・左上、コアシャドウは下面・接地側。

---

## (a) 地形 — シームレス地面テクスチャ ＋ 上縁エッジ ＋ 浮き足場モジュール

16pxタイル格子は**廃止**。「①地面テクスチャ（横タイル）」「②上縁エッジオーバーレイ」「③浮き足場モジュール（複数幅）」の3要素を塗りで構成し、エンジン側で既存 `solids` 矩形にマッピングする。

### A-1. 地面テクスチャ（横シームレス・縦は固定高さ）

- **目的**：`GROUND_Y=216` から下54px（×4=216px）の地面塊。横に無限タイル。汚れ・パネル継ぎ目・経年で「面」を作る。
- **サイズ**：`512×256`（タイル単位。左右端がシームレスに連結すること）。
- **ファイル名**：`ground_tex.png`
- **視覚ブリーフ**：濡れたコンクリート＋鋼板パネルのハイブリッド舗装。上1/4は明るめ（地明かりの照り返し）、下へ向かって `#171c34` まで沈む。横方向に大小2スケールのパネル目地、油染み、細かなクラック。**繰り返し感を消すため**、汚れ・ハイライトは非周期に散らす（タイル境界だけは厳密にシームレス）。
- **English prompt**：
  `painterly 2D game ground texture, horizontally seamless tileable strip 512x256, wet industrial concrete and riveted steel deck, top quarter catches cool neon ground-glow (#4a5a96) fading down to deep navy #171c34, subtle panel seams, oil stains, hairline cracks, non-repeating grime scattered, soft ambient occlusion, no outline grid, smooth anti-aliased rendering, dark cyberpunk night palette, not pixel art, transparent below ground line`

### A-2. 上縁エッジオーバーレイ（地面・足場の天面ライン）

- **目的**：地面/足場の**上辺**に乗せる発光リップ。当たり判定の天面（着地面）を視覚的に明示し、ネオン都市感を出す。地面テクスチャや足場の上に最前で重ねる。
- **サイズ**：`512×32`（横シームレス。上12pxが発光、下が金属見切り）。
- **ファイル名**：`ground_edge.png`
- **視覚ブリーフ**：金属見切り材＋シアンのネオンチューブ（`#5ad1ff`コア＋`#bfe6ff`ホット芯）が走り、直下のコンクリへ淡くにじむ（bloom）。所々にビス・欠け・サビ。発光は**等間隔の点ではなく連続ライン**で、ところどころ途切れて経年を出す。
- **English prompt**：
  `painterly 2D seamless edge overlay 512x32, metal nosing strip with embedded cyan neon tube (#5ad1ff core, #bfe6ff hot center) running along top, soft glow bleeding downward onto concrete, occasional rust spots and chipped paint, bolts, horizontally tileable, smooth anti-aliased, transparent background, cyberpunk night, not pixel art`

### A-3. 浮き足場モジュール（複数幅・透過）

既存 `solids` の足場は **幅70/80/90/段差70×32** の4系統。これを3つの幅モジュール＋段差ブロックでカバーする（エンジンは幅に応じて選択・必要なら端部だけ別パーツで合成）。

| モジュール | 対応solid幅 | 推奨制作サイズ | ファイル名 |
|---|---|---|---|
| 小 | 70px | `280×80`（=70×4 ×幅余白） | `platform_s.png` |
| 中 | 80px | `320×80` | `platform_m.png` |
| 大 | 90px | `360×80` | `platform_l.png` |
| 段差ブロック | 70×32（`S(2240,184,70,32)`） | `platform_step.png` 280×160 | `platform_step.png` |

- **共通視覚ブリーフ**：浮遊する鋼鉄デッキ。**天面＝A-2と同じシアンネオン見切り**、側面＝リベット留め金属パネル（`#39477a`／ハイライト`#5a6aa8`）、底面＝小型スラスター/排気グリルがほのかにシアン発光（浮遊感）。左右端は被弾跡・ボルト留めで「切り取られた工業部材」に見せる。影は描かない（キャラ素材同様、ゲーム側で落とす）。当たり判定（厚み14px）より**下に厚く**描いてよい（オーバーフロー可、底面装甲をはみ出させて重量感を出す）。
- **段差ブロック**：地面に半埋まりする一段高い鋼塊。天面ネオン＋正面に注意ストライプ（黄黒、`#ffd23f`/`#1a1a1a`）を1本。
- **English prompt（platform 共通／幅だけ変える）**：
  `painterly 2D floating steel platform, top deck lined with cyan neon nosing (#5ad1ff), riveted side armor panels in cool steel-blue (#39477a highlight #5a6aa8), underside vents glowing faint cyan suggesting hover thrusters, battle-worn chipped edges and bolts, three-quarter top-down lighting from upper right cool moon plus under-glow, [WIDTH 70/80/90] world px usable top surface, drawn larger than collision box, no cast shadow, transparent background, smooth anti-aliased, cyberpunk industrial night, not pixel art`
- **English prompt（platform_step 追加要素）**：`...short raised steel block half-embedded in ground, front face carries a single yellow-black hazard stripe (#ffd23f / #1a1a1a), top deck neon-lit, 70x32 world collision...`

---

## (b) 3層パララックス背景（各1920×1080・横シームレス）

既存コードは far/mid/near を `camX*0.08〜0.15 / 0.25 / 0.5` で動かしている。**指示の視差速度（far 0.15 / mid 0.4 / near 0.7）に統一**し、画像3枚に置換する。各層は横シームレス（`camX` が増えても継ぎ目が出ない＝幅1920を `% 1920` でラップ描画）。**1920幅が画面より広いので、各層は最低2枚分タイルして描く**実装にする。

### B-1. bg_far — 夜空＋月＋遠景スカイライン

- **視差**：0.15／最奥。**ほぼ不動の天体・大気**。
- **サイズ**：`1920×1080` 横シームレス。
- **ファイル名**：`bg_far.png`
- **視覚ブリーフ**：上から `#05060c→#231a4a→#3a2160→#522a66` のグラデ夜空。右上に**大きな寒色の月**（`#fdf6e3` 表面、クレーター、淡いハロー）。下40%に**最遠のスカイライン**を紫シルエット（`#0d1030`）で薄く、所々に冷たい窓灯（`#46579c`）と航空障害灯の赤点。星は微小グレイン。地平に紫グロー（`#522a66`）のにじみ。**全体に霧をかけて遠近を後退**させる。月は横ラップ時に重複しないよう中央寄りやや右に1つだけ。
- **English prompt**：
  `painterly 2D parallax background, far layer 1920x1080 horizontally seamless, deep night sky vertical gradient #05060c to #231a4a to #3a2160 to #522a66, large cool ivory moon upper-right with craters and soft halo, distant cyberpunk skyline silhouette in dark violet #0d1030 across lower 40%, sparse cold window lights #46579c and tiny red aircraft beacons, faint purple horizon glow, atmospheric haze receding depth, subtle star grain, smooth anti-aliased painterly render, not pixel art, single moon centered-right to avoid wrap duplication`

### B-2. bg_mid — 中景ビル群＋窓灯

- **視差**：0.4／中層。
- **サイズ**：`1920×1080` 横シームレス。
- **ファイル名**：`bg_mid.png`
- **視覚ブリーフ**：画面下〜中段を埋める**密集した中景ビル群**（`#191c40` 本体、上端`#2a3160`の照り）。高さ・幅を非周期に変え、窓は**寒色`#46579c`＋ところどころ暖色`#ffcf6b`**を散らして生活感。屋上に小さなアンテナ・給水タンクのシルエット。ビル間に縦の**ネオン看板（マゼンタ`#ff4fa0`／シアン`#5ad1ff`）**を2〜3本、淡くにじませる。層全体に薄い青紫の霧。上端はbg_farへ自然に溶けるよう霞ませる。
- **English prompt**：
  `painterly 2D parallax mid layer 1920x1080 horizontally seamless, dense midground cyberpunk building cluster in #191c40 with #2a3160 rim light, non-repeating heights and widths, windows mostly cold #46579c with scattered warm #ffcf6b lights, rooftop antennas and water tanks silhouettes, two-three vertical neon signs glowing magenta #ff4fa0 and cyan #5ad1ff with soft bloom, thin blue-violet atmospheric fog, top edge fading to haze, smooth anti-aliased painterly, transparent sky area, not pixel art`

### B-3. bg_near — 近景の屋上／ダクト／看板

- **視差**：0.7／最前の背景（地形より奥）。
- **サイズ**：`1920×1080` 横シームレス（下端は地面に隠れる前提で濃く）。
- **ファイル名**：`bg_near.png`
- **視覚ブリーフ**：**手前の屋上構造物**。大型ダクト、室外機、鉄骨、垂れ下がるケーブル、大きな**ネオン看板（壊れて点滅しそうな質感）**を画面端に。色は最も濃く`#0a0e1a〜#141838`、エッジに弱いリムライト（シアン/マゼンタ）。**画面下端1/4は地面の裏に隠れる**ため真っ黒寄りでよい。手前ほど霧は薄く、ネオン反射のにじみと埃の光粒を効かせる。
- **English prompt**：
  `painterly 2D parallax near layer 1920x1080 horizontally seamless, foreground rooftop clutter, large industrial ducts and AC units, steel beams, dangling cables, a big weathered neon sign at frame edge, darkest values #0a0e1a to #141838, faint cyan/magenta rim light on edges, neon reflection bleed and floating dust motes, lower quarter near-black to sit behind ground, light atmospheric haze, smooth anti-aliased painterly, not pixel art`

---

## (c) プロップ（透過PNG・128px前後・ステージ装飾）

地形の上やビル屋上に置く小物。**当たり判定なし**（純装飾）か、必要なら既存 `S()` で薄い足場として流用可。全て**同一ライティング（右上キー＋下ネオン）**・接地は底辺中央。

| プロップ | サイズ | ファイル名 | 視覚ブリーフ |
|---|---|---|---|
| crate（木箱/鋼箱） | `128×128` | `prop_crate.png` | 補給用の角型コンテナ。金属枠＋面パネル、角に被弾痕、側面にシアンのステンシル番号と小さな黄ストライプ。上面に薄ハイライト。 |
| sign（看板） | `160×128` | `prop_sign.png` | 縦長ネオン看板。漢字風/記号のネオン管（マゼンタ`#ff4fa0`）が点灯、支柱は錆びた鋼、背板に光のにじみ。下に小さなスピーカー。 |
| pipe（配管） | `128×160` | `prop_pipe.png` | 太い縦＋横の金属配管とバルブ。継ぎ目から微かな蒸気、表面に結露ハイライトと油汚れ、所々シアンのインジケータ灯。 |
| antenna（アンテナ） | `96×160` | `prop_antenna.png` | 屋上の通信アンテナ塔。細い鉄骨トラス、先端に赤い航空灯（`#ff3b3b`点滅想定）、張線、根元にケーブル束。 |
| barrel（ドラム缶） | `96×128` | `prop_barrel.png` | 危険物ドラム缶。深紅`#d63a2a`の胴＋黄黒ハザードストライプ、上面にリブ、表面のへこみと錆、足元にこぼれの暗いシミ。差し色の警告。 |
| duct（ダクト） | `160×96` | `prop_duct.png` | 横長の角型空調ダクト＋ルーバー。蛇腹継ぎ目、フランジのボルト、内側からこぼれる弱いシアン光、上面に埃。地面/足場手前に半重ねで置ける構図。 |

- **共通English prompt 接頭**：
  `painterly 2D game prop, transparent PNG, ~128px, single object centered, bottom-center grounded, lit from upper-right cool moonlight plus low cyan/magenta neon under-glow, weathered industrial cyberpunk, smooth anti-aliased, no cast shadow, not pixel art —`
- crate：`... rugged supply crate, metal frame with paneled faces, scuffed corners, cyan stencil number and small yellow hazard stripe, top face soft highlight`
- sign：`... tall vertical neon billboard, glowing magenta #ff4fa0 tube glyphs, rusted steel post, faint glow bleed on backplate, small speaker beneath`
- pipe：`... thick vertical and horizontal metal pipework with valves, faint steam from joints, condensation highlights and oil grime, scattered cyan indicator lights`
- antenna：`... rooftop communication antenna lattice tower, thin steel truss, red aircraft beacon at tip #ff3b3b, guy-wires, cable bundle at base`
- barrel：`... hazardous oil drum, crimson body #d63a2a with yellow-black hazard band, ribbed top, dents and rust, dark spill stain at foot`
- duct：`... horizontal rectangular HVAC duct with louver vent, segmented bellows joints, bolted flange, faint cyan light leaking from inside, dust on top, sits half-overlapping ground`

---

## 大気感（霧／光のにじみ／ネオン反射）— 塗りでの作り込み指針

各層・各アセットに共通で効かせる「画面を絵にする」処理。**画像側に焼き込む分**と、**エンジン側で薄い矩形/グラデを重ねて全層共通にかける分**を併用する。

1. **体積霧（層別）**：bg_far最も濃く（後退）、bg_nearは薄く。`rgba(120,80,160,0.02〜0.06)` の青紫を各層上に薄く。エンジンの既存「地平線グロー」ループ（`#522a66`系）はこの方針を踏襲・強化。
2. **ネオンbloom**：シアン/マゼンタの発光部は**コア＋外側にじみ2段**（コア`#bfe6ff`→`#5ad1ff`→透明）。足場縁・看板・窓灯の暖色も同様に1段にじませる。
3. **地明かりの照り返し**：地面テクスチャ上1/4と足場底面に、下方ネオンの**逆光ハイライト**を入れて「光が下からも来る」工業夜景にする。
4. **ネオン水たまり反射（任意・地面）**：地面テクスチャの一部に、上のネオン色を**縦に引き伸ばした淡い反射**を描き、湿った路面感を出す（周期にならない位置に2〜3箇所）。
5. **埃/光粒**：bg_near と手前プロップに微小なフローティングダスト（`rgba(159,232,255,0.15)`程度）を散らす。動かす場合はエンジン側パーティクルで。

---

## エンジン改修メモ（環境レイヤーを画像へ差し替える配線・当たり判定不変）

> 既存の `bg()` 内ベタ描き（夜空グラデ・月・星・ビル2層・地平グロー）と `tile()/drawSolids()` を、画像ロード時のみ画像描画へ差し替える。**未ロード時は現行コード描画にフォールバック**（プロジェクト規約：ゲームは絶対に壊さない）。

- **背景3層**：`ASSETS.bg = { far:{src:'assets/bg_far.png'}, mid:{src:'assets/bg_mid.png'}, near:{src:'assets/bg_near.png'} }` を追加し、`bg()` 冒頭で各層を `drawImage` の横ラップ（`-(camX*spd % 1920)` 起点に画面幅+α 分タイル）で描く。視差は **far 0.15 / mid 0.4 / near 0.7**。3枚とも `ready` のときだけ画像経路、そうでなければ現行ベタ描きを実行。
- **地面/足場**：`drawSolids()` を「①`ground_tex` を横タイルで `solids` 矩形に塗る → ②各 `solids` 上辺に `ground_edge` をタイル → ③足場は幅で `platform_s/m/l/step` を選択描画」に分岐。画像未ロード時は現行 `tile()` を使用。**`solids` の x/y/w/h は一切変更しない**（アートは枠外オーバーフロー可、描画オフセットのみで対応）。
- **プロップ**：装飾用配列 `props=[{img,x,y}]`（ワールド座標、`camX` 減算で描画）を `drawSolids()` 直後に描く新関数 `drawProps()` を追加。当たり判定を持たせたい場合のみ別途 `S()` 追加＆ `harness.js` を更新して24/24維持。
- **検証**：差し替え後は規約どおり `node harness.js`（24/24）→ `node tools/shot.js`（PNG目視で背景・地面・足場の継ぎ目／視差の回帰確認）→ 画像を触ったら `node tools/spritecheck.js`。`__GAME` フックは壊さない。

---

### 環境アセット ファイル名一覧（assets/ 配置）
`ground_tex.png` / `ground_edge.png` / `platform_s.png` / `platform_m.png` / `platform_l.png` / `platform_step.png` / `bg_far.png` / `bg_mid.png` / `bg_near.png` / `prop_crate.png` / `prop_sign.png` / `prop_pipe.png` / `prop_antenna.png` / `prop_barrel.png` / `prop_duct.png`

---

I've confirmed the engine values from `index.html`. Key facts that anchor the FX/UI spec:

- Internal world 480×270, rendered at RENDER_SCALE=4 → on-screen 1920×1080.
- Player bullet hit-box: normal `8×5`, charge `13×13` (`shootP`, line 157). Enemy bullet `7×7` (`shootE`, line 160).
- Charge threshold: `charge>=40` frames fires the big shot (line 218).
- Particle `boom()` spawns 10 radial particles; colors used: `#9fd8ff` (terrain hit), `#ffd23f` (met-guard), `#ff9a3c` (enemy death), `#ff7a00` (boss death).
- Player HP 16 (vertical pip gauge, top-left, line 613). Boss HP 30 (vertical, top-right, line 617). Boss-HP gold-cap `#ffd23f`, player HP cyan `#5ad1ff`/red `#ff5a4a`.
- WARNING text at line 657, TITLE/GAMEOVER/CLEAR at lines 631-646.

Now writing the FX/UI section.

---

# FX / UI 高精細2D設計（弾・エフェクト・UI・画面）

## 共通レンダリング前提（このセクション全体に適用）
- 内部480×270 → **RENDER_SCALE=4 / 1920×1080** で描画。当たり判定・座標・速度・寿命は**現行コードのまま据え置き**、見た目だけ4倍の高精細塗りに差し替える。
- 発光は**加算合成（`globalCompositeOperation='lighter'`）前提**。各発光アセットは「白〜淡色の芯(コア)＋色付きの中間層＋透明に溶けるハロー」の3層構造で、芯が最も明るい。芯は必ず純白寄り（`#ffffff`〜`#eafcff`）にして加算で飛ばす。
- 弾・エフェクトの**実当たり判定は極小**（弾7〜13px相当）。アートはそれより大きくオーバーフローさせ、発光ハローで視認性を作る。アンカーは**中心(0.5, 0.5)**。
- 1作品=1画風（Ori/Hollow Knight寄りの手描き×塗り×大気感）。弾もエフェクトも**painterly 2D, not pixel art**。nearest不使用・アンチエイリアスあり。
- アニメは**横ストリップPNG（等間隔・全コマ同寸・透過）**。連番が必要なものは `name_00.png` 連番でも可。

---

## 1. 弾アセット（透過PNG）

### 1-1. bullet_buster — 自機通常弾（シアン発光弾）
- **目的**: Xタップで出る主力弾。コード当たり判定 8×5px・速度`dir*8`・寿命90f。横長の発光ダーツ。
- **サイズ**: 96×64px（1コマ）。任意で2コマの「発光ゆらぎ」ループ可（192×64ストリップ）。
- **コマ/fps**: 1コマ静止 or 2コマ@12fps（パルス）。
- **ファイル名**: `bullet_buster.png`（またはループ`bullet_buster_strip2.png`）
- **視覚ブリーフ**: 進行方向に伸びる涙滴/ダーツ型のエネルギー弾。芯は白、外殻はシアン(`#5ad1ff`→`#bff0ff`)。後方に2本の細い尾を引き、先端は鋭く明るい。輪郭線は描かず、光の締まりで形を出す。コード描画(`#aef0ff`/`#7fd8ff`)のトーンを継承。**進行方向＝右基準で描き、左向きはエンジン側で水平反転**。
- **英語プロンプト**:
> Painterly 2D game projectile sprite, a small horizontal cyan energy dart shaped like a teardrop, brilliant white-hot core fading to cyan (#5ad1ff to #bff0ff) outer glow, two thin trailing light streaks behind it, sharp bright tip pointing right, additive glow rendering, soft anti-aliased edges, no black outline, transparent background, painterly not pixel art, Ori / Hollow Knight lighting mood, 96x64, centered.

### 1-2. bullet_charge — 自機チャージ弾（大型エネルギー球＋火花）
- **目的**: Xを40f以上溜めて離すと発射する貫通大型弾。当たり判定 13×13px・速度`dir*6.5`・dmg3・貫通。
- **サイズ**: 192×192px（1コマ）。**回転/脈動4コマ推奨**（768×192ストリップ）。
- **コマ/fps**: 4コマ@16fps ループ（球の表面が渦巻き、火花が回る）。
- **ファイル名**: `bullet_charge_strip4.png`
- **視覚ブリーフ**: 白熱コアを持つ青シアンのプラズマ球。表面に旋回するエネルギーの渦、周囲に**散る火花/電光のスパーク**を数本。外周は淡いシアンのハローが球より大きく滲む。進行方向側にわずかに伸びる衝撃波の前縁。コード描画3層(`#bff0ff`/`#5ad1ff`/`#fff`)を踏襲し、それを高精細化。
- **英語プロンプト**:
> Painterly 2D large energy orb projectile, glowing cyan-blue plasma sphere with a blinding white core, swirling energy surface, several electric sparks and crackling arcs radiating outward, soft oversized cyan halo, faint shockwave leading edge, additive glow, smooth anti-aliased rendering, no outline, transparent background, 4-frame rotating pulse loop on one horizontal strip, painterly not pixel art, 192x192 per frame, centered.

### 1-3. bullet_enemy — 敵弾（赤橙弾）
- **目的**: met/turret/boss が撃つ汎用敵弾。当たり判定 7×7px・寿命300f。コードで色が引数渡し(`#ff5a4a`赤/`#ffd23f`黄/`#5ad1ff`青/`#ff7a00`橙)。
- **サイズ**: 80×80px（1コマ）。脈動2コマ可（160×80ストリップ）。
- **コマ/fps**: 1コマ or 2コマ@12fps。
- **ファイル名**: `bullet_enemy.png`（**白＋淡色のティント可能なグレースケール芯**で作り、エンジンで色を乗算/加算ティント。複数色を1枚で賄う）
- **視覚ブリーフ**: 丸いプラズマ弾。白い芯＋色付きハロー＋短い後光の尾。**色はコード引数を尊重したいので、芯＝白、外周＝ティント可能な明度勾配**にして、`#ff5a4a`(赤橙)を基準色に。turret青弾・met黄弾も同テクスチャを色替えで運用。わずかに不規則な炎ゆらぎを持たせ無機質すぎないように。
- **英語プロンプト**:
> Painterly 2D enemy plasma bullet, round glowing orb with a white-hot center and a warm red-orange (#ff5a4a) halo, short comet-like tail, slightly flickering flame edge, additive glow, smooth anti-aliased, no hard outline, designed as a tintable white-cored sprite so engine can recolor to amber or cyan, transparent background, painterly not pixel art, 80x80, centered.

---

## 2. エフェクト（透過シート / 連番・加算合成前提）

> 共通: すべて**中心アンカー**、芯は白、加算合成。コマは左→右で時間進行。サイズは「枠サイズ／キャラ・弾比で控えめに大きく」。

| アセット | 用途・トリガ | コマ数 | fps | 枠サイズ/コマ | ファイル名 |
|---|---|---|---|---|---|
| muzzle_flash | 発砲の銃口閃光（shootP時、銃口先端に1回） | 4 | 30 | 96×96 | `muzzle_flash_strip4.png` |
| hit_spark | 弾が敵/壁に当たった瞬間（boom代替の小） | 5 | 30 | 96×96 | `hit_spark_strip5.png` |
| explosion | 敵撃破・ボス爆散（boom大／sfx'boom'） | 9 | 24 | 192×192 | `explosion_strip9.png` |
| charge_aura | 自機チャージ中ループ（charge>0で自機に重畳） | 6 | 16 | 128×128 | `charge_aura_strip6.png` |
| landing_dust | 着地時（onGround遷移）足元に1回 | 5 | 24 | 128×96 | `landing_dust_strip5.png` |
| jump_puff | ジャンプ踏切り時（vy=JUMP）足元に1回 | 4 | 24 | 96×80 | `jump_puff_strip4.png` |

### 2-1. muzzle_flash
- **視覚ブリーフ**: バスター発砲の十字／星形シアン閃光。1コマ目が最大・最も白、以降縮小して消える。先端に短い前方ジェット。発光のみ・煙なし。色 `#eafcff`芯→`#5ad1ff`。
- **英語プロンプト**:
> Painterly 2D muzzle flash effect sheet, 4 frames left-to-right, a cyan-white star/cross burst that is largest and whitest on frame 1 then shrinks and fades, short forward jet of light, additive glow, no smoke, transparent background, painterly not pixel art, 96x96 per frame on one horizontal strip, centered.

### 2-2. hit_spark
- **視覚ブリーフ**: 着弾の放射スパーク。白い点から4〜6本の細い火花線が放射状に伸びて散る。被弾色に合わせ**白芯＋ティント可**（敵=橙`#ff9a3c`、壁=青`#9fd8ff`、met防御=黄`#ffd23f`）。
- **英語プロンプト**:
> Painterly 2D impact spark effect sheet, 5 frames, a white point bursting into 4-6 thin radial spark lines that scatter and fade, white core tintable to amber or cyan, additive glow, no debris, transparent background, painterly not pixel art, 96x96 per frame on one horizontal strip, centered.

### 2-3. explosion
- **視覚ブリーフ**: 敵・ボス撃破の球状爆発。コア白熱→橙→赤→暗い煙の縁、外側に飛散する火花リング。中盤コマで最大半径、終盤は煙のリングだけ残して消える。ボス用は同シートを大きめスケールで流用。色 `#fff`→`#ffd23f`→`#ff7a00`→`#d63a2a`。
- **英語プロンプト**:
> Painterly 2D explosion effect sheet, 9 frames left-to-right, spherical blast expanding from a white-hot core through amber and orange to a dark smoke ring, scattering spark particles, peak radius mid-sequence then collapsing to fading smoke, additive-friendly bright core, transparent background, painterly not pixel art, 192x192 per frame on one horizontal strip, centered.

### 2-4. charge_aura
- **視覚ブリーフ**: 自機がチャージ中にまとう吸い込み型のオーラ。外周からコアへ**収束する光の粒子リング**＋下からの電光。charge>=40でループ色が `#9fe6ff`→`#eafcff`に白く強まる演出（コード参照: line 524の色変化に対応、2段階版を作るか1枚を加算強度で表現）。中心は半透明で自機が透けて見えること。
- **英語プロンプト**:
> Painterly 2D charging aura effect, 6-frame seamless loop, a ring of light particles spiraling inward toward the center, faint upward electric arcs, cyan glow intensifying toward white, semi-transparent center so the character shows through, additive glow, transparent background, painterly not pixel art, 128x128 per frame on one horizontal strip, centered, loops cleanly.

### 2-5. landing_dust
- **視覚ブリーフ**: 着地の砂煙。左右に広がる扁平なダスト＋小石。発光なしの実体的な煙（夜の工業都市色＝青灰`#46579c`/`#191c40`にうっすらシアンの縁光）。1コマ目が小、2-3で最大に横展開、後半で薄れる。
- **英語プロンプト**:
> Painterly 2D landing dust effect sheet, 5 frames, a flat puff of dust spreading left and right at ground level with a few small pebbles, cool blue-grey night palette with faint cyan rim light, non-glowing volumetric smoke, expanding then dissipating, transparent background, painterly not pixel art, 128x96 per frame on one horizontal strip, bottom-center anchored.

### 2-6. jump_puff
- **視覚ブリーフ**: ジャンプ踏切りの小さな蹴り煙。足元から下方向に押し出す円弧状のダスト。landing_dustより小さく速い。同じ青灰トーン。
- **英語プロンプト**:
> Painterly 2D jump take-off puff sheet, 4 frames, a small arc of kicked-up dust pushed downward and outward from the feet, cool blue-grey night palette, quick and small, fading fast, transparent background, painterly not pixel art, 96x80 per frame on one horizontal strip, bottom-center anchored.

---

## 3. UI（HUD・ゲージ・アイコン）— SF/ネオン高精細

> 現行コード: 自機HP=左上の縦ピップ16個（line 613-615、満<4で赤`#ff5a4a`/以上シアン`#5ad1ff`、上にゴールド`#ffd23f`帯）。ボスHP=右上縦ピップ30個（橙`#ff7a00`、赤キャップ`#ff3b3b`）。**ピップ数・配置・色ロジックは維持し、フレームと質感だけ高精細化**。

### 3-1. hud_player_hp — 自機HPゲージ
- **目的**: 左上の縦エネルギーセル。16セグメント。
- **サイズ**: フレーム枠 64×256px（4倍基準）。9スライス可能なメタルベゼル＋セグメントは個別点灯。
- **構成**: ①コバルトメタルのベゼル枠（斜めビス・上端にゴールドのアクセントバー＝コード`#ffd23f`帯を継承）②内側に16個の発光セル（点灯=シアン、残量3以下=赤に切替＝コードロジック踏襲）③消灯セルは暗い`#0e1530`の溝。セルは下から積み上がる（コード`maxhp-1-i`）。
- **ファイル名**: `hud_player_frame.png`（枠）＋ `hud_cell_cyan.png` / `hud_cell_red.png` / `hud_cell_off.png`（セル素材、エンジンでHP数だけ描画）。
- **英語プロンプト**:
> Painterly 2D sci-fi HUD health gauge frame, vertical cobalt-blue brushed-metal bezel with small bolts and a glowing gold accent bar at the top, hollow interior sized for 16 stacked energy cells, neon industrial style, clean readable, transparent background, painterly not pixel art, 64x256, plus separate glowing cell tiles in cyan, red and dark-off states.

### 3-2. hud_boss_hp — ボスHPゲージ
- **目的**: 右上の縦ゲージ。30セグメント（コードは細い1.4px幅で30本）。
- **サイズ**: フレーム枠 56×288px。
- **構成**: ①鋼＋深紅のベゼル（ボスのアイデンティティ`#d63a2a`/鋼`#5a6488`）②上端に赤キャップ`#ff3b3b`（コード踏襲）③30本の橙`#ff7a00`発光バー、残量に応じ下から消灯。被弾時に枠が一瞬白フラッシュ（boss.hit連動、エンジンで加算白を重畳）。
- **ファイル名**: `hud_boss_frame.png` ＋ `hud_boss_bar.png`（橙バー素材）。
- **英語プロンプト**:
> Painterly 2D sci-fi boss health gauge frame, tall vertical steel-and-crimson bezel with a red warning cap at the top, hollow interior sized for 30 thin stacked orange energy bars, menacing industrial neon style, transparent background, painterly not pixel art, 56x288, plus a separate glowing orange bar tile.

### 3-3. UIアイコン群
- **目的**: HUD補助・画面下キーガイドの差し替え。
- **サイズ**: 各 64×64px、透過。
- **内訳**: `icon_player_face`（HUD左上、自機チビ顔＝コバルト＋シアンバイザー）/ `icon_boss_skull`（ボスゲージ上、深紅ボスのアイコン）/ `icon_key_z`（ジャンプ）/ `icon_key_x`（ショット）/ `icon_key_enter`（決定）。キーアイコンはネオン縁のメタルキャップ風。
- **英語プロンプト**:
> Painterly 2D game UI icon set on transparent background, 64x64 each: a small cobalt-blue robot face with a cyan glowing visor, a crimson-and-steel boss emblem, and three neon-rimmed metal keycap icons labeled Z, X and ENTER, sci-fi industrial style, crisp and readable, painterly not pixel art.

---

## 4. 画面（タイトル・ゲームオーバー・クリア・ワーニング）

### 4-1. TITLE — ロゴ「COBALT BOLT」
- **目的**: タイトル画面のメインロゴ。現行はテキスト2段（COBALT=シアン`#5ad1ff` / BOLT=ゴールド`#ffd23f`、line 633-634）。これを**金属＋ネオン塗りのロゴ素材**に差し替え。
- **サイズ**: ロゴ素材 1280×512px（透過、FHD画面中央上寄せ）。背景は別途bg()が描く夜空に重畳。
- **視覚ブリーフ**: 2段組み。「COBALT」=磨かれたコバルト鋼にシアンのネオン縁＋内側発光。「BOLT」=ゴールド/真鍮にイエロー発光、稲妻(BOLT)のモチーフを文字に絡める（Oの中やTの縦棒に電光）。金属の反射ハイライト、リベット、わずかな摩耗。下に小さく「SIDE-SCROLLING ACTION」のサブ。**色アイデンティティ厳守（青×金）**。
- **演出方針**: ロゴはゆっくり上下に1〜2pxフロート＋ネオン縁が周期的に明滅（加算）。背景の星・月（bg()）はそのまま。`PRESS ENTER`は点滅（既存ロジック）だが、ネオン管が灯るような明滅テクスチャ素材 `ui_press_enter.png`(512×96) を用意。
- **英語プロンプト（ロゴ）**:
> Painterly 2D game title logo "COBALT BOLT" on two stacked lines, transparent background. Top word COBALT in polished cobalt-steel with a cyan neon outline and inner glow; bottom word BOLT in gold-brass with yellow glow and a lightning-bolt motif weaving through the letters (electric arcs inside the O and along the T). Metallic reflections, rivets, subtle wear, additive neon edges, cinematic industrial sci-fi, painterly not pixel art, 1280x512, centered.

### 4-2. GAME OVER
- **目的**: 死亡オーバーレイ（line 639、暗幕`rgba(5,6,12,.78)`＋赤テキスト）。
- **サイズ**: ロゴ素材 1024×384px（透過、暗幕の上に重畳）。
- **視覚ブリーフ**: 「GAME OVER」を**冷えた鋼に赤い割れ／ノイズグリッチ**で。文字はひび割れ、赤`#ff3b3b`の不穏な内側発光、エッジに走査線ノイズ。下に`PRESS ENTER TO RETRY`。
- **演出方針**: 出現時に1度だけ赤フラッシュ→暗幕フェードイン。文字に軽いグリッチ横ずれ（エンジンで2-3フレームだけ）。
- **英語プロンプト**:
> Painterly 2D "GAME OVER" title art, cold cracked steel letters with red fractures and faint scanline glitch noise, ominous red (#ff3b3b) inner glow, distressed industrial sci-fi mood, transparent background, painterly not pixel art, 1024x384, centered, with smaller "PRESS ENTER TO RETRY" subtext.

### 4-3. STAGE CLEAR
- **目的**: クリア画面（line 640-645、暗幕＋ゴールドテキスト＋紙吹雪）。
- **サイズ**: ロゴ素材 1024×384px（透過）。
- **視覚ブリーフ**: 「STAGE CLEAR!」をゴールド/真鍮にシアンのリム、勝利感のある暖かい発光。文字上下に光条。既存の紙吹雪(`#ff5a4a/#5ad1ff/#ffd23f/#7fff9f`)はエンジンで継続、高精細化したいなら `fx_confetti.png`(各16×16, 4色4枚)を用意。
- **演出方針**: ロゴがスケールイン（小→等倍バウンド）＋背後から放射状の光線がゆっくり回転（加算）。紙吹雪は既存ロジックのまま色だけ素材化。
- **英語プロンプト**:
> Painterly 2D "STAGE CLEAR!" celebratory title art, gold-brass letters with a cyan rim light and warm victorious glow, light rays radiating behind the text, festive but classy sci-fi mood, transparent background, painterly not pixel art, 1024x384, centered.

### 4-4. WARNING（ボス出現）
- **目的**: ボス出現警告（line 657、`warnT`90f間 赤/白点滅テキスト）。
- **サイズ**: バナー素材 1280×256px（透過、画面中央）。
- **視覚ブリーフ**: 「WARNING!」を**危険標識イエロー＋赤**のネオンで。左右にハザードストライプ（黄黒）と回転灯のグロー、赤い警告アイコン。ボス前の緊張を煽る。
- **演出方針**: 既存`warnT`の点滅(6f周期)に合わせ、バナーが赤⇄白に明滅＋左右ハザードストライプが横スクロール。出現時に画面端から赤いビネット（加算減算）を一瞬。サウンドは未実装だが、点滅と同期した画面シェイク（既存`shake`変数を流用可）を1度入れると締まる。
- **英語プロンプト**:
> Painterly 2D "WARNING!" alert banner, hazard-yellow and red neon letters flanked by yellow-black hazard stripes and glowing rotating-warning-light flares, a red alert icon, high-tension boss-incoming mood, transparent background, painterly not pixel art, 1280x256, centered.

---

## 5. 命名・コマ表・エンジン対応の早見表

| 分類 | ファイル名 | 枠/コマ | コマ数@fps | アンカー | トリガ（コード対応） |
|---|---|---|---|---|---|
| 弾 | `bullet_buster.png` | 96×64 | 1〜2@12 | center | `shootP(charge=false)` L157 |
| 弾 | `bullet_charge_strip4.png` | 192×192 | 4@16 loop | center | `shootP(charge=true)` L157/218 |
| 弾 | `bullet_enemy.png`(ティント) | 80×80 | 1〜2@12 | center | `shootE()` L160 |
| FX | `muzzle_flash_strip4.png` | 96×96 | 4@30 | center | `shootP`発射点 L214/218 |
| FX | `hit_spark_strip5.png` | 96×96 | 5@30 | center | `boom()`小 L378/384 |
| FX | `explosion_strip9.png` | 192×192 | 9@24 | center | `boom()`大/撃破 L387/398/341 |
| FX | `charge_aura_strip6.png` | 128×128 | 6@16 loop | center | `player.charge>0` L212/523 |
| FX | `landing_dust_strip5.png` | 128×96 | 5@24 | bottom-center | `onGround`遷移 L183/200 |
| FX | `jump_puff_strip4.png` | 96×80 | 4@24 | bottom-center | `vy=JUMP` L201 |
| UI | `hud_player_frame.png`＋cells | 64×256 | 静止 | top-left | `drawHUD` L613 |
| UI | `hud_boss_frame.png`＋bar | 56×288 | 静止 | top-right | `drawHUD` L617 |
| UI | `icon_*.png` | 64×64 | 静止 | — | HUD/キーガイド |
| 画面 | `logo_title.png` | 1280×512 | 静止(浮遊) | center-top | `drawTitle` L633 |
| 画面 | `logo_gameover.png` | 1024×384 | 静止 | center | `drawDead` L639 |
| 画面 | `logo_clear.png` | 1024×384 | 静止 | center | `drawClear` L642 |
| 画面 | `banner_warning.png` | 1280×256 | 静止(明滅) | center | `warnT` L657 |

### エンジン改修メモ（FX/UI観点・当たり判定不変）
- **加算合成レイヤー**: 弾・muzzle・explosion・charge_auraは `ctx.globalCompositeOperation='lighter'` のパスでまとめて描画 → 芯の白飛びを保証。描画後に`'source-over'`へ戻す。
- **エフェクト管理**: 現行`fx[]`はパーティクル専用。シートFX用に軽量な `efx[]`（{sheet,frame,t,x,y,fps,scale,additive}）を追加し、`updateFx`/`drawFx`から再生・自動破棄。`boom()`呼び出し箇所で対応する `spawnEfx('explosion'|'hit_spark', x, y)` を1行追加するだけにする。
- **発射点同期**: muzzle_flashは`shootP`内の発射座標（`player.x+(dir>0?w:-8)`）に生成。charge_auraは自機の中心に追従（毎フレーム位置更新）。
- **HUDは座標固定**: ワールドではなくスクリーン1920×1080基準で描画（camX非依存）。セル/バー本数はHP値から従来ループで描く（素材は1セル単位）。
- **WARNING/画面ロゴ**: スクリーン中央固定。`warnT`点滅・`drawTitle`の浮遊/明滅は既存タイマー(`now()`,`warnT`)を流用し、画像の不透明度/Y/加算強度に割り当て。

### 受け入れチェック（FX/UI）
1. `node harness.js` 24/24 維持（描画差し替えのみ、ロジック不変）。
2. `node tools/shot.js` で①タイトルロゴ②プレイ中の弾＋muzzle③敵撃破explosion④チャージaura⑤ボス戦HUD両ゲージ⑥WARNING⑦GAME OVER⑧STAGE CLEAR の8カットをPNG目視。
3. 加算合成で芯が白飛びし、暗所(夜背景)で弾・FXが埋もれず映えるか。
4. 当たり判定（弾8×5/13×13/敵7×7）はアートのオーバーフローに対して**不変**であることを`spritecheck.js`で確認。
5. 色アイデンティティ（自機=コバルト青×シアン / 敵弾=赤橙 / ボス=深紅×鋼＋黄 / ロゴ=青×金）が全FX/UIで一貫しているか。

---

参照した実装ファイル: `C:\Users\withd\Desktop\cobalt-bolt\index.html`（弾生成 L156-160 / charge閾値 L218 / boom色 L241,378-398 / HUD L612-621 / 画面 L631-646,657）

---

I now have everything needed. The画風 is the new high-precision painterly 2D direction (not the legacy pixel-art prompts). I'll write the 技術担当 delivery-spec section, with engine改修 to internal 1920×1080 (RENDER_SCALE=4), recomputed ASSETS scales, and the full file/hitbox/Codex/checklist tables.

Below is the section body, ready to paste.

---

## 技術担当 — 納品仕様・サイズ/コマ表・命名・エンジン改修・運用

### 0. 前提（共通コア準拠）
- ワールド座標・物理・当たり判定は **480×270 で据え置き**（`index.html` の `PW=18,PH=24`、各 `w/h`、`GROUND_Y=216`、`solids` は不変）。
- 描画のみ **内部 1920×1080（`RENDER_SCALE=4`）＋スムージングON**。オンスクリーン寸法＝ワールド×4。
- アセットは**滑らかな塗りの高精細2D（ピクセルアートではない）**。透過PNG。アニメは**横ストリップ（等間隔・全コマ同寸）**。
- スケール変換規則（全アセット共通）: `scale = (画面表示px) / (制作フレームpx)`。画面表示pxは「ワールド寸法×4」を基準に、アートのオーバーフロー込みで決める。

---

### 1. 全ファイル一覧表（命名・制作px・コマ・fps・配置）

配置はすべて `assets/`。横ストリップは `フレーム幅×コマ数` の1枚。fpsはゲーム内60fps基準のコマ送り速度。

#### [キャラ] 主人公 `player_*.png`（制作フレーム 256×256）
| ファイル名 | 用途/状態 | 制作px(1コマ) | コマ数 | ストリップ全幅 | fps | エンジン参照state |
|---|---|---|---|---|---|---|
| `player_idle.png` | 待機（呼吸） | 256×256 | 4 | 1024×256 | 6 | `idle` |
| `player_run.png` | 走行サイクル | 256×256 | 6 | 1536×256 | 12 | `run` |
| `player_jump.png` | 上昇/落下（前半=上昇,後半=落下） | 256×256 | 2 | 512×256 | 8 | `jump`（vy<0=コマ0 / vy≥0=コマ1） |
| `player_shoot.png` | 通常ショット反動＋銃口 | 256×256 | 2 | 512×256 | 14 | `shoot`（撃った瞬間トリガ） |
| `player_charge.png` | チャージ保持（オーラ纏い） | 256×256 | 4 | 1024×256 | 10 | `charge`（`player.charge>0`） |
| `player_hurt.png` | 被弾のけぞり | 256×256 | 2 | 512×256 | 10 | `hurt`（`player.inv>0`直後） |

#### [敵] `enemy_*.png`（小型 128×128、turret は 128×128）
| ファイル名 | 用途/状態 | 制作px(1コマ) | コマ数 | 全幅 | fps | エンジン参照 |
|---|---|---|---|---|---|---|
| `enemy_met_hide.png` | met 閉殻（無敵） | 128×128 | 1 | 128×128 | – | `met` `phase==='hide'` |
| `enemy_met_open.png` | met 開殻→発射 | 128×128 | 3 | 384×128 | 10 | `met` `phase==='open'` |
| `enemy_walker.png` | walker 歩行 | 128×128 | 4 | 512×128 | 10 | `walker` `walk` |
| `enemy_flyer.png` | flyer 浮遊（翼ばたき） | 128×128 | 4 | 512×128 | 10 | `flyer` `fly` |
| `enemy_turret.png` | turret 待機 | 128×128 | 2 | 256×128 | 4 | `turret` `idle` |
| `enemy_turret_fire.png` | turret 発射（銃口閃光） | 128×128 | 3 | 384×128 | 14 | `turret` `fire`（発射timer時） |

#### [ボス] `boss_*.png`（制作フレーム 512×512）
| ファイル名 | 用途/状態 | 制作px(1コマ) | コマ数 | 全幅 | fps | エンジン参照state |
|---|---|---|---|---|---|---|
| `boss_idle.png` | 待機/思考 hover | 512×512 | 2 | 1024×512 | 4 | `intro`/`think`→`idle` |
| `boss_jump.png` | 屈伸→滞空 | 512×512 | 2 | 1024×512 | 8 | `jump` |
| `boss_shoot.png` | 溜め→拡散発射 | 512×512 | 3 | 1536×512 | 10 | `shoot` |
| `boss_dash.png` | 突進ポーズ | 512×512 | 2 | 1024×512 | 12 | `dash`→`run` |
| `boss_death.png` | 撃破崩壊 | 512×512 | 6 | 3072×512 | 12 | `dead`（`boss.deadT`で再生） |

#### [弾] `bullet_*.png`
| ファイル名 | 用途 | 制作px(1コマ) | コマ数 | 全幅 | fps | エンジン参照 |
|---|---|---|---|---|---|---|
| `bullet_buster.png` | 自機通常弾（cyan） | 64×64 | 2 | 128×64 | 16 | `pBullets` `!charge` |
| `bullet_charge.png` | 自機チャージ弾（大orb＋火花） | 128×128 | 3 | 384×128 | 16 | `pBullets` `charge` |
| `bullet_enemy.png` | 敵弾（met黄/turret青/boss橙の色替えは tint or 3種別ファイル可） | 64×64 | 2 | 128×64 | 16 | `eBullets`（`b.c`色で出し分け） |

> 敵弾は単一 `bullet_enemy.png` を `b.c` で乗算tintするか、`bullet_enemy_y/b/o.png` の3枚に分けてもよい（技術側は両対応のフックを用意）。

#### [FX] `fx_*.png`（透過・加算合成想定）
| ファイル名 | 用途 | 制作px(1コマ) | コマ数 | 全幅 | fps |
|---|---|---|---|---|---|
| `fx_muzzle.png` | 銃口フラッシュ | 128×128 | 3 | 384×128 | 24 |
| `fx_hit.png` | 着弾スパーク | 128×128 | 4 | 512×128 | 24 |
| `fx_explosion.png` | 撃破/ボス崩壊 | 256×256 | 6 | 1536×256 | 18 |
| `fx_charge_aura.png` | チャージ纏いオーラ（ループ） | 256×256 | 4 | 1024×256 | 12 |
| `fx_landing_dust.png` | 着地土煙 | 128×128 | 4 | 512×128 | 18 |
| `fx_jump_puff.png` | 踏切りパフ | 128×128 | 3 | 384×128 | 18 |

#### [環境] 地形・足場・背景・プロップ
| ファイル名 | 用途 | 制作px | シームレス | 配置/参照 |
|---|---|---|---|---|
| `ground_fill.png` | 地面テクスチャ（塗り） | 512×256（横タイル可） | 横 | `solids` の塗りに敷く |
| `ground_edge.png` | 地面上縁オーバーレイ（縁・ネオントリム） | 512×64 | 横 | `solids` 上端へ重ね描き |
| `platform_module.png` | 浮遊足場モジュール（左/中/右 3スライス可） | 384×64 | 9-slice可 | 幅14の足場群を可変幅で描画 |
| `bg_far.png` | 遠景（空/月/遠スカイライン） | 1920×1080 | 横 | パララックス係数 ~0.08–0.15 |
| `bg_mid.png` | 中景（点灯ビル群） | 1920×1080 | 横 | 係数 ~0.25–0.3 |
| `bg_near.png` | 近景（手前構造物） | 1920×1080 | 横 | 係数 ~0.5 |
| `prop_crate.png` | 木箱/装甲箱 | 256×256 | – | 装飾配置（当たり判定なし） |
| `prop_sign.png` | 警告サイン（発光） | 256×256 | – | 同上 |
| `prop_pipe.png` | 配管 | 256×512 | – | 同上 |
| `prop_antenna.png` | アンテナ | 256×512 | – | 同上 |
| `prop_barrel.png` | ドラム缶 | 256×256 | – | 同上 |
| `prop_duct.png` | ダクト | 512×256 | – | 同上 |

#### [UI/ロゴ] `ui_*.png` / `logo_*.png`（フルHD基準）
| ファイル名 | 用途 | 制作px | 参照 |
|---|---|---|---|
| `ui_hp_player.png` | 自機HPゲージ枠＋セル | 320×480（縦ゲージ） | `drawHUD` 左 |
| `ui_hp_boss.png` | ボスHPゲージ枠＋セル | 320×640（縦ゲージ） | `drawHUD` 右 |
| `ui_warning.png` | WARNING!帯 | 1280×320 | `warnT>0` |
| `ui_title.png` | タイトル画面（背景込み or 前面パネル） | 1920×1080 | `drawTitle` |
| `ui_gameover.png` | GAME OVER オーバーレイ | 1920×1080 | `drawDead` |
| `ui_clear.png` | STAGE CLEAR オーバーレイ | 1920×1080 | `drawClear` |
| `logo_cobalt_bolt.png` | ロゴ（COBALT BOLT） | 1280×512 | タイトル/クリアで使用 |

---

### 2. 当たり判定 ↔ アート対応表

`scale` は「制作フレームpx」を「画面表示px（=ワールド×4の枠＋オーバーフロー）」に縮める係数。`ax/ay` は足元（底辺中央）アンカー＝**`ax=0.5, ay=1` 固定**（接地基準）。`drawSheet` は `footX = (x + w/2 - camX)*4`, `footY = (y + h)*4` を内部1920系で受け取る（下記エンジン改修参照）。

| エンティティ | 当たり判定(px, ワールド) | 画面上の判定(×4) | 制作フレームpx | 推奨表示px(高さ目安) | scale | ax | ay | 接地合わせ |
|---|---|---|---|---|---|---|---|---|
| 主人公 player | 18×24 | 72×96 | 256×256 | 身長~150px描画→ 表示~600px相当 | **0.586**（=150/256 を×4） | 0.5 | 1 | 足を枠下端付近、底辺中央を `(x+9, y+24)` に合わせる |
| met | 22×18（殻） | 88×72 | 128×128 | ~100px→×4=400 | **0.78** | 0.5 | 1 | 地面接地。開殻時の上方向はオーバーフロー可 |
| walker | 22×22 | 88×88 | 128×128 | ~108px→×4 | **0.84** | 0.5 | 1 | 脚先を底辺に |
| flyer | 20×16 | 80×64 | 128×128 | ~90px→×4 | **0.70** | 0.5 | 1 | 浮遊。`ay=1`基準のまま中心は枠内中央寄せでOK（影なし） |
| turret | 24×26 | 96×104 | 128×128 | ~120px→×4 | **0.94** | 0.5 | 1 | 台座を底辺接地、砲身はオーバーフロー可 |
| ボス boss | 36×46 | 144×184 | 512×512 | キャラ~360px→×4 | **0.563**（=360/512×4 相当） | 0.5 | 1 | 脚を底辺、角/キャノンはオーバーフロー可 |
| 自機通常弾 | 8×5 | 32×20 | 64×64 | グロー込み~48px | 0.50 | 0.5 | 0.5（中心アンカー） | 当たりは中心、グローは外側へ |
| チャージ弾 | 13×13 | 52×52 | 128×128 | ~80px | 0.42 | 0.5 | 0.5 | 中心アンカー |
| 敵弾 | 7×7 | 28×28 | 64×64 | ~40px | 0.44 | 0.5 | 0.5 | 中心アンカー |

> 厳密値は `tools/preview.js` で実画を載せて微調整（HANDOFFの前例どおり、画面で見て scale/ay を±数%補正）。表の scale は初期値。**アートは当たり判定より大きく描いてよい（オーバーフロー可）**、ただし足元（底辺中央）接地だけは厳守。

---

### 3. エンジン改修点（Claude担当・`index.html`）

当たり判定・物理・`solids`・`__GAME` フックは**不変**。描画層だけ 1920×1080 化する。

1. **内部解像度の4倍化**
   - 定数追加: `const RENDER_SCALE=4;`、`const VW=W*RENDER_SCALE /*1920*/, VH=H*RENDER_SCALE /*1080*/;`
   - `<canvas id="game" width="1920" height="1080">` に変更（ワールドは `W=480,H=270` のまま）。
   - 描画の入口で一括スケール: 各 `render()` 冒頭で `ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0)` を掛け、以降の描画は**ワールド座標のまま**書く（既存 `px()`/`tile()` はそのまま、見た目が4倍になる）。これで既存コードを最小改修で高精細化。
2. **スムージングON / pixelated解除**
   - `ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';`（`fit()` 内の `false` を撤去）。
   - CSS: `canvas{image-rendering:pixelated;image-rendering:crisp-edges;}` を**削除**（`auto`）。`fit()` のスケール計算は `innerWidth/VW` 基準に変更（アスペクト維持で最大化）。
3. **ワールド座標据え置き**
   - 当たり判定・カメラ・`camX`・`aabb` は一切触らない。`setTransform` で表示だけ4倍。
4. **ASSETS の scale 再計算**
   - 上表の scale を `ASSETS` に反映（制作256/128/512px基準）。`drawSheet` は現状ワールド系で動くため、`setTransform(4…)` 環境下でそのまま「ワールド×scale」を描けば自動で4倍表示になる。`fw/fh` を新制作px（256/128/512/64）へ更新。
5. **背景3層パララックスの画像フック**
   - `bg()` を改修: コード描画ビル群を `bg_far/mid/near.png` の**横シームレス drawImage** に差し替え（係数 0.1/0.25/0.5）。画像未ロード時は現行コード描画にフォールバック（既存の安全方針を踏襲）。
6. **地形テクスチャの画像フック**
   - `tile()`/`drawSolids()` を改修: `ground_fill.png` を `solids` 矩形にタイル描画＋上端に `ground_edge.png`、浮遊足場は `platform_module.png`（9-slice）。未ロードなら現行 `tile()`。
7. **弾・FX の画像描画フック**
   - `drawBullets()`: `bullet_buster/charge/enemy` を中心アンカーで描画（フレームアニメ対応の小ヘルパ `drawSprite(file, cx, cy, scale)` を追加）。`drawFx()`/`boom()` をスプライト化（`fx_explosion/hit/muzzle/...`）。muzzleは発射時、landing_dust/jump_puffは接地/踏切イベントで spawn。すべて未ロード時は現行の矩形パーティクルにフォールバック。
8. **HUD高精細化**
   - `drawHUD()`/`drawGate()` を `ui_hp_player/boss.png` ベースに（セルは現行ロジックで塗り or 9-slice）。タイトル/クリア/ゲームオーバー/WARNINGは `ui_*` 画像があれば差し替え、無ければ現行 `text()` 描画。
9. **フォールバック原則の維持**
   - `AGENTS.md §5` 準拠: いずれの画像も未配置／未ロードなら**必ず現行コード描画に戻る**。ゲームは常にプレイ可能。`__GAME` の公開APIは不変。

---

### 4. 横ストリップ / 連番ルール（素材側厳守）

- **横ストリップ**: 全コマを横一列、**等間隔・全コマ同寸**（フレーム幅×コマ数＝シート全幅、端の余白なし）。コマ境界 `sxp=f*fw` で割り切れること。
- **連番フレーム**を使う場合: `name_00.png, name_01.png …`（0埋め2桁）。技術側はストリップ優先、連番は将来オプション。
- **透過PNG（RGBA）**。背景・**地面影は描かない**（キャラ素材に接地影禁止＝接地は底辺アンカーで合わせる）。
- 同一サブジェクトの**全アニメで色設計・ライティング・タッチ・プロポーションを共有**（1作品=1画風）。
- 各コマで**足を枠下端付近**に置く（player身長~150px）。flyerなど浮遊体も枠内で一貫した位置に。
- スムーズ表示前提なのでドット格子に揃える必要なし。ただし**フレーム寸法は表の値で固定**（ASSETSの `fw/fh` と一致必須）。

---

### 5. Codex運用（往復フロー）

共有フォルダ `C:\Users\withd\Desktop\cobalt-bolt`（git正本）。真実の源は `AGENTS.md`、受け渡しは `HANDOFF.md`。

1. **着手前**: 両者とも `AGENTS.md → HANDOFF.md → git log --oneline -10` を読む。
2. **生成（Codex）**: 本仕様のファイル名・制作px・コマ数で透過PNGを生成 → `assets/` に保存。
3. **コミット（Codex）**: prefix `[codex] ...` で小さくコミット。`HANDOFF.md` 先頭に「保存ファイル名・コマ数・サイズ・画風メモ」を追記。
4. **反映/検証（Claude）**: `ASSETS` に `fw/fh/scale/ax/ay/anims(src,frames,fps)` を記述 →
   - `node tools/spritecheck.js`（PNGデコード→drawImageの載り確認）
   - `node tools/preview.js`（実PNGをゲーム画面に載せたPNGを出力→接地/反転/サイズ感を目視）
   - `node tools/shot.js`（描画回帰チェック）
   - `node harness.js`（**24/24維持**）
5. **コミット（Claude）**: prefix `[claude] ...`。`HANDOFF.md` に「実施・検証結果・次タスク」を追記して相手に返す。
6. **公開**: `git push origin main` で GitHub Pages 自動更新。
7. 危険な並行編集はブランチを切る。迷いは `HANDOFF.md` に判断委譲を明記。

> 注: 既存ツールは旧サイズ（fw48等）前提の検証実績。1920×1080化に合わせ `tools/preview.js`/`shot.js` のキャンバスを `VW×VH=1920×1080`・スムージングONへ更新する（技術改修に含む）。

---

### 6. 受け入れチェックリスト

- [ ] **画風統一**: 全アセットが同一の色設計・ライティング・タッチ（塗り2D、ピクセルアート不使用）。主人公=コバルト＋シアン発光／ボス=深紅×鋼＋黄コア／世界=ネオン夜の工業都市。
- [ ] **解像度**: 内部 1920×1080（`RENDER_SCALE=4`）、`imageSmoothingEnabled=true`、CSS `image-rendering:pixelated` 撤去。ワールド座標(480×270)・当たり判定は不変。
- [ ] **透過**: 全PNGがRGBAアルファ付き、背景/接地影なし。
- [ ] **接地**: 全キャラ `ax=0.5, ay=1`、底辺中央が当たり判定の足元 `(x+w/2, y+h)` に一致（`preview.js`で目視）。
- [ ] **シルエット**: ネオン夜景背景に対し主人公/敵/ボスが明確に可読（リム/発光で締め）。当たり判定より大きいオーバーフローは可だが接地はずれない。
- [ ] **コマ/寸法整合**: 各ストリップが「fw×frames＝全幅」で割り切れ、ASSETSの `fw/fh/frames/fps` と一致。
- [ ] **フォールバック**: 任意の画像を外しても現行コード描画でゲームが動く（`__GAME` 不変）。
- [ ] **検証通過**: `node harness.js` = **24/24**、`node tools/spritecheck.js` / `tools/preview.js` / `tools/shot.js` で回帰・接地・サイズ感OK。
- [ ] **運用**: コミットprefix（`[codex]`/`[claude]`）と `HANDOFF.md` 追記が往復ごとに残っている。

---

参照ファイル（すべて絶対パス）:
- 本体: `C:\Users\withd\Desktop\cobalt-bolt\index.html`（当たり判定 `PW=18,PH=24`、`GROUND_Y=216`、`ASSETS`/`drawSheet` は L91–120、敵 `w/h` は L248–264、ボス L327）
- 規約: `C:\Users\withd\Desktop\cobalt-bolt\AGENTS.md` / `C:\Users\withd\Desktop\cobalt-bolt\HANDOFF.md`
- 既存ガイド: `C:\Users\withd\Desktop\cobalt-bolt\assets\AI_PROMPT.md`（※旧=ピクセル指定。本仕様の「塗り2D」へ要更新）/ `C:\Users\withd\Desktop\cobalt-bolt\assets\ASSETS_GUIDE.md`
- 検証: `C:\Users\withd\Desktop\cobalt-bolt\harness.js` / `tools\preview.js` / `tools\shot.js` / `tools\spritecheck.js`
