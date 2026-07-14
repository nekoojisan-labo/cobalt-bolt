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

function jointFlexDegrees(root, joint, end) {
  const upper = { x: root.x - joint.x, y: root.y - joint.y };
  const lower = { x: end.x - joint.x, y: end.y - joint.y };
  const cosine = (upper.x * lower.x + upper.y * lower.y)
    / (Math.hypot(upper.x, upper.y) * Math.hypot(lower.x, lower.y));
  const inner = Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
  return 180 - inner;
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

const idlePose = motion.computePose({ ...base, vx: 0 });
const idleAnchors = motion.getAnchors(idlePose, 100, 216, 1);
const idleNearKneeFlex = jointFlexDegrees(idleAnchors.nearHip, idleAnchors.nearKnee, idleAnchors.nearFoot);
const idleFarKneeFlex = jointFlexDegrees(idleAnchors.farHip, idleAnchors.farKnee, idleAnchors.farFoot);
check(
  '通常立ちは膝を軽く緩めた直立姿勢になる',
  idleNearKneeFlex >= 15 && idleNearKneeFlex <= 35
    && idleFarKneeFlex >= 15 && idleFarKneeFlex <= 35,
  `手前膝=${idleNearKneeFlex.toFixed(1)}度, 奥膝=${idleFarKneeFlex.toFixed(1)}度`,
);
check(
  '通常立ちの体幹はほぼ垂直になる',
  Math.abs(idlePose.torsoLean * 180 / Math.PI) <= 1,
  `傾斜=${(idlePose.torsoLean * 180 / Math.PI).toFixed(1)}度`,
);
check(
  '通常立ちの足裏位置を固定する',
  near(idleAnchors.nearFoot.x, 103.2) && near(idleAnchors.nearFoot.y, 215.4)
    && near(idleAnchors.farFoot.x, 96.8) && near(idleAnchors.farFoot.y, 215.4),
);
check(
  '通常立ち腕は肘で自然に曲がる',
  Math.abs(idlePose.nearUpper - idlePose.nearLower) >= 0.22
    && Math.abs(idlePose.farUpper - idlePose.farLower) >= 0.22,
  `上腕=${idlePose.nearUpper.toFixed(2)}, 前腕=${idlePose.nearLower.toFixed(2)}`,
);
check(
  '通常立ちの両腕は肩から下へつながる',
  idleAnchors.nearElbow.y - idleAnchors.nearShoulder.y >= 4
    && idleAnchors.farElbow.y - idleAnchors.farShoulder.y >= 4,
  `手前=${(idleAnchors.nearElbow.y-idleAnchors.nearShoulder.y).toFixed(1)}px, 奥=${(idleAnchors.farElbow.y-idleAnchors.farShoulder.y).toFixed(1)}px`,
);
check(
  '通常立ちの両腕は胸前へ寄らず肩の下に収まる',
  Math.abs(idleAnchors.muzzle.x - idleAnchors.nearShoulder.x) <= 1.2
    && Math.abs(idleAnchors.farHand.x - idleAnchors.farShoulder.x) <= 1.2,
  `バスター側=${(idleAnchors.muzzle.x-idleAnchors.nearShoulder.x).toFixed(1)}px, 反対腕=${(idleAnchors.farHand.x-idleAnchors.farShoulder.x).toFixed(1)}px`,
);

const standFirePose = motion.computePose({ ...base, vx: 0, fireHold: 18 });
const runFirePose = motion.computePose({ ...base, vx: 3.2, anim: 16, fireHold: 18 });
const jumpFirePose = motion.computePose({ ...base, onGround: false, vx: 3.2, vy: -4, jumpAge: 8, fireHold: 18 });
const runChargeA = motion.computePose({ ...base, vx: 3.2, anim: 0, charge: 45 });
const runChargeB = motion.computePose({ ...base, vx: 3.2, anim: 32, charge: 45 });
const runChargeOverlap = motion.computePose({ ...base, vx: 3.2, anim: 16, fireHold: 30, charge: 45 });
const actionSignatures = [standFirePose, runFirePose, jumpFirePose, runChargeA]
  .map(p => `${p.nearUpper.toFixed(2)}:${p.nearLower.toFixed(2)}:${p.torsoLean.toFixed(2)}`);
check('立ち・走り・ジャンプ・チャージが別々の構えを持つ', new Set(actionSignatures).size === 4, actionSignatures.join(' / '));
check('立ち撃ちは専用の構えになる', standFirePose.actionPose === 'stand-fire', standFirePose.actionPose);
check('走り撃ちは専用の構えになる', runFirePose.actionPose === 'run-fire', runFirePose.actionPose);
check('ジャンプ撃ちは専用の構えになる', jumpFirePose.actionPose === 'jump-fire', jumpFirePose.actionPose);
check('走りチャージは構えを維持する', runChargeA.actionPose === 'run-charge'
  && near(runChargeA.nearUpper, runChargeB.nearUpper)
  && near(runChargeA.nearLower, runChargeB.nearLower), runChargeA.actionPose);
check('チャージ保持中は直前の発射保持が残っても反動を出さない', near(runChargeOverlap.pelvisX, 0)
  && near(runChargeOverlap.nearUpper, runChargeA.nearUpper), `pelvisX=${runChargeOverlap.pelvisX.toFixed(2)}`);
for (const [name, pose] of [
  ['立ち撃ち', standFirePose],
  ['走り撃ち', runFirePose],
  ['ジャンプ撃ち', jumpFirePose],
  ['走りチャージ', runChargeA],
]) {
  const a = motion.getAnchors(pose, 100, 216, 1);
  check(`${name}: 肘を肩より下げて顔から腕が生えるのを防ぐ`, a.muzzle.y-a.nearShoulder.y>=2.8,
    `肩→砲口の落差=${(a.muzzle.y-a.nearShoulder.y).toFixed(2)}px`);
}

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

function startSettled() {
  game.start();
  game.releaseAll();
  for (let i = 0; i < 8; i += 1) game.step();
}

startSettled();
game.hold('x');
game.step();
check('実操作の立ち撃ちで専用構えになる', game.player.visualPose.actionPose === 'stand-fire', game.player.visualPose.actionPose);

startSettled();
game.hold('z');
game.hold('x');
game.step();
check('実操作のジャンプ撃ちで専用構えになる', game.player.visualPose.actionPose === 'jump-fire', game.player.visualPose.actionPose);

startSettled();
game.hold('arrowright');
game.hold('x');
for (let i = 0; i < 45; i += 1) game.step();
check('実操作の走りチャージで構えを維持する', game.player.vx > 0 && game.player.charge >= 40
  && game.player.visualPose.actionPose === 'run-charge', game.player.visualPose.actionPose);

game.releaseAll();
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
