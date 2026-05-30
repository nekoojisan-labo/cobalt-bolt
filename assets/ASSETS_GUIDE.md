# 高精細スプライト 導入ガイド（assets/）

このフォルダに**スプライトシート(PNG)**を置くと、ゲームが自動で高精細スプライトを使います。
※ 未配置なら従来のコード描画にフォールバックするので、ゲームは常に動きます。

---

## ① 推奨素材：ansimuz「Warped City」（CC0・無料）

ゲーム全体を**一気に・画風統一で**高精細化できる最有力。

- ページ: https://ansimuz.itch.io/warped-city
- ライセンス: **CC0（パブリックドメイン）** … クレジット不要・商用可・改変可（パクリ懸念ゼロ）
- 価格: **Name your own price**（`No thanks, just take me to the downloads` で**無料DL可**）
- 内容: **3層パララックス背景／16x16タイルセット／主人公(10アニメ)／敵2種／乗り物4種／プロップ・VFX**
- 手描きピクセルアート（生成AI不使用）

### やること
1. 上記ページで **Download** → 無料DL（ZIP）
2. ZIPを解凍
3. 中の **PNG（キャラ・タイル・背景レイヤー）**を、この `assets/` フォルダに**そのままコピー**
4. 私に「**素材置いた**」と伝える

→ あとは私が各PNGの**コマ割り（frameサイズ・行・コマ数）を実物を見て判定**し、
   `index.html` の `ASSETS` 設定に記述 → スクショ検証 → push します。

---

## ② ボス／敵を増やしたい場合（任意・Penusbmic）

Warped Cityは敵2種・ボス無しなので、ボスや敵バリエが欲しければ補完候補：

- Penusbmic Sci-Fiキャラ各種: https://penusbmic.itch.io/ （例: Sci-fi Hero Sprite, Sci-fi Character Pack 1〜10）
- 多くが**有料（$2前後）**・一部に無料スプライトあり / フレーム例: 128x64
- ライセンス: 商用可・改変可、**クレジットは「Penusbmic」表記が望ましい**

※ 画風統一の観点では、まずは Warped City だけで揃えるのが綺麗です。

---

## ファイル名のヒント（決まりは私が合わせます）
配置後に私がリネーム＆設定するので**厳密でなくてOK**。目安：
```
assets/
  player.png        主人公のスプライトシート
  enemy_a.png       敵1
  enemy_b.png       敵2
  boss.png          ボス（用意できれば）
  tiles.png         16x16タイルセット
  bg_far.png        背景（遠）
  bg_mid.png        背景（中）
  bg_near.png       背景（近）
```

## 仕組み（参考）
`index.html` の `ASSETS` に各シートのコマ割りを設定 → `drawSheet()` が
state（idle/run/jump/shoot 等）に応じて該当コマを描画。当たり判定は現状維持で**見た目だけ差し替え**。
