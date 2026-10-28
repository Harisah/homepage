(() => {
  const canvas = document.getElementById("space-canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  // A transparent overlay lets the pixie-dust trail sit above page content.
  const trailCanvas = document.createElement("canvas");
  trailCanvas.setAttribute("aria-hidden", "true");
  Object.assign(trailCanvas.style, {
    position: "fixed", inset: "0", width: "100%", height: "100%",
    zIndex: "9999", pointerEvents: "none"
  });
  document.body.appendChild(trailCanvas);
  const trailCtx = trailCanvas.getContext("2d", { alpha: true });
  const sparkles = [];
  let lastPointer = null;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const themeToggle = document.getElementById("theme-toggle");
  const themeMeta = document.getElementById("theme-color-meta");
  const savedTheme = (() => { try { return localStorage.getItem("cosmic-portfolio-theme"); } catch (_) { return null; } })();
  const pointer = { x: -1000, y: -1000, active: false };

  function setTheme(theme) {
    const light = theme === "light";
    document.documentElement.dataset.theme = light ? "light" : "dark";
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(light));
      themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      themeToggle.innerHTML = light
        ? '<span class="theme-toggle-icon" aria-hidden="true">☾</span>'
        : '<span class="theme-toggle-icon" aria-hidden="true">☼</span>';
    }
    if (themeMeta) themeMeta.setAttribute("content", light ? "#f5f3fb" : "#070914");
    try { localStorage.setItem("cosmic-portfolio-theme", light ? "light" : "dark"); } catch (_) {}
  }
  setTheme(savedTheme === "light" ? "light" : "dark");
  themeToggle?.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"));
  const planets = [
    ["Mercury","#b7a99b",3.5,.105,.78,.3,.9,"rock"],
    ["Venus","#e6c49a",5.5,.17,.53,1.5,1.15,"bands"],
    ["Earth","#72b8f2",6.4,.235,.40,2.8,1.2,"earth"],
    ["Mars","#e58a6c",4.8,.30,.32,3.7,1,"rock"],
    ["Jupiter","#d9b38c",10,.39,.20,4.7,1.7,"bands"],
    ["Saturn","#e8d29b",8.5,.48,.15,5.4,1.5,"saturn"],
    ["Uranus","#8adbdc",7,.57,.11,2,1.3,"bands"],
    ["Neptune","#7398ff",7,.66,.085,.8,1.3,"bands"],
  ].map(([name,color,radius,orbit,speed,phase,mass,texture]) =>
    ({name,color,radius,orbit,speed,phase,mass,texture,ox:0,oy:0,vx:0,vy:0}));

  let width=0,height=0,dpr=1,last=0,elapsed=0,stars=[];
  const rand=(a,b)=>Math.random()*(b-a)+a;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function resize(){
    dpr=Math.min(devicePixelRatio||1,2); width=innerWidth;height=innerHeight;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    canvas.style.width=width+"px";canvas.style.height=height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    trailCanvas.width=Math.round(width*dpr);trailCanvas.height=Math.round(height*dpr);
    trailCanvas.style.width=width+"px";trailCanvas.style.height=height+"px";
    trailCtx.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.min(260,Math.floor(width*height/4800))},(_,i)=>({
      x:Math.random()*width,y:Math.random()*height,r:rand(.35,i%5===0?1.8:1.1),
      alpha:rand(.16,.72),twinkle:rand(.4,2),phase:rand(0,Math.PI*2),layer:i%3+1
    }));
  }
  function system(){
    return {x:width*(width<700?.72:.71),y:height*.53,
      scale:Math.min(width,height)*(width<700?.00105:.00112)};
  }
  function shade(hex,n){
    const v=parseInt(hex.slice(1),16);
    return `rgb(${clamp((v>>16)+n,0,255)},${clamp(((v>>8)&255)+n,0,255)},${clamp((v&255)+n,0,255)})`;
  }
  function nebula(time){
    const drift=reduced?0:Math.sin(time*.00008)*22;
    const light = document.documentElement.dataset.theme === "light";
    [
      [width*.76+drift,height*.26,Math.min(width,height)*.44,light?"rgba(145,124,210,.14)":"rgba(82,72,164,.11)"],
      [width*.88-drift,height*.69,Math.min(width,height)*.35,light?"rgba(55,159,171,.10)":"rgba(63,128,157,.075)"],
      [width*.52-drift*.4,height*.52,Math.min(width,height)*.26,light?"rgba(204,128,169,.075)":"rgba(143,77,133,.05)"]
    ].forEach(([x,y,r,c])=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,c);g.addColorStop(1,"rgba(10,12,30,0)");
      ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    });
  }
  function drawStars(time){
    for(const s of stars){
      const p=reduced?0:s.layer*.006;
      const x=s.x+(pointer.active?(pointer.x-width/2)*p:0);
      const y=s.y+(pointer.active?(pointer.y-height/2)*p:0);
      const shimmer=reduced?.82:.64+Math.sin(time*.001*s.twinkle+s.phase)*.19;
      ctx.beginPath();ctx.arc(x,y,s.r,0,Math.PI*2);
      const light = document.documentElement.dataset.theme === "light";
      ctx.fillStyle=light?`rgba(93,83,145,${s.alpha*shimmer*.62})`:`rgba(218,226,255,${s.alpha*shimmer})`;ctx.fill();
      if(s.r>1.35&&s.alpha>.55){
        ctx.strokeStyle=light?`rgba(93,83,145,${s.alpha*shimmer*.25})`:`rgba(218,226,255,${s.alpha*shimmer*.32})`;ctx.lineWidth=.6;
        ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();
      }
    }
  }
  function drawSun(x,y,scale,time){
    const r=Math.max(7,11*scale),pulse=reduced?1:1+Math.sin(time*.0012)*.035;
    const g=ctx.createRadialGradient(x,y,r*.4,x,y,r*6.4*pulse);
    g.addColorStop(0,"rgba(255,224,160,.28)");g.addColorStop(.25,"rgba(255,184,121,.13)");g.addColorStop(1,"rgba(255,170,120,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*6.4*pulse,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.rotate(reduced?0:time*.000025);
    ctx.strokeStyle="rgba(255,215,160,.13)";ctx.lineWidth=1;
    for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(r*1.45,0);ctx.lineTo(r*1.9,0);ctx.stroke();ctx.rotate(Math.PI/6);}
    ctx.restore();
    const sun=ctx.createRadialGradient(x-r*.35,y-r*.35,1,x,y,r);
    sun.addColorStop(0,"#fff9dc");sun.addColorStop(.48,"#ffd99a");sun.addColorStop(1,"#ee9069");
    ctx.fillStyle=sun;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function drawPlanet(p,s,time,dt){
    const ox=Math.min(width*.47,650)*p.orbit,oy=Math.min(height*.39,420)*p.orbit;
    const angle=p.phase+(reduced?0:elapsed*.00008*p.speed);
    const bx=s.x+Math.cos(angle)*ox,by=s.y+Math.sin(angle)*oy;
    // Match the original version's gentle, capped cursor repulsion and spring return.
    const range=width<700?85:105;
    let fx=0,fy=0;
    if(pointer.active){
      const dx=bx-pointer.x,dy=by-pointer.y,d=Math.hypot(dx,dy);
      if(d<range&&d>.01){const force=Math.pow((range-d)/range,1.45)*(25+35*p.mass);fx=dx/d*force;fy=dy/d*force;}
    }
    p.ox+=(fx-p.ox)*(reduced?1:.095);
    p.oy+=(fy-p.oy)*(reduced?1:.095);
    p.vx=0;p.vy=0;
    const x=bx+p.ox,y=by+p.oy,r=Math.max(2.5,p.radius*Math.max(.65,s.scale*1.25));
    const depth=.82+(Math.sin(angle)+1)*.09;
    ctx.beginPath();ctx.ellipse(s.x,s.y,ox,oy,0,0,Math.PI*2);
    ctx.strokeStyle=document.documentElement.dataset.theme==="light"?"rgba(91,81,143,.32)":"rgba(174,184,235,.12)";ctx.lineWidth=document.documentElement.dataset.theme==="light"?1.25:1;ctx.stroke();

    if(p.texture==="saturn"){
      ctx.save();ctx.translate(x,y);ctx.rotate(-.28);
      ctx.beginPath();ctx.ellipse(0,0,r*2.05,r*.7,0,0,Math.PI*2);
      ctx.strokeStyle=`rgba(235,216,166,${.74*depth})`;ctx.lineWidth=Math.max(1.2,r*.34);ctx.stroke();
      ctx.beginPath();ctx.ellipse(0,0,r*1.48,r*.45,0,Math.PI,Math.PI*2);
      ctx.strokeStyle="rgba(255,241,207,.6)";ctx.lineWidth=1.1;ctx.stroke();ctx.restore();
    }
    const halo=ctx.createRadialGradient(x,y,r*.3,x,y,r*3.1);
    halo.addColorStop(0,p.color+"66");halo.addColorStop(1,p.color+"00");
    ctx.globalAlpha=depth;ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,r*3.1,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
    const sphere=ctx.createRadialGradient(x-r*.38,y-r*.42,r*.04,x,y,r*1.25);
    sphere.addColorStop(0,"#fff");sphere.addColorStop(.16,p.color);sphere.addColorStop(.72,p.color);sphere.addColorStop(1,shade(p.color,-62));
    ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    if(p.texture==="bands"&&r>4){
      ctx.globalAlpha=depth*.22;
      for(let i=-2;i<=2;i++){ctx.fillStyle=i%2?"#fff0cf":"#483c58";ctx.fillRect(x-r,y+i*r*.36,r*2,Math.max(1,r*.13));}
    }else if(p.texture==="earth"&&r>4){
      ctx.globalAlpha=depth*.48;ctx.fillStyle="#7ad8a0";
      ctx.beginPath();ctx.ellipse(x-r*.22,y-r*.1,r*.28,r*.42,-.5,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+r*.32,y+r*.3,r*.18,r*.24,.5,0,Math.PI*2);ctx.fill();
    }else if(p.texture==="rock"&&r>3){
      ctx.globalAlpha=depth*.2;ctx.fillStyle="#382d3a";
      ctx.beginPath();ctx.arc(x+r*.25,y-r*.25,r*.18,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(x-r*.32,y+r*.22,r*.11,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();ctx.globalAlpha=1;
    ctx.beginPath();ctx.arc(x,y,r,-Math.PI*.82,-Math.PI*.18);
    ctx.strokeStyle=`rgba(255,255,255,${.34*depth})`;ctx.lineWidth=.7;ctx.stroke();
    if(pointer.active&&Math.hypot(pointer.x-x,pointer.y-y)<range+14){
      ctx.font="11px 'DM Sans',sans-serif";ctx.textAlign="center";ctx.fillStyle=document.documentElement.dataset.theme==="light"?"rgba(43,39,69,.9)":"rgba(240,242,255,.92)";
      ctx.fillText(p.name,x,y-r-11);
    }
  }
  function drawSparkleTrail(time){
    trailCtx.clearRect(0,0,width,height);
    for(let i=sparkles.length-1;i>=0;i--){
      const q=sparkles[i];
      q.life-=1;
      q.x+=q.vx;q.y+=q.vy;
      q.vx*=.985;q.vy*=.985;
      if(q.life<=0){sparkles.splice(i,1);continue;}
      const fade=Math.min(1,q.life/q.maxLife);
      const alpha=fade*q.alpha;
      trailCtx.save();
      trailCtx.translate(q.x,q.y);
      trailCtx.rotate(q.rotation+time*.00015);
      trailCtx.globalAlpha=alpha;
      trailCtx.shadowBlur=q.size*5;
      trailCtx.shadowColor=q.color;
      trailCtx.fillStyle=q.color;
      if(q.star){
        trailCtx.beginPath();
        trailCtx.moveTo(0,-q.size*1.8);trailCtx.lineTo(q.size*.42,-q.size*.42);
        trailCtx.lineTo(q.size*1.8,0);trailCtx.lineTo(q.size*.42,q.size*.42);
        trailCtx.lineTo(0,q.size*1.8);trailCtx.lineTo(-q.size*.42,q.size*.42);
        trailCtx.lineTo(-q.size*1.8,0);trailCtx.lineTo(-q.size*.42,-q.size*.42);
        trailCtx.closePath();trailCtx.fill();
      }else{
        trailCtx.beginPath();trailCtx.arc(0,0,q.size,0,Math.PI*2);trailCtx.fill();
      }
      trailCtx.restore();
    }
  }

  function addSparkles(x,y,count=2){
    // Use a different, darker jewel-tone palette in light mode so the trail
    // keeps its contrast against the cream/lavender page background.
    const light = document.documentElement.dataset.theme === "light";
    const colors = light
      ? ["#6c4bc2", "#167d8b", "#b13e79", "#7a61a8", "#d08a25"]
      : ["#fff2c7", "#d7d8ff", "#a9f4ff", "#f0c9ff"];
    for(let i=0;i<count;i++){
      const size=light?rand(1.05,2.5):rand(.7,2.1);
      sparkles.push({x:x+rand(-5,5),y:y+rand(-5,5),vx:rand(-.7,.7),vy:rand(-1.1,.45),
        size,life:rand(28,52),maxLife:52,alpha:light?rand(.7,1):rand(.45,.95),color:colors[Math.floor(Math.random()*colors.length)],
        rotation:rand(0,Math.PI*2),star:Math.random()>.68});
    }
    if(sparkles.length>240)sparkles.splice(0,sparkles.length-240);
  }

  function frame(time){
    const delta=last?Math.min(time-last,40):16;last=time;
    const dt=reduced?1:Math.min(1.8,delta/16.67);
    if(!reduced)elapsed+=delta;
    ctx.clearRect(0,0,width,height);nebula(time);drawStars(time);
    const s=system();planets.forEach(p=>drawPlanet(p,s,time,dt));drawSun(s.x,s.y,s.scale,time);
    drawSparkleTrail(time);
    requestAnimationFrame(frame);
  }
  addEventListener("pointermove",e=>{
    pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=e.pointerType!=="touch";
    if(e.pointerType!=="touch"&&!reduced){
      const prev=lastPointer?Math.hypot(e.clientX-lastPointer.x,e.clientY-lastPointer.y):0;
      addSparkles(e.clientX,e.clientY,Math.min(5,Math.max(1,Math.ceil(prev/12))));
    }
    lastPointer={x:e.clientX,y:e.clientY};
  },{passive:true});
  addEventListener("pointerleave",()=>pointer.active=false);
  addEventListener("blur",()=>pointer.active=false);
  addEventListener("resize",resize,{passive:true});
  addEventListener("touchstart",()=>pointer.active=false,{passive:true});
  resize();requestAnimationFrame(frame);
})();