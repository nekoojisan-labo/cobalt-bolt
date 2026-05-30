// ヘッドレス検証ハーネス：ブラウザ無しでゲームループを実際に走らせて挙動を確認する
const fs = require('fs');
const vm = require('vm');
const path = require('path');

globalThis.__HEADLESS = true;
globalThis.document = { getElementById: () => ({ getContext: () => null, style:{}, width:0, height:0, addEventListener(){} }) };
// window / requestAnimationFrame はわざと未定義（ゲーム側が typeof でガードしている）

const file = process.argv[2] || path.join(__dirname, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInThisContext(code); // これで globalThis.__GAME がセットされる
const G = globalThis.__GAME;

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail='') {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name}  ${detail}`); }
}
function steps(n){ for(let i=0;i<n;i++) G.step(); }

// ---- T1: 起動時はタイトル ----
check('起動直後は title 画面', G.state === 'title', `state=${G.state}`);

// ---- T2: Enter でゲーム開始 ----
G.hold('enter'); G.step(); G.release('enter');
check('Enter で play へ遷移', G.state === 'play', `state=${G.state}`);

// ---- T3: 着地（床をすり抜けない）----
G.start(); G.releaseAll();
steps(30);
const p = G.player;
const groundTop = G.consts.GROUND_Y - G.consts.PH;
check('床に着地している', p.onGround === true, `onGround=${p.onGround}`);
check('床をすり抜けていない', Math.abs(p.y - groundTop) < 1.5, `y=${p.y} expected≈${groundTop}`);
check('画面外に落ちていない', p.y < G.consts.H, `y=${p.y}`);

// ---- T4: 右移動 ----
G.start(); G.releaseAll(); steps(5);
let x0 = G.player.x;
G.hold('arrowright'); steps(30); G.release('arrowright');
check('右に移動できる', G.player.x > x0 + 20, `dx=${(G.player.x-x0).toFixed(1)}`);
check('右向きになる', G.player.dir === 1, `dir=${G.player.dir}`);

// ---- T5: 左移動 ----
G.releaseAll(); x0 = G.player.x;
G.hold('arrowleft'); steps(20); G.release('arrowleft');
check('左に移動できる', G.player.x < x0 - 10, `dx=${(G.player.x-x0).toFixed(1)}`);
check('左向きになる', G.player.dir === -1, `dir=${G.player.dir}`);

// ---- T6: ジャンプ ----
G.start(); G.releaseAll(); steps(10); // 着地まで
const yGround = G.player.y;
G.hold('arrowdown'); G.release('arrowdown'); // no-op
G.hold('z'); G.step(); // ジャンプ入力
let minY = G.player.y;
for(let i=0;i<10;i++){ G.step(); minY = Math.min(minY, G.player.y); } // 押しっぱで上昇
G.release('z');
for(let i=0;i<40;i++){ G.step(); } // 落下して着地
check('ジャンプで上昇する', minY < yGround - 25, `minY=${minY.toFixed(1)} ground=${yGround.toFixed(1)} 上昇=${(yGround-minY).toFixed(1)}`);
check('ジャンプ後に着地する', G.player.onGround === true, `onGround=${G.player.onGround}`);

// ---- T7: ショットで弾が出る ----
G.start(); G.releaseAll(); steps(5);
const nb0 = G.pBullets.length;
G.hold('x'); G.step(); G.release('x');
check('ショットで自弾が発生', G.pBullets.length > nb0, `pBullets=${G.pBullets.length}`);
check('自弾が前方へ進む(vx≠0)', G.pBullets.some(b=>b.vx!==0), '');

// ---- T8: 自弾が敵に当たると倒せる（衝突＆ダメージ経路）----
G.start(); G.releaseAll(); steps(3);
const target = G.enemies.find(e=>e.type==='flyer') || G.enemies[0]; // flyerはhp1
const ehp0 = target.hp;
// 敵の位置にダメージ弾を直接生成して衝突経路を検証
G.pBullets.push({ x: target.x+2, y: target.y+2, w: target.w-2, h: target.h-2, vx: 0, dmg: 5, charge:false, life: 5 });
G.step();
check('自弾が敵にダメージを与える/撃破', (!target.alive) || (target.hp < ehp0), `alive=${target.alive} hp=${target.hp}/${ehp0}`);

// ---- T9: 敵接触でプレイヤーがダメージ ----
G.start(); G.releaseAll(); steps(3);
const e2 = G.enemies[0]; // 地上の met
G.player.x = e2.x;        // 同じx（yは床の上のまま＝自然に重なる）
const hp0 = G.player.hp;
G.step();
check('敵接触でHPが減る', G.player.hp < hp0, `hp=${G.player.hp}/${hp0}`);
check('被弾後に無敵時間が付く', G.player.inv > 0, `inv=${G.player.inv}`);

// ---- T10: HP0で死亡→GAME OVER ----
G.start(); G.releaseAll(); steps(3);
G.player.hp = 1; const e3 = G.enemies[0];
G.player.x = e3.x; // 同じx（床の上で重ねる）
G.step();
check('HP0で dead になる', G.player.dead === true, `dead=${G.player.dead} hp=${G.player.hp}`);
steps(90);
check('一定時間後 GAME OVER 画面へ', G.state === 'dead', `state=${G.state}`);

// ---- T11: ボス出現 ----
G.start(); G.releaseAll(); steps(3);
G.player.x = G.consts.BOSS_TRIGGER + 5;
G.step();
check('トリガーでボスが出現', G.bossActive === true && !!G.boss, `bossActive=${G.bossActive} boss=${!!G.boss}`);
check('ボス戦でプレイヤーが部屋内に拘束', G.player.x >= G.consts.ROOM_X, `x=${G.player.x}`);

// ---- T12: ボス撃破→STAGE CLEAR ----
G.player.hp = 99999; // 検証中は死なないように
G.boss.state = 'think'; G.boss.timer = 0; // intro をスキップ
// ボスにダメージ弾を大量生成して撃破
for(let i=0;i<20;i++){ G.pBullets.push({ x:G.boss.x+4, y:G.boss.y+18, w:13,h:13, vx:0, dmg:3, charge:false, life:3 }); }
G.player.hp = 99999;
G.step();
check('ボスがダメージで dead になる', G.boss.dead === true, `dead=${G.boss.dead} hp=${G.boss.hp}`);
G.player.hp = 99999;
steps(130);
check('ボス撃破後 STAGE CLEAR へ', G.state === 'clear', `state=${G.state}`);

// ---- T13: 例外なく長時間動作（放置耐久）----
let crashed = null;
try{
  G.start(); G.releaseAll();
  for(let i=0;i<600;i++){
    // ランダムっぽい入力で動かす（決定的にするため i ベース）
    G.release('arrowright'); G.release('z'); G.release('x');
    if(i%3===0) G.hold('arrowright');
    if(i%17===0) G.hold('z');
    if(i%5===0) G.hold('x');
    G.step();
  }
}catch(e){ crashed = e; }
check('600フレーム無例外で動作', crashed === null, crashed ? String(crashed.stack||crashed) : '');

// ---- T14: スタート→ボスまで自走で踏破できる（穴を越えられる）----
G.start(); G.releaseAll();
let reached=false, fell=false, maxX=0;
for(let i=0;i<2500 && !reached; i++){
  G.player.hp = 9999;                       // 戦闘死を除外し「地形の踏破可能性」だけを検証
  G.release('arrowright'); G.hold('arrowright');
  const pl=G.player, probeX=pl.x+pl.w+22, footY=pl.y+pl.h;
  let groundAhead=false;
  for(const s of G.solids){ if(probeX>=s.x && probeX<=s.x+s.w && footY>=s.y-6 && footY<=s.y+16){groundAhead=true;break;} }
  const wall = pl.onGround && pl.vx===0;
  if(pl.onGround && (!groundAhead || wall)){ G.release('z'); G.hold('z'); } else { G.release('z'); }
  G.step();
  maxX=Math.max(maxX, G.player.x);
  if(G.player.dead){ fell=true; break; }
  if(G.bossActive || G.player.x>=G.consts.BOSS_TRIGGER) reached=true;
}
check('スタート→ボスまで自走で踏破できる（穴を越えられる）', reached && !fell, `reached=${reached} fell=${fell} 到達x=${maxX.toFixed(0)}/${G.consts.BOSS_TRIGGER}`);

// ==== 結果 ====
console.log('\n==== ROCK BUSTER ヘッドレス検証 ====');
console.log(results.join('\n'));
console.log(`\n  合計: ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
