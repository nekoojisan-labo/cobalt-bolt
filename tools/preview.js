// 実素材プレビュー: index.html の ASSETS 設定どおりに実PNGを読み込み、
// ゲーム画面をPNG出力して「実際にスプライトが載った見た目」を確認する。
const fs=require('fs'), zlib=require('zlib'), vm=require('vm'), path=require('path');
const REPO=path.join(__dirname,'..');
const RS=4;                       // ゲームの内部レンダースケール(1920x1080)
const W=480*RS,H=270*RS,SCALE=1;  // フレームバッファ=実描画解像度
const buf=new Uint8Array(W*H*4); const clear=()=>buf.fill(0);
function parseColor(c){if(typeof c==='object'&&c&&c.__grad)return c;if(typeof c!=='string')return{r:255,g:0,b:255,a:1};c=c.trim();if(c[0]==='#'){let h=c.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:1};}const m=c.match(/rgba?\(([^)]+)\)/);if(m){const p=m[1].split(',').map(parseFloat);return{r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]};}return{r:255,g:0,b:255,a:1};}
function setPx(x,y,col){x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4,a=col.a===undefined?1:col.a;if(a<=0)return;if(a>=1){buf[i]=col.r;buf[i+1]=col.g;buf[i+2]=col.b;buf[i+3]=255;}else{buf[i]=col.r*a+buf[i]*(1-a);buf[i+1]=col.g*a+buf[i+1]*(1-a);buf[i+2]=col.b*a+buf[i+2]*(1-a);buf[i+3]=255;}}
function decodePNG(b){let p=8,width,height,bitDepth,colorType,interlace,palette=null,trns=null;const idat=[];while(p<b.length){const len=b.readUInt32BE(p);const type=b.toString('ascii',p+4,p+8);const data=b.slice(p+8,p+8+len);p+=12+len;if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];interlace=data[12];}else if(type==='PLTE')palette=data;else if(type==='tRNS')trns=data;else if(type==='IDAT')idat.push(data);else if(type==='IEND')break;}if(interlace)throw new Error('interlaced');const raw=zlib.inflateSync(Buffer.concat(idat));const channels={0:1,2:3,3:1,4:2,6:4}[colorType];const bits=channels*bitDepth;const stride=Math.ceil(bits*width/8),fbpp=Math.max(1,Math.ceil(bits/8));const out=Buffer.alloc(stride*height);let prev=Buffer.alloc(stride);for(let y=0;y<height;y++){const ft=raw[y*(stride+1)];const cur=raw.slice(y*(stride+1)+1,y*(stride+1)+1+stride);const rec=Buffer.alloc(stride);for(let i=0;i<stride;i++){const a=i>=fbpp?rec[i-fbpp]:0,bb=prev[i],c=i>=fbpp?prev[i-fbpp]:0,x=cur[i];let v;if(ft===0)v=x;else if(ft===1)v=x+a;else if(ft===2)v=x+bb;else if(ft===3)v=x+((a+bb)>>1);else if(ft===4){const pa=Math.abs(bb-c),pb=Math.abs(a-c),pc=Math.abs(a+bb-2*c);const pr=(pa<=pb&&pa<=pc)?a:(pb<=pc)?bb:c;v=x+pr;}else v=x;rec[i]=v&0xff;}rec.copy(out,y*stride);prev=rec;}const data=Buffer.alloc(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(colorType===6){const o=y*stride+x*4;data[i]=out[o];data[i+1]=out[o+1];data[i+2]=out[o+2];data[i+3]=out[o+3];}else if(colorType===2){const o=y*stride+x*3;data[i]=out[o];data[i+1]=out[o+1];data[i+2]=out[o+2];data[i+3]=255;}else if(colorType===0){const o=y*stride+x;data[i]=data[i+1]=data[i+2]=out[o];data[i+3]=255;}else if(colorType===4){const o=y*stride+x*2;data[i]=data[i+1]=data[i+2]=out[o];data[i+3]=out[o+1];}else if(colorType===3){let idx;if(bitDepth===8)idx=out[y*stride+x];else{const per=8/bitDepth;const by=out[y*stride+Math.floor(x/per)];const sh=8-bitDepth*((x%per)+1);idx=(by>>sh)&((1<<bitDepth)-1);}data[i]=palette[idx*3];data[i+1]=palette[idx*3+1];data[i+2]=palette[idx*3+2];data[i+3]=trns&&idx<trns.length?trns[idx]:255;}}return{width,height,data};}
let t={a:1,b:0,c:0,d:1,e:0,f:0};const stack=[];   // フルアフィン[[a,c,e],[b,d,f]]
function _dev(x,y){return {x:t.a*x+t.c*y+t.e, y:t.b*x+t.d*y+t.f};}
function _inv(X,Y){const det=t.a*t.d-t.b*t.c||1e-9,dx=X-t.e,dy=Y-t.f;return {x:(t.d*dx-t.c*dy)/det, y:(-t.b*dx+t.a*dy)/det};}
function gradColor(s,u){if(!s.length)return{r:0,g:0,b:0,a:1};if(u<=s[0].o)return s[0].c;for(let i=1;i<s.length;i++){if(u<=s[i].o){const a=s[i-1],b=s[i],k=(u-a.o)/((b.o-a.o)||1);return{r:a.c.r+(b.c.r-a.c.r)*k,g:a.c.g+(b.c.g-a.c.g)*k,b:a.c.b+(b.c.b-a.c.b)*k,a:1};}}return s[s.length-1].c;}
const ctx={imageSmoothingEnabled:false,fillStyle:'#000',strokeStyle:'#000',lineWidth:1,lineCap:'butt',globalAlpha:1,font:'',textAlign:'left',textBaseline:'alphabetic',
  save(){stack.push({...t});},restore(){if(stack.length)t=stack.pop();},
  translate(dx,dy){t.e+=t.a*dx+t.c*dy;t.f+=t.b*dx+t.d*dy;},
  scale(ax,ay){t.a*=ax;t.b*=ax;t.c*=ay;t.d*=ay;},
  rotate(r){const co=Math.cos(r),si=Math.sin(r),a=t.a,b=t.b,c=t.c,d=t.d;t.a=a*co+c*si;t.b=b*co+d*si;t.c=-a*si+c*co;t.d=-b*si+d*co;},
  setTransform(a,b,c,d,e,f){t={a,b,c,d,e,f};},
  createLinearGradient(x0,y0,x1,y1){const p0=_dev(x0,y0),p1=_dev(x1,y1);return{__grad:true,p0,p1,stops:[],addColorStop(o,c){this.stops.push({o,c:parseColor(c)});}};},
  beginPath(){},closePath(){},moveTo(){},lineTo(){},stroke(){},arc(){},ellipse(){},fill(){},   // 未使用(骨格はfillRectのみ)
  fillText(){},
  fillRect(x,y,w,h){const c0=_dev(x,y),c1=_dev(x+w,y),c2=_dev(x+w,y+h),c3=_dev(x,y+h);
    const X0=Math.floor(Math.min(c0.x,c1.x,c2.x,c3.x)),X1=Math.ceil(Math.max(c0.x,c1.x,c2.x,c3.x)),Y0=Math.floor(Math.min(c0.y,c1.y,c2.y,c3.y)),Y1=Math.ceil(Math.max(c0.y,c1.y,c2.y,c3.y));
    const fs=this.fillStyle,grad=fs&&fs.__grad,col=grad?null:parseColor(fs),ga=this.globalAlpha;
    for(let py=Y0;py<Y1;py++)for(let px=X0;px<X1;px++){const L=_inv(px+0.5,py+0.5);if(L.x<x||L.x>=x+w||L.y<y||L.y>=y+h)continue;
      if(grad){const gx=fs.p1.x-fs.p0.x,gy=fs.p1.y-fs.p0.y,l2=(gx*gx+gy*gy)||1;let u=((px-fs.p0.x)*gx+(py-fs.p0.y)*gy)/l2;u=u<0?0:u>1?1:u;setPx(px,py,gradColor(fs.stops,u));}
      else setPx(px,py,ga<1?{r:col.r,g:col.g,b:col.b,a:(col.a===undefined?1:col.a)*ga}:col);}},
  drawImage(img){const a=[...arguments];let sx,sy,sw,sh,dx,dy,dw,dh;if(a.length>=9){[,sx,sy,sw,sh,dx,dy,dw,dh]=a;}else if(a.length===5){sx=0;sy=0;sw=img.width;sh=img.height;[,dx,dy,dw,dh]=a;}else{sx=0;sy=0;sw=img.width;sh=img.height;[,dx,dy]=a;dw=sw;dh=sh;}
    const c0=_dev(dx,dy),c1=_dev(dx+dw,dy),c2=_dev(dx+dw,dy+dh),c3=_dev(dx,dy+dh);
    const X0=Math.floor(Math.min(c0.x,c1.x,c2.x,c3.x)),X1=Math.ceil(Math.max(c0.x,c1.x,c2.x,c3.x)),Y0=Math.floor(Math.min(c0.y,c1.y,c2.y,c3.y)),Y1=Math.ceil(Math.max(c0.y,c1.y,c2.y,c3.y));
    for(let py=Y0;py<Y1;py++)for(let px=X0;px<X1;px++){const L=_inv(px+0.5,py+0.5),u=(L.x-dx)/dw,v=(L.y-dy)/dh;if(u<0||u>=1||v<0||v>=1)continue;
      const sX=Math.min(img.width-1,Math.floor(sx+u*sw)),sY=Math.min(img.height-1,Math.floor(sy+v*sh)),o=(sY*img.width+sX)*4;setPx(px,py,{r:img.data[o],g:img.data[o+1],b:img.data[o+2],a:img.data[o+3]/255});}}
};
class Image{set src(p){try{const c=String(p).split('?')[0];const fp=path.isAbsolute(c)?c:path.join(REPO,c);const d=decodePNG(fs.readFileSync(fp));this.width=d.width;this.height=d.height;this.data=d.data;if(this.onload)this.onload();}catch(e){if(this.onerror)this.onerror(e);}}}
globalThis.Image=Image;
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=b=>{let c=0xffffffff;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&0xff]^(c>>>8);return(c^0xffffffff)>>>0;};
const chunk=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const tt=Buffer.from(ty,'ascii');const cr=Buffer.alloc(4);cr.writeUInt32BE(crc32(Buffer.concat([tt,d])));return Buffer.concat([l,tt,d,cr]);};
function save(file,crop){let cx=0,cy=0,cw=W,ch=H,sc=SCALE;if(crop)[cx,cy,cw,ch,sc]=crop;const w=cw*sc,h=ch*sc,raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;const sy=cy+((y/sc)|0);for(let x=0;x<w;x++){const sx=cx+((x/sc)|0),si=(sy*W+sx)*4,di=y*(w*4+1)+1+x*4;raw[di]=buf[si];raw[di+1]=buf[si+1];raw[di+2]=buf[si+2];raw[di+3]=buf[si+3]||255;}}const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));}

globalThis.__HEADLESS=true;
globalThis.document={getElementById:()=>({getContext:()=>ctx,style:{},width:W,height:H,addEventListener(){}})};
vm.runInThisContext(fs.readFileSync(path.join(REPO,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]);
const G=globalThis.__GAME;
G.loadAssets(); // index.html の ASSETS をそのまま読み込む（実PNG）
const rd=G.assets.player&&G.assets.player.anims.idle.ready;
console.log('player idle ready =', rd, ' run ready =', G.assets.player&&G.assets.player.anims.run.ready);

// device座標(=ワールド×RS)でプレイヤー周辺を切り出す
const zoom=()=>{ const dx=Math.round((G.player.x-G.camX)*RS); return [Math.max(0,dx-160),600,360,360,3]; };
// loading（起動時のローディング画面）
clear(); G.state='loading'; G.draw(); save(path.join(__dirname,'preview_loading.png'));
// idle（静止・敵あり全景）
clear(); G.start(); G.player.x=450; for(let i=0;i<40;i++)G.step(); G.draw();
save(path.join(__dirname,'preview_play.png'));                       // 1920x1080 全景
save(path.join(__dirname,'preview_idle_zoom.png'), zoom());
{ const dx=Math.round((G.player.x-G.camX+G.player.w/2)*RS); save(path.join(__dirname,'preview_idle_tight.png'),[Math.max(0,dx-130),690,260,300,5]); } // 立ちの高倍率(継ぎ目診断)
// clean idle(敵なし・確実に静止) ハイブリッド確認=元の主人公1枚絵が出るはず
clear(); G.start(); G.enemies.length=0; G.player.x=300; for(let i=0;i<30;i++){G.releaseAll();G.step();} G.draw();
{ const dx=Math.round((G.player.x-G.camX+G.player.w/2)*RS); save(path.join(__dirname,'preview_standidle.png'),[Math.max(0,dx-110),680,230,230,4]); }
// run（右）敵除外でクリーンに
clear(); G.start(); G.enemies.length=0; G.player.x=160; for(let i=0;i<30;i++){G.hold('arrowright');G.step();} G.draw();
save(path.join(__dirname,'preview_run_zoom.png'), zoom());
// run（左）
clear(); G.start(); G.enemies.length=0; G.player.x=300; for(let i=0;i<30;i++){G.release('arrowright');G.hold('arrowleft');G.step();} G.draw();
save(path.join(__dirname,'preview_left_zoom.png'), zoom());
// shoot（弾と砲口の位置合わせ確認）
clear(); G.start(); G.enemies.length=0; G.releaseAll(); for(let i=0;i<8;i++)G.step(); G.player.x=280; G.player.dir=1;
G.hold('x'); G.step(); G.draw(); G.release('x');   // 発射直後（弾が砲口直近）
{ const dx=Math.round((G.player.x-G.camX)*RS); save(path.join(__dirname,'preview_shoot_zoom.png'),[Math.max(0,dx-120),520,640,460,2]); }
// charge shot（チャージ弾の見た目）
clear(); G.start(); G.enemies.length=0; G.releaseAll(); for(let i=0;i<8;i++)G.step(); G.player.x=240; G.player.dir=1;
for(let i=0;i<50;i++){G.hold('x');G.step();} G.release('x'); G.step(); G.step(); G.draw();
{ const dx=Math.round((G.player.x-G.camX)*RS); save(path.join(__dirname,'preview_charge_zoom.png'),[Math.max(0,dx-120),460,820,560,2]); }
// runshoot（走りながら射撃）
clear(); G.start(); G.enemies.length=0; G.player.x=160; G.player.dir=1;
for(let i=0;i<12;i++){G.hold('arrowright');G.step();}
G.hold('x'); G.step(); G.release('x'); G.hold('arrowright'); G.step(); G.draw();
{ const dx=Math.round((G.player.x-G.camX)*RS); save(path.join(__dirname,'preview_runshoot_zoom.png'),[Math.max(0,dx-160),600,380,380,3]); }
// boss（ボス部屋・構え）
clear(); G.start(); G.player.x=G.consts.BOSS_TRIGGER+5; for(let i=0;i<5;i++)G.step();
G.boss.state='idle'; G.boss.timer=0; for(let i=0;i<12;i++)G.step(); G.draw();
save(path.join(__dirname,'preview_boss.png'));
{ const bx=Math.round((G.boss.x-G.camX)*RS); save(path.join(__dirname,'preview_boss_idle_zoom.png'),[Math.max(0,bx-180),300,760,760,2]); }
// boss 溜め（専用キャノンcharge: timer<18）入場後に状態上書き
clear(); G.start(); G.player.x=G.consts.BOSS_TRIGGER+5; for(let i=0;i<5;i++)G.step();
G.boss.state='idle'; for(let i=0;i<12;i++)G.step(); G.boss.state='shoot'; G.boss.timer=8; G.draw();
{ const bx=Math.round((G.boss.x-G.camX)*RS); save(path.join(__dirname,'preview_boss_charge_zoom.png'),[Math.max(0,bx-180),300,760,760,2]); }
// boss 発射（専用キャノンfire: 実際に弾を出して砲口との一致を確認）
clear(); G.start(); G.player.x=G.consts.BOSS_TRIGGER+5; for(let i=0;i<5;i++)G.step();
G.boss.state='idle'; for(let i=0;i<12;i++)G.step(); G.boss.state='shoot'; G.boss.timer=0;
for(let i=0;i<22;i++)G.step(); G.draw();   // timer18で発射→弾がキャノン先端から出るのを確認
{ const bx=Math.round((G.boss.x-G.camX)*RS); save(path.join(__dirname,'preview_boss_fire_zoom.png'),[Math.max(0,bx-260),300,820,760,2]); }
// 骨格 走りサイクル 8位相フィルムストリップ(手足が交互に動くか確認)
clear(); G.start(); G.enemies.length=0; G.player.x=300; for(let i=0;i<6;i++)G.step();
G.player.onGround=true; G.player.vx=3.2; G.player.fireHold=0; G.player.charge=0;
for(let i=0;i<8;i++){ clear(); G.player.anim=i*0.92; G.draw();
  const dx=Math.round((G.player.x-G.camX+G.player.w/2)*RS);
  save(path.join(__dirname,'preview_skelrun'+i+'.png'),[Math.max(0,dx-70),700,150,180,4]); }
// 骨格 走り撃ち(fireHoldで腕前方保持・脚は走り)
clear(); G.player.fireHold=18; G.player.charge=0; G.player.anim=2; G.draw();
{ const dx=Math.round((G.player.x-G.camX+G.player.w/2)*RS); save(path.join(__dirname,'preview_skelrunshoot.png'),[Math.max(0,dx-80),700,180,180,4]); }
// 骨格 走りチャージ(白■バグ確認=チャージ弾スプライトが出るはず)
clear(); G.player.fireHold=0; G.player.charge=45; G.player.anim=2; G.draw();
{ const dx=Math.round((G.player.x-G.camX+G.player.w/2)*RS); save(path.join(__dirname,'preview_skelruncharge.png'),[Math.max(0,dx-90),690,210,200,4]); }
G.player.charge=0;
console.log('preview saved (1920x1080): play/idle/run/left/shoot/charge/boss/boss_charge/boss_fire/skelrun0-7');
