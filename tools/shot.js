// 描画検証ツール：Canvas2Dを最小エミュレートしてゲームのrender()をPNGに出力する。
// これで「見た目」を目視確認できる（Readツールで開ける）。
const fs = require('fs');
const zlib = require('zlib');
const vm = require('vm');
const path = require('path');

const W = 480, H = 270, SCALE = 3;

// ---- フレームバッファ ----
const buf = new Uint8Array(W * H * 4);
function clear(){ buf.fill(0); }

function parseColor(c){
  if (typeof c === 'object' && c && c.__grad) return c; // gradient
  if (typeof c !== 'string') return {r:255,g:0,b:255,a:1};
  c = c.trim();
  if (c[0] === '#'){
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map(x=>x+x).join('');
    return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16), a:1 };
  }
  let m = c.match(/rgba?\(([^)]+)\)/);
  if (m){ const p = m[1].split(',').map(s=>parseFloat(s)); return { r:p[0], g:p[1], b:p[2], a:p[3]===undefined?1:p[3] }; }
  return {r:255,g:0,b:255,a:1};
}
function setPx(x,y,col){
  x|=0; y|=0; if (x<0||y<0||x>=W||y>=H) return;
  const i = (y*W+x)*4, a = col.a===undefined?1:col.a;
  if (a>=1){ buf[i]=col.r; buf[i+1]=col.g; buf[i+2]=col.b; buf[i+3]=255; }
  else { buf[i]=col.r*a+buf[i]*(1-a); buf[i+1]=col.g*a+buf[i+1]*(1-a); buf[i+2]=col.b*a+buf[i+2]*(1-a); buf[i+3]=255; }
}

// ---- Canvas2D 互換コンテキスト ----
function makeCtx(){
  let t = { a:1, b:0, c:0, d:1, e:0, f:0 };
  const stack = [];
  const dev = (x,y)=>({ x:t.a*x + t.c*y + t.e, y:t.b*x + t.d*y + t.f });
  const inv = (X,Y)=>{
    const det = t.a*t.d - t.b*t.c || 1e-9, dx = X - t.e, dy = Y - t.f;
    return { x:(t.d*dx - t.c*dy)/det, y:(-t.b*dx + t.a*dy)/det };
  };
  const ctx = {
    imageSmoothingEnabled:false, fillStyle:'#000', font:'', textAlign:'left', textBaseline:'alphabetic',
    save(){ stack.push({...t}); },
    restore(){ if (stack.length) t = stack.pop(); },
    translate(dx,dy){ t.e += t.a*dx + t.c*dy; t.f += t.b*dx + t.d*dy; },
    scale(ax,ay){ t.a *= ax; t.b *= ax; t.c *= ay; t.d *= ay; },
    rotate(r){
      const co=Math.cos(r), si=Math.sin(r), a=t.a, b=t.b, c=t.c, d=t.d;
      t.a = a*co + c*si; t.b = b*co + d*si; t.c = -a*si + c*co; t.d = -b*si + d*co;
    },
    setTransform(a,b,c,d,e,f){ t = {a,b,c,d,e,f}; },
    createLinearGradient(x0,y0,x1,y1){
      return { __grad:true, p0:dev(x0,y0), p1:dev(x1,y1), stops:[],
               addColorStop(o,c){ this.stops.push({o, c:parseColor(c)}); } };
    },
    fillRect(x,y,w,h){
      const p0=dev(x,y), p1=dev(x+w,y), p2=dev(x+w,y+h), p3=dev(x,y+h);
      const x0=Math.floor(Math.min(p0.x,p1.x,p2.x,p3.x)), x1=Math.ceil(Math.max(p0.x,p1.x,p2.x,p3.x));
      const y0=Math.floor(Math.min(p0.y,p1.y,p2.y,p3.y)), y1=Math.ceil(Math.max(p0.y,p1.y,p2.y,p3.y));
      const fs = this.fillStyle;
      if (fs && fs.__grad){
        const gx=fs.p1.x-fs.p0.x, gy=fs.p1.y-fs.p0.y, len2=(gx*gx+gy*gy)||1;
        for (let py=y0;py<y1;py++) for (let px=x0;px<x1;px++){
          const q=inv(px+0.5,py+0.5); if(q.x<x||q.x>=x+w||q.y<y||q.y>=y+h) continue;
          let u=((px-fs.p0.x)*gx+(py-fs.p0.y)*gy)/len2; u=u<0?0:u>1?1:u;
          setPx(px,py,gradColor(fs.stops,u));
        }
      } else {
        const col=parseColor(fs);
        for (let py=y0;py<y1;py++) for (let px=x0;px<x1;px++){
          const q=inv(px+0.5,py+0.5); if(q.x<x||q.x>=x+w||q.y<y||q.y>=y+h) continue;
          setPx(px,py,col);
        }
      }
    },
    fillText(s,x,y){ drawText(this, s, x, y); },
  };
  return ctx;
}
function gradColor(stops,u){
  if (!stops.length) return {r:0,g:0,b:0,a:1};
  if (u<=stops[0].o) return stops[0].c;
  for (let i=1;i<stops.length;i++){ if (u<=stops[i].o){ const a=stops[i-1],b=stops[i],k=(u-a.o)/((b.o-a.o)||1);
    return { r:a.c.r+(b.c.r-a.c.r)*k, g:a.c.g+(b.c.g-a.c.g)*k, b:a.c.b+(b.c.b-a.c.b)*k, a:1 }; } }
  return stops[stops.length-1].c;
}

// ---- 簡易5x7フォント（ASCII主要文字／確認用） ----
const FONT = {
 'A':['01110','10001','10001','11111','10001','10001','10001'],'B':['11110','10001','11110','10001','10001','10001','11110'],
 'C':['01111','10000','10000','10000','10000','10000','01111'],'E':['11111','10000','11110','10000','10000','10000','11111'],
 'G':['01111','10000','10000','10111','10001','10001','01111'],'K':['10001','10010','11100','10100','10010','10001','10001'],
 'M':['10001','11011','10101','10101','10001','10001','10001'],'N':['10001','11001','10101','10011','10001','10001','10001'],
 'O':['01110','10001','10001','10001','10001','10001','01110'],'P':['11110','10001','11110','10000','10000','10000','10000'],
 'R':['11110','10001','11110','10100','10010','10001','10001'],'S':['01111','10000','01110','00001','00001','10001','01110'],
 'T':['11111','00100','00100','00100','00100','00100','00100'],'U':['10001','10001','10001','10001','10001','10001','01110'],
 'V':['10001','10001','10001','10001','01010','01010','00100'],'W':['10001','10001','10001','10101','10101','11011','10001'],
 'I':['11111','00100','00100','00100','00100','00100','11111'],'L':['10000','10000','10000','10000','10000','10000','11111'],
 'Y':['10001','01010','00100','00100','00100','00100','00100'],'!':['00100','00100','00100','00100','00100','00000','00100'],
 ' ':['00000','00000','00000','00000','00000','00000','00000'],'-':['00000','00000','00000','11111','00000','00000','00000'],
};
function drawText(ctx, s, x, y){
  s = String(s).toUpperCase();
  const sz = parseInt((ctx.font.match(/(\d+)px/)||[])[1]||'10',10);
  const sc = Math.max(1, Math.round(sz/9)), cw = 6*sc;
  let total = s.length*cw;
  let sx = ctx.textAlign==='center' ? x-total/2 : ctx.textAlign==='right' ? x-total : x;
  const top = y - 7*sc; // baseline補正
  for (const ch of s){ const g = FONT[ch]; if (g){ const col=parseColor(ctx.fillStyle);
    for (let r=0;r<7;r++) for (let c=0;c<5;c++) if (g[r][c]==='1') for(let dy=0;dy<sc;dy++) for(let dx=0;dx<sc;dx++) setPx(sx+c*sc+dx, top+r*sc+dy, col);
  } sx += cw; }
}

// ---- PNG エンコード（zlib使用・RGBA・最近傍拡大）----
const crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=crcTable[(c^b[i])&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const t=Buffer.from(type,'ascii');const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]);}
function savePNG(file){
  const w=W*SCALE, h=H*SCALE;
  const raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++){ raw[y*(w*4+1)]=0; const sy=(y/SCALE)|0;
    for(let x=0;x<w;x++){ const sx=(x/SCALE)|0, si=(sy*W+sx)*4, di=y*(w*4+1)+1+x*4;
      raw[di]=buf[si];raw[di+1]=buf[si+1];raw[di+2]=buf[si+2];raw[di+3]=buf[si+3]||255; } }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
  fs.writeFileSync(file,png);
}

// ---- ゲーム読み込み ----
globalThis.__HEADLESS=true;
const fakeCtx=makeCtx();
globalThis.document={getElementById:()=>({getContext:()=>fakeCtx, style:{}, width:W, height:H, addEventListener(){}})};
const file=path.join(__dirname,'..','index.html');
const code=fs.readFileSync(file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
vm.runInThisContext(code);
const G=globalThis.__GAME;

function shoot(name, setup){ clear(); setup(); G.draw(); savePNG(path.join(__dirname, name+'.png')); console.log('saved', name+'.png'); }

// 領域を切り出して高倍率で保存（細部確認用）
function savePNGCrop(file, cx, cy, cw, ch, sc){
  const w=cw*sc, h=ch*sc, raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++){ raw[y*(w*4+1)]=0; const sy=cy+((y/sc)|0);
    for(let x=0;x<w;x++){ const sx=cx+((x/sc)|0), si=(sy*W+sx)*4, di=y*(w*4+1)+1+x*4;
      raw[di]=buf[si];raw[di+1]=buf[si+1];raw[di+2]=buf[si+2];raw[di+3]=buf[si+3]||255; } }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
  fs.writeFileSync(file,png);
}
function shootCrop(name, setup, cx,cy,cw,ch,sc){ clear(); setup(); G.draw(); savePNGCrop(path.join(__dirname,name+'.png'),cx,cy,cw,ch,sc); console.log('saved',name+'.png'); }

// シーン1：タイトル
shoot('shot_title', ()=>{ G.state='title'; });

// シーン2：ゲームプレイ（プレイヤー＋敵が画面内）
shoot('shot_play', ()=>{ G.start(); G.player.x=450; for(let i=0;i<40;i++) G.step(); });

// シーン3：ボス戦
shoot('shot_boss', ()=>{ G.start(); G.player.x=G.consts.BOSS_TRIGGER+5; for(let i=0;i<5;i++) G.step(); for(let i=0;i<40;i++) G.step(); });

// クローズアップ：プレイヤー＋met＋walkerを拡大（細部確認）
shootCrop('shot_zoom_chars', ()=>{ G.start(); G.player.x=450; for(let i=0;i<40;i++) G.step(); }, 195, 188, 130, 56, 9);
// クローズアップ：ボス
shootCrop('shot_zoom_boss', ()=>{ G.start(); G.player.x=G.consts.BOSS_TRIGGER+5; for(let i=0;i<5;i++) G.step(); for(let i=0;i<40;i++) G.step(); }, 352, 152, 70, 70, 9);

console.log('done');
