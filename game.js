const canvas=document.getElementById("c"),ctx=canvas.getContext("2d");
const stats=document.getElementById("stats"),msg=document.getElementById("message"),screen=document.getElementById("startScreen"),startBtn=document.getElementById("start");
let W=0,H=0,playing=false,score=0,hp=100,ammo=12,yaw=0,pitch=0,last=0,spawnClock=0,shootFlash=0;
const keys={}; const enemies=[]; const worldSize=18;

function resize(){const r=canvas.getBoundingClientRect();canvas.width=Math.max(640,Math.floor(r.width*devicePixelRatio));canvas.height=Math.max(360,Math.floor(r.height*devicePixelRatio));W=canvas.width;H=canvas.height}
addEventListener("resize",resize);resize();

const player={x:0,z:8};
function reset(){score=0;hp=100;ammo=12;yaw=0;pitch=0;player.x=0;player.z=8;enemies.length=0;for(let i=0;i<4;i++)spawn();updateHud()}
function spawn(){if(enemies.length>=9)return;const a=Math.random()*Math.PI*2,d=7+Math.random()*9;enemies.push({x:Math.cos(a)*d,z:Math.sin(a)*d,hp:1,speed:.8+Math.random()*.6})}
function updateHud(){stats.textContent=`❤️ ${Math.max(0,hp)} · 🔫 ${ammo}/12 · ⭐ ${score}`}
function start(){reset();playing=true;screen.style.display="none";msg.textContent="";last=performance.now();requestAnimationFrame(loop);canvas.requestPointerLock?.()}
startBtn.onclick=start;
function reload(){if(!playing)return;ammo=12;msg.textContent="RECHARGÉ";setTimeout(()=>{if(playing)msg.textContent=""},450);updateHud()}
function shoot(){
 if(!playing)return;
 if(ammo<=0){msg.textContent="PLUS DE MUNITIONS — R";setTimeout(()=>{if(playing)msg.textContent=""},700);return}
 ammo--;shootFlash=.08;
 let best=null,bestAngle=.055;
 for(const e of enemies){
   const dx=e.x-player.x,dz=e.z-player.z,dist=Math.hypot(dx,dz);
   let a=Math.atan2(dx,dz)-yaw; a=Math.atan2(Math.sin(a),Math.cos(a));
   const tolerance=.035+0.15/dist;
   if(Math.abs(a)<bestAngle+tolerance && dist<22){best=e;bestAngle=Math.abs(a)}
 }
 if(best){best.hp--;score+=100;if(best.hp<=0){enemies.splice(enemies.indexOf(best),1);msg.textContent="TOUCHÉ !";setTimeout(()=>{if(playing)msg.textContent=""},300)}}
 updateHud()
}
canvas.addEventListener("click",()=>{if(playing){canvas.requestPointerLock?.();shoot()}});
document.addEventListener("mousemove",e=>{if(playing&&document.pointerLockElement===canvas){yaw+=e.movementX*.0022;pitch=Math.max(-.7,Math.min(.7,pitch-e.movementY*.0015))}});
document.addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==="r")reload();if(e.code==="Space")shoot()});
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

function move(dt){
 let fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw),sx=0,sz=0;
 if(keys.w||keys.z){sx+=fx;sz+=fz} if(keys.s){sx-=fx;sz-=fz}
 if(keys.d){sx+=rx;sz+=rz} if(keys.a||keys.q){sx-=rx;sz-=rz}
 const len=Math.hypot(sx,sz)||1, speed=5.5;
 player.x+=sx/len*speed*dt;player.z+=sz/len*speed*dt;
 player.x=Math.max(-worldSize,Math.min(worldSize,player.x));player.z=Math.max(-worldSize,Math.min(worldSize,player.z))
}
function project(x,y,z){
 const dx=x-player.x,dz=z-player.z;
 let ang=Math.atan2(dx,dz)-yaw;ang=Math.atan2(Math.sin(ang),Math.cos(ang));
 const depth=Math.cos(ang)*Math.hypot(dx,dz);
 if(depth<=.15||Math.abs(ang)>1.15)return null;
 const focal=W*.52, sx=W/2+Math.tan(ang)*focal;
 const sy=H*.52-(y-pitch*depth)*focal/depth;
 return {x:sx,y:sy,d:depth,s:focal/depth}
}
function draw(){
 ctx.clearRect(0,0,W,H);
 const sky=ctx.createLinearGradient(0,0,0,H*.55);sky.addColorStop(0,"#10213a");sky.addColorStop(1,"#91a0aa");ctx.fillStyle=sky;ctx.fillRect(0,0,W,H*.58);
 ctx.fillStyle="#171d23";ctx.fillRect(0,H*.58,W,H*.42);
 const horizon=H*.58;
 ctx.strokeStyle="#303b45";ctx.lineWidth=2;
 for(let i=-20;i<=20;i+=2){const p1=project(i,0,worldSize),p2=project(i,0,-worldSize);if(p1&&p2){ctx.beginPath();ctx.moveTo(p1.x,horizon);ctx.lineTo(p2.x,H);ctx.stroke()}}
 for(let z=1;z<30;z+=2){const p=project(0,0,z);if(p){ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(W,p.y);ctx.stroke()}}
 const visible=enemies.map(e=>({e,p:project(e.x,1.2,e.z)})).filter(o=>o.p).sort((a,b)=>b.p.d-a.p.d);
 for(const o of visible){const {p,e}=o,h=2.3*p.s,w=.8*p.s;ctx.fillStyle="#9f2027";ctx.fillRect(p.x-w/2,p.y-h*.65,w,h);ctx.fillStyle="#d99b7c";ctx.beginPath();ctx.arc(p.x,p.y-h*.78,w*.34,0,Math.PI*2);ctx.fill();ctx.fillStyle="#111";ctx.fillRect(p.x-w*.25,p.y-h*.8,w*.5,3)}
 ctx.fillStyle="#171a1e";ctx.fillRect(W*.43,H*.78,W*.14,H*.22);ctx.fillStyle="#30363d";ctx.fillRect(W*.46,H*.72,W*.08,H*.28);
 if(shootFlash>0){ctx.fillStyle="#ffd84d";ctx.beginPath();ctx.arc(W/2,H*.73,25+Math.random()*25,0,Math.PI*2);ctx.fill()}
}
function loop(t){if(!playing)return;const dt=Math.min(.05,(t-last)/1000);last=t;move(dt);spawnClock+=dt;shootFlash=Math.max(0,shootFlash-dt);if(spawnClock>1.8){spawn();spawnClock=0}
 for(const e of enemies){const dx=player.x-e.x,dz=player.z-e.z,d=Math.hypot(dx,dz);if(d>1.6){e.x+=dx/d*e.speed*dt;e.z+=dz/d*e.speed*dt}else{hp-=Math.max(0,12*dt);if(hp<=0){hp=0;playing=false;msg.textContent=`GAME OVER — ${score} POINTS`;screen.style.display="grid";startBtn.textContent="REJOUER";}updateHud()}}
 draw();requestAnimationFrame(loop)}
draw();updateHud();
