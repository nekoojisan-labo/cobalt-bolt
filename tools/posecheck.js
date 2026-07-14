// プレイヤー全身リグの不変条件を検査する。
// 見た目だけでなく、接地・関節長・砲口位置・ジャンプ段階を数値で固定する。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repo = path.join(__dirname, '..');
globalThis.__HEADLESS = true;
globalThis.document = {
  getElementById: () => ({
    getContext: () => ({}),
    addEventListener() {},
    style: {},
  }),
};

const html = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/);
if (!script) throw new Error('index.html のゲームスクリプトを取得できません');
vm.runInThisContext(script[1], { filename: 'index.html' });

const game = globalThis.__GAME;
const motion = game && game.motion;
let passed = 0;

function check(name, condition, detail = '') {
  if (!condition) {
    console.error(`  ❌ ${name}${detail ? `: ${detail}` : ''}`);
    process.exitCode = 1;
    return;
  }
  passed += 1;
  console.log(`  ✅ ${name}`);
}

function near(a, b, tolerance = 0.001) {
  return Math.abs(a - b) <= tolerance;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

console.log('\n==== COBALT 全身関節リグ検証 ====');
check('関節モーションAPIが公開されている', !!motion);
if (!motion) process.exit(1);

const base = {
  onGround: true,
  vx: 3.2,
  vy: 0,
  anim: 0,
  blink: 0,
  fireHold: 0,
  charge: 0,
  jumpAge: 0,
  landT: 0,
};

const runA = motion.computePose({ ...base, anim: 0 });
const runB = motion.computePose({ ...base, anim: 3.2 });
const anchorsA = motion.getAnchors(runA, 100, 216, 1);
const anchorsB = motion.getAnchors(runB, 103.2, 216, 1);
check('バスター腕が首ではなく手前肩から出る', anchorsA.nearShoulder.x-anchorsA.pelvis.x>=3.4);
check('左右の脚が別々の股関節から出る', anchorsA.nearHip.x-anchorsA.farHip.x>=3.2);
check(
  '走行の接地足が地面を滑らない',
  Math.abs(anchorsB.nearFoot.x - anchorsA.nearFoot.x) <= 1.5,
  `移動量=${(anchorsB.nearFoot.x - anchorsA.nearFoot.x).toFixed(2)}px`,
);

for (const [name, pose] of [
  ['走行', runA],
  ['攻撃', motion.computePose({ ...base, fireHold: 30 })],
  ['上昇', motion.computePose({ ...base, onGround: false, vy: -6, jumpAge: 5 })],
  ['頂点', motion.computePose({ ...base, onGround: false, vy: 0, jumpAge: 12 })],
  ['下降', motion.computePose({ ...base, onGround: false, vy: 5, jumpAge: 20 })],
]) {
  const a = motion.getAnchors(pose, 100, 160, 1);
  check(`${name}: 太腿の長さが一定`, near(distance(a.nearHip, a.nearKnee), motion.lengths.thigh, 0.02));
  check(`${name}: すねの長さが一定`, near(distance(a.nearKnee, a.nearFoot), motion.lengths.shin, 0.02));
  check(`${name}: 上腕の長さが一定`, near(distance(a.nearShoulder, a.nearElbow), motion.lengths.upperArm, 0.02));
  check(`${name}: バスターが肘から連結される`, near(distance(a.nearElbow, a.muzzle), motion.lengths.buster, 0.02));
}

const jumpModes = [
  motion.computePose({ ...base, onGround: false, vy: -7, jumpAge: 1 }).mode,
  motion.computePose({ ...base, onGround: false, vy: -5, jumpAge: 6 }).mode,
  motion.computePose({ ...base, onGround: false, vy: 0, jumpAge: 14 }).mode,
  motion.computePose({ ...base, onGround: false, vy: 5, jumpAge: 22 }).mode,
  motion.computePose({ ...base, onGround: true, vx: 0, landT: 8 }).mode,
];
check('ジャンプが5段階の異なるポーズを持つ', new Set(jumpModes).size === 5, jumpModes.join(', '));

const firePose = motion.computePose({ ...base, vx: 0, fireHold: 30 });
const fireRight = motion.getAnchors(firePose, 100, 216, 1);
const fireLeft = motion.getAnchors(firePose, 100, 216, -1);
check('右向き砲口が肩より前にある', fireRight.muzzle.x > fireRight.nearShoulder.x);
check('左向き砲口が肩より前にある', fireLeft.muzzle.x < fireLeft.nearShoulder.x);
check('左右反転でも砲口高が変わらない', near(fireRight.muzzle.y, fireLeft.muzzle.y));

game.start();
for (let i = 0; i < 8; i += 1) game.step();
game.player.x = 200;
game.player.dir = 1;
game.hold('x');
game.step();
const bullet = game.pBullets[game.pBullets.length - 1];
const muzzle = motion.getPlayerMuzzle();
check('弾が実際の砲口から発生する', bullet && muzzle
  && Math.abs(bullet.originX - muzzle.x) <= 1
  && Math.abs(bullet.originY - muzzle.y) <= 1);

console.log(`\n  合計: ${passed} passed${process.exitCode ? '（失敗あり）' : ''}\n`);
