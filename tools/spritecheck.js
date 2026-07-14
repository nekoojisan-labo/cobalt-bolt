// スプライト画像パイプライン検証ツール
// PNGをデコードして drawImage 対応エミュでゲームをレンダリングし、
// 「assets配置→ゲームに高精細スプライトが載る」ことをPNGで実証する。
// 実素材が無い段階の確認用に、合成テストスプライト(青ロボ)を自動生成して検証する。
const fs=require('fs'), zlib=require('zlib'), vm=require('vm'), path=require('path');
const W=480,H=270,SCALE=3;
const buf=new Uint8Array(W*H*4);
const clear=()=>buf.fill(0);

function parseColor(c){
  if(typeof c==='object'&&c&&c.__grad)return c;
  if(typeof c!=='string')return{r:255,g:0,b:255,a:1};
  c=c.trim();
  if(c[0]==='#'){let h=c.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:1};}
  const m=c.match(/rgba?\(([^)]+)\)/);if(m){const p=m[1].split(',').map(parseFloat);return{r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]};}
  return{r:255,g:0,b:255,a:1};
}
function setPx(x,y,col){x|=0;y|=0;if(x<0||y<0||x>=W||y>=H)return;const i=(y*W+x)*4,a=col.a===undefined?1:col.a;if(a<=0)return;if(a>=1){buf[i]=col.r;buf[i+1]=col.g;buf[i+2]=col.b;buf[i+3]=255;}else{buf[i]=col.r*a+buf[i]*(1-a);buf[i+1]=col.g*a+buf[i+1]*(1-a);buf[i+2]=col.b*a+buf[i+2]*(1-a);buf[i+3]=255;}}

// ---- PNG デコード（type 2/3/6, 8bit中心, interlace無し）----
function decodePNG(b){
  let p=8,width,height,bitDepth,colorType,interlace,palette=null,trns=null;const idat=[];
  while(p<b.length){const len=b.readUInt32BE(p);const type=b.toString('ascii',p+4,p+8);const data=b.slice(p+8,p+8+len);p+=12+len;
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];interlace=data[12];}
    else if(type==='PLTE')palette=data; else if(type==='tRNS')trns=data; else if(type==='IDAT')idat.push(data); else if(type==='IEND')break;}
  if(interlace)throw new Error('interlaced unsupported');
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const channels={0:1,2:3,3:1,4:2,6:4}[colorType];const bits=channels*bitDepth;
  const stride=Math.ceil(bits*width/8),fbpp=Math.max(1,Math.ceil(bits/8));
  const out=Buffer.alloc(stride*height);let prev=Buffer.alloc(stride);
  for(let y=0;y<height;y++){const ft=raw[y*(stride+1)];const cur=raw.slice(y*(stride+1)+1,y*(stride+1)+1+stride);const rec=Buffer.alloc(stride);
    for(let i=0;i<stride;i++){const a=i>=fbpp?rec[i-fbpp]:0,bb=prev[i],c=i>=fbpp?prev[i-fbpp]:0,x=cur[i];let v;
      if(ft===0)v=x;else if(ft===1)v=x+a;else if(ft===2)v=x+bb;else if(ft===3)v=x+((a+bb)>>1);
      else if(ft===4){const pa=Math.abs(bb-c),pb=Math.abs(a-c),pc=Math.abs(a+bb-2*c);const pr=(pa<=pb&&pa<=pc)?a:(pb<=pc)?bb:c;v=x+pr;}else v=x;
      rec[i]=v&0xff;}
    rec.copy(out,y*stride);prev=rec;}
  const data=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;
    if(colorType===6){const o=y*stride+x*4;data[i]=out[o];data[i+1]=out[o+1];data[i+2]=out[o+2];data[i+3]=out[o+3];}
    else if(colorType===2){const o=y*stride+x*3;data[i]=out[o];data[i+1]=out[o+1];data[i+2]=out[o+2];data[i+3]=255;}
    else if(colorType===0){const o=y*stride+x;data[i]=data[i+1]=data[i+2]=out[o];data[i+3]=255;}
    else if(colorType===4){const o=y*stride+x*2;data[i]=data[i+1]=data[i+2]=out[o];data[i+3]=out[o+1];}
    else if(colorType===3){let idx;if(bitDepth===8)idx=out[y*stride+x];else{const per=8/bitDepth;const by=out[y*stride+Math.floor(x/per)];const sh=8-bitDepth*((x%per)+1);idx=(by>>sh)&((1<<bitDepth)-1);}
      data[i]=palette[idx*3];data[i+1]=palette[idx*3+1];data[i+2]=palette[idx*3+2];data[i+3]=trns&&idx<trns.length?trns[idx]:255;}}
  return{width,height,data};
}

// ---- Canvas2D 互換（drawImage対応）----
let t={a:1,b:0,c:0,d:1,e:0,f:0};const stack=[];
function dev(x,y){return{x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f};}
function inv(X,Y){const det=t.a*t.d-t.b*t.c||1e-9,dx=X-t.e,dy=Y-t.f;return{x:(t.d*dx-t.c*dy)/det,y:(-t.b*dx+t.a*dy)/det};}
function gradColor(stops,u){if(!stops.length)return{r:0,g:0,b:0,a:1};if(u<=stops[0].o)return stops[0].c;for(let i=1;i<stops.length;i++){if(u<=stops[i].o){const a=stops[i-1],b=stops[i],k=(u-a.o)/((b.o-a.o)||1);return{r:a.c.r+(b.c.r-a.c.r)*k,g:a.c.g+(b.c.g-a.c.g)*k,b:a.c.b+(b.c.b-a.c.b)*k,a:1};}}return stops[stops.length-1].c;}
const ctx={imageSmoothingEnabled:false,fillStyle:'#000',font:'',textAlign:'left',textBaseline:'alphabetic',
  save(){stack.push({...t});},restore(){if(stack.length)t=stack.pop();},
  translate(dx,dy){t.e+=t.a*dx+t.c*dy;t.f+=t.b*dx+t.d*dy;},
  scale(ax,ay){t.a*=ax;t.b*=ax;t.c*=ay;t.d*=ay;},
  rotate(r){const co=Math.cos(r),si=Math.sin(r),a=t.a,b=t.b,c=t.c,d=t.d;t.a=a*co+c*si;t.b=b*co+d*si;t.c=-a*si+c*co;t.d=-b*si+d*co;},
  setTransform(a,b,c,d,e,f){t={a,b,c,d,e,f};},
  beginPath(){},closePath(){},moveTo(){},lineTo(){},stroke(){},arc(){},ellipse(){},fill(){},
  createLinearGradient(x0,y0,x1,y1){return{__grad:true,p0:dev(x0,y0),p1:dev(x1,y1),stops:[],addColorStop(o,c){this.stops.push({o,c:parseColor(c)});}};},
  fillRect(x,y,w,h){const c0=dev(x,y),c1=dev(x+w,y),c2=dev(x+w,y+h),c3=dev(x,y+h);
    const x0=Math.floor(Math.min(c0.x,c1.x,c2.x,c3.x)),x1=Math.ceil(Math.max(c0.x,c1.x,c2.x,c3.x)),y0=Math.floor(Math.min(c0.y,c1.y,c2.y,c3.y)),y1=Math.ceil(Math.max(c0.y,c1.y,c2.y,c3.y));const fs=this.fillStyle;
    if(fs&&fs.__grad){const gx=fs.p1.x-fs.p0.x,gy=fs.p1.y-fs.p0.y,l2=(gx*gx+gy*gy)||1;for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++){const q=inv(px+0.5,py+0.5);if(q.x<x||q.x>=x+w||q.y<y||q.y>=y+h)continue;let u=((px-fs.p0.x)*gx+(py-fs.p0.y)*gy)/l2;u=u<0?0:u>1?1:u;setPx(px,py,gradColor(fs.stops,u));}}
    else{const col=parseColor(fs);for(let py=y0;py<y1;py++)for(let px=x0;px<x1;px++){const q=inv(px+0.5,py+0.5);if(q.x<x||q.x>=x+w||q.y<y||q.y>=y+h)continue;setPx(px,py,col);}}},
  fillText(){/* 検証では省略 */},
  drawImage(img){const a=[...arguments];let sx,sy,sw,sh,dx,dy,dw,dh;
    if(a.length>=9){[,sx,sy,sw,sh,dx,dy,dw,dh]=a;}else if(a.length===5){sx=0;sy=0;sw=img.width;sh=img.height;[,dx,dy,dw,dh]=a;}else{sx=0;sy=0;sw=img.width;sh=img.height;[,dx,dy]=a;dw=sw;dh=sh;}
    const c0=dev(dx,dy),c1=dev(dx+dw,dy),c2=dev(dx+dw,dy+dh),c3=dev(dx,dy+dh);
    const X0=Math.floor(Math.min(c0.x,c1.x,c2.x,c3.x)),X1=Math.ceil(Math.max(c0.x,c1.x,c2.x,c3.x)),Y0=Math.floor(Math.min(c0.y,c1.y,c2.y,c3.y)),Y1=Math.ceil(Math.max(c0.y,c1.y,c2.y,c3.y));
    for(let py=Y0;py<Y1;py++)for(let px=X0;px<X1;px++){
      const q=inv(px+0.5,py+0.5),u=(q.x-dx)/dw,v=(q.y-dy)/dh;if(u<0||u>=1||v<0||v>=1)continue;
      const srcX=Math.min(img.width-1,Math.floor(sx+u*sw)),srcY=Math.min(img.height-1,Math.floor(sy+v*sh));const o=(srcY*img.width+srcX)*4;
      setPx(px,py,{r:img.data[o],g:img.data[o+1],b:img.data[o+2],a:img.data[o+3]/255});}}
};

// ---- Image シム（PNG即時デコード）----
class Image{set src(p){try{const c=String(p).split('?')[0];const d=decodePNG(fs.readFileSync(c));this.width=d.width;this.height=d.height;this.data=d.data;if(this.onload)this.onload();}catch(e){if(this.onerror)this.onerror(e);}}}
globalThis.Image=Image;

// ---- PNG書き出し ----
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=b=>{let c=0xffffffff;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&0xff]^(c>>>8);return(c^0xffffffff)>>>0;};
const chunk=(ty,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const t=Buffer.from(ty,'ascii');const cr=Buffer.alloc(4);cr.writeUInt32BE(crc32(Buffer.concat([t,d])));return Buffer.concat([l,t,d,cr]);};
function writePNG(file,w,h,rgba){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;rgba.copy(raw,y*(w*4+1)+1,y*w*4,y*w*4+w*4);}const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));}
function savePNG(file,crop){let cx=0,cy=0,cw=W,ch=H,sc=SCALE;if(crop){[cx,cy,cw,ch,sc]=crop;}const w=cw*sc,h=ch*sc,out=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++){const sy=cy+((y/sc)|0);for(let x=0;x<w;x++){const sx=cx+((x/sc)|0),si=(sy*W+sx)*4,di=(y*w+x)*4;out[di]=buf[si];out[di+1]=buf[si+1];out[di+2]=buf[si+2];out[di+3]=buf[si+3]||255;}}
  writePNG(file,w,h,out);}

// ---- 合成テストスプライト（青ロボ・透過）----
function genRobotStrip(file,frames,kind){
  const F=48,w=F*frames,h=F,img=Buffer.alloc(w*h*4); // 透明初期
  const sp=(fx,x,y,c)=>{const X=fx*F+x;if(x<0||y<0||x>=F||y>=F||X<0||X>=w)return;const o=(y*w+X)*4;img[o]=c[0];img[o+1]=c[1];img[o+2]=c[2];img[o+3]=c[3]===undefined?255:c[3];};
  const rect=(fx,x,y,ww,hh,c)=>{for(let j=0;j<hh;j++)for(let i=0;i<ww;i++)sp(fx,x+i,y+j,c);};
  const O=[8,16,40],B=[60,120,250],BL=[24,70,150],CY=[180,235,255],WH=[255,255,255],EY=[18,30,80],GUN=[200,220,245];
  for(let fx=0;fx<frames;fx++){
    const bob=kind==='idle'?(fx%2):0;          // 待機の上下
    const legShift=kind==='run'?(fx%2?3:-3):0;  // 走り
    const cy=14+bob;
    // 脚
    rect(fx,16-legShift,38,7,8,O); rect(fx,17-legShift,39,5,6,BL);
    rect(fx,25+legShift,38,7,8,O); rect(fx,26+legShift,39,5,6,BL);
    rect(fx,15,44,9,3,CY); rect(fx,26,44,9,3,CY);
    // 胴
    rect(fx,15,cy-1,19,16,O); rect(fx,16,cy,17,14,B); rect(fx,16,cy,17,4,[110,170,255]); rect(fx,16,cy+11,17,3,BL);
    rect(fx,16,cy,3,14,[110,170,255]); rect(fx,21,cy+3,8,7,CY); rect(fx,23,cy+5,4,4,WH);
    // 腕・バスター
    rect(fx,31,cy+3,12,8,O); rect(fx,32,cy+4,11,6,GUN); rect(fx,41,cy+5,2,4,WH);
    // 顔
    rect(fx,16,3+bob,17,12,O); rect(fx,18,5+bob,13,9,[255,210,160]);
    rect(fx,21,8+bob,3,4,EY); rect(fx,27,8+bob,3,4,EY); rect(fx,27,8+bob,1,1,[150,180,255]);
    // ヘルメット
    rect(fx,15,1+bob,19,7,O); rect(fx,16,2+bob,17,5,B); rect(fx,16,2+bob,17,2,[140,194,255]);
    rect(fx,29,3+bob,4,4,CY); rect(fx,20,-1+bob,8,2,CY);
    // フレーム番号ピップ（確認用）
    for(let k=0;k<=fx;k++) rect(fx,2+k*3,2,2,2,[255,80,80]);
  }
  writePNG(file,w,h,img);
}

// ---- ゲーム読込（drawImage対応ctxを注入）----
globalThis.__HEADLESS=true;
globalThis.document={getElementById:()=>({getContext:()=>ctx,style:{},width:W,height:H,addEventListener(){}})};
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]);
const G=globalThis.__GAME;

const idlePath=path.join(__dirname,'_test_player_idle.png');
const runPath =path.join(__dirname,'_test_player_run.png');
genRobotStrip(idlePath,4,'idle');
genRobotStrip(runPath,6,'run');

// 検証用に player の高精細スプライトを設定
G.assets.player={ fw:48, fh:48, scale:0.62, ax:0.5, ay:1, anims:{
  idle:{src:idlePath, frames:4, fps:6},
  run :{src:runPath,  frames:6, fps:12},
}};
G.loadAssets();

// シーン：プレイヤー＋敵（敵はコード絵のまま＝混在確認）
clear(); G.start(); G.player.x=450; for(let i=0;i<40;i++) G.step(); G.draw();
savePNG(path.join(__dirname,'sprite_play.png'));
savePNG(path.join(__dirname,'sprite_zoom.png'),[200,176,120,68,9]);
// 左向き確認
clear(); G.start(); G.player.x=450; for(let i=0;i<40;i++) G.step(); G.player.dir=-1; G.draw();
savePNG(path.join(__dirname,'sprite_left.png'),[200,176,120,68,9]);

// 後片付け（生成テスト画像）
fs.unlinkSync(idlePath); fs.unlinkSync(runPath);
console.log('sprite check rendered: tools/sprite_play.png, sprite_zoom.png, sprite_left.png');
console.log('player sprite ready =', G.assets.player.anims.idle.ready, ' frames idle/run =', G.assets.player.anims.idle.frames, G.assets.player.anims.run.frames);
