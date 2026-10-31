(() => {
  'use strict';
  const translations = [...document.querySelectorAll('[data-zh][data-en]')];
  const ariaTranslations = [...document.querySelectorAll('[data-aria-zh][data-aria-en]')];
  const languageToggle = document.querySelector('#language-toggle');
  const descriptions = {
    zh: { web: '细丝相连，构成宇宙的大尺度网络。', nodes: '物质聚集的节点，是网络中致密的结构。', loops: '闭合环路，让我们从拓扑的角度观察连接。' },
    en: { web: 'Filaments connect into a large-scale cosmic network.', nodes: 'Dense nodes mark where matter gathers in the network.', loops: 'Closed loops offer a topological view of connectivity.' }
  };
  let language = 'en';
  let view = 'web';
  try { if (localStorage.getItem('jw-language-v2') === 'zh') language = 'zh'; } catch { /* Language selection works without browser storage. */ }
  function updateDescription() {
    document.querySelector('#view-description').textContent = descriptions[language][view];
  }
  function setLanguage(next) {
    language = next;
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
    translations.forEach(element => {
      const lines = element.dataset[next].split('\\n');
      element.replaceChildren(...lines.flatMap((line, index) => index ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
    });
    ariaTranslations.forEach(element => element.setAttribute('aria-label', element.getAttribute(`data-aria-${next}`)));
    languageToggle.textContent = next === 'zh' ? 'EN' : '中文';
    languageToggle.setAttribute('aria-label', next === 'zh' ? 'Switch to English' : '切换为中文');
    document.title = next === 'zh' ? 'Jiaqi Wang 王佳琪 · 宇宙、智能与创作' : 'Jiaqi Wang · Cosmology, AI & Creation';
    updateDescription();
    try { localStorage.setItem('jw-language-v2', next); } catch { /* Optional preference persistence. */ }
    drawWeb();
    updateMotionControls();
  }

  const canvas = document.querySelector('#cosmic-web');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x:0, y:0, active:false };
  let seed = 27319;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(random(), .00001))) * Math.cos(2 * Math.PI * random());
  // Every layer is projected from these same moving anchors. This is conceptual geometry.
  const nodes = [
    [.17,.47],[.28,.23],[.42,.1],[.52,.31],[.67,.18],[.82,.26],[.91,.43],
    [.76,.56],[.88,.78],[.62,.85],[.52,.64],[.33,.76],[.35,.47],[.58,.48],[.7,.72],[.19,.86],[.97,.94]
  ];
  const edges = [[0,1],[0,12],[0,15],[1,2],[1,12],[2,3],[2,4],[3,4],[3,12],[3,13],[4,5],[5,6],[5,7],[6,7],[6,8],[7,13],[7,14],[8,14],[8,16],[9,10],[9,14],[10,11],[10,12],[10,13],[11,12],[11,15],[13,14]];
  const loops = [[1,2,3,12],[3,4,5,7,13],[10,13,14,9],[7,6,8,14],[0,12,11,15]];
  const anchors = nodes.map(([x,y])=>({x:x*1000,y:y*492+30,dx:0,dy:0,vx:0,vy:0}));
  const particles = [];
  edges.forEach(([a,b])=>{
    for(let i=0;i<125;i++){
      const t=random(),width=3+12*Math.sin(t*Math.PI);
      particles.push({a,b,t,jx:gaussian()*width,jy:gaussian()*width*.6,r:.4+random()*.8});
    }
  });
  anchors.forEach((_,a)=>{
    for(let i=0;i<125;i++)particles.push({a,b:a,t:0,jx:gaussian()*13,jy:gaussian()*8.4,r:.5+random()*1.3});
  });
  const field=Array.from({length:350},()=>{
    const x=random()*1000,y=random()*600;
    const nearest=anchors.map((n,i)=>({i,d:Math.hypot(x-n.x,y-n.y)})).sort((a,b)=>a.d-b.d).slice(0,3);
    const total=nearest.reduce((sum,n)=>sum+1/(n.d+20),0);
    return {x,y,r:.3+random()*.5,weights:nearest.map(n=>[n.i,1/(n.d+20)/total])};
  });
  let animationFrame=0,previousTime=0,elapsed=0,pageVisible=true,userPaused=false;

  function fit(target) {
    const rect=target.getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const width=Math.round(rect.width*ratio),height=Math.round(rect.height*ratio);
    if(target.width!==width||target.height!==height){target.width=width;target.height=height;}
    const context=target.getContext('2d');
    if(!context)return null;
    context.setTransform(ratio,0,0,ratio,0,0);
    return {context,width:rect.width,height:rect.height};
  }
  function liveNodes(){return anchors.map(n=>[n.x+n.dx,n.y+n.dy]);}
  function filamentPoint(p,positions){
    const a=positions[p.a],b=positions[p.b];
    return [a[0]*(1-p.t)+b[0]*p.t+p.jx,a[1]*(1-p.t)+b[1]*p.t+p.jy];
  }
  function drawWeb(){
    if(!ctx)return;
    const size=fit(canvas);if(!size)return;
    const {width:w,height:h}=size,sx=w/1000,sy=h/600;
    const positions=liveNodes();
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle=`rgba(36,72,173,${view==='nodes'?.13:view==='loops'?.2:.5})`;
    particles.forEach(p=>{const [x,y]=filamentPoint(p,positions);ctx.fillRect(x*sx,y*sy,p.r*1.5,p.r*1.5);});
    ctx.fillStyle='rgba(36,72,173,.22)';
    field.forEach(p=>{
      const shift=p.weights.reduce((d,[i,weight])=>[d[0]+anchors[i].dx*weight,d[1]+anchors[i].dy*weight],[0,0]);
      ctx.fillRect((p.x+shift[0])*sx,(p.y+shift[1])*sy,p.r,p.r);
    });
    if(view==='loops')loops.forEach((loop,index)=>{
      ctx.beginPath();
      loop.forEach((n,i)=>{const [x,y]=positions[n];if(i===0)ctx.moveTo(x*sx,y*sy);else ctx.lineTo(x*sx,y*sy);});
      ctx.closePath();ctx.fillStyle='rgba(36,72,173,.045)';ctx.fill();ctx.strokeStyle='rgba(36,72,173,.78)';ctx.lineWidth=1.5;ctx.stroke();
      const center=loop.reduce((sum,n)=>[sum[0]+positions[n][0]/loop.length,sum[1]+positions[n][1]/loop.length],[0,0]);
      ctx.fillStyle='#2448ad';ctx.font='12px Sora, sans-serif';ctx.textAlign='center';ctx.fillText(`H₁ · ${index+1}`,center[0]*sx,center[1]*sy);
    });
    positions.forEach(([x,y],i)=>{
      if(view==='nodes'){
        ctx.strokeStyle='rgba(36,72,173,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x*sx,y*sy,10+i%3*3,0,Math.PI*2);ctx.stroke();
      }
      ctx.fillStyle='rgba(36,72,173,.85)';ctx.beginPath();ctx.arc(x*sx,y*sy,view==='nodes'?3.5:2.2,0,Math.PI*2);ctx.fill();
    });
  }
  function stepNetwork(dt){
    elapsed+=dt;
    const scale=dt*30;
    const forces=anchors.map((n,i)=>{
      let fx=(Math.sin(elapsed*.27+i*1.7)*13-n.dx)*.022;
      let fy=(Math.cos(elapsed*.21+i*1.2)*11-n.dy)*.022;
      if(pointer.active){
        const dx=pointer.x-n.x-n.dx,dy=pointer.y-n.y-n.dy,distance=Math.hypot(dx,dy);
        const strength=Math.max(0,1-distance/260)*.065;
        fx+=dx*strength;fy+=dy*strength;
      }
      return [fx,fy];
    });
    edges.forEach(([a,b])=>{
      const dx=(anchors[b].dx-anchors[a].dx)*.004,dy=(anchors[b].dy-anchors[a].dy)*.004;
      forces[a][0]+=dx;forces[a][1]+=dy;forces[b][0]-=dx;forces[b][1]-=dy;
    });
    anchors.forEach((n,i)=>{
      n.vx=(n.vx+forces[i][0]*scale)*Math.pow(.88,scale);n.vy=(n.vy+forces[i][1]*scale)*Math.pow(.88,scale);
      n.dx+=n.vx*scale;n.dy+=n.vy*scale;
    });
  }
  function animateNetwork(time){
    animationFrame=0;
    if(!pageVisible||document.hidden||userPaused||reducedMotion.matches)return;
    if(!previousTime)previousTime=time-34;
    if(time-previousTime>=30){stepNetwork(Math.min((time-previousTime)/1000,.05));previousTime=time;drawWeb();}
    animationFrame=requestAnimationFrame(animateNetwork);
  }
  function stopNetwork(){cancelAnimationFrame(animationFrame);animationFrame=0;previousTime=0;pointer.active=false;}
  function startNetwork(){
    if(!animationFrame&&pageVisible&&!document.hidden&&!userPaused&&!reducedMotion.matches)animationFrame=requestAnimationFrame(animateNetwork);
  }
  function scatterNetwork(){
    if(reducedMotion.matches||userPaused)return;
    const cx=pointer.active?pointer.x:560,cy=pointer.active?pointer.y:270;
    anchors.forEach(n=>{
      const dx=n.x+n.dx-cx,dy=n.y+n.dy-cy,distance=Math.hypot(dx,dy)||1;
      const force=Math.max(0,1-distance/650)*24;
      n.vx+=dx/distance*force;n.vy+=dy/distance*force;
    });
    pointer.active=false;startNetwork();
  }
  const hero=document.querySelector('.hero');
  hero.addEventListener('pointermove',event=>{
    if(reducedMotion.matches||userPaused)return;
    const rect=canvas.getBoundingClientRect();
    const x=event.clientX-rect.left,y=event.clientY-rect.top;
    pointer.x=x/rect.width*1000;pointer.y=y/rect.height*600;
    pointer.active=x>=0&&x<=rect.width&&y>=0&&y<=rect.height;
    startNetwork();
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{pointer.active=false;});
  hero.addEventListener('pointerup',event=>{if(event.pointerType==='touch')pointer.active=false;});
  hero.addEventListener('click',event=>{if(!event.target.closest('a,button'))scatterNetwork();});
  document.querySelector('#scatter-button').addEventListener('click',scatterNetwork);
  const motionToggle=document.querySelector('#motion-toggle');
  function updateMotionControls(){
    motionToggle.textContent=language==='zh'?(userPaused?'继续动态':'暂停动态'):(userPaused?'Resume motion':'Pause motion');
    motionToggle.setAttribute('aria-pressed',String(userPaused));
    motionToggle.disabled=reducedMotion.matches;
    document.querySelector('#scatter-button').disabled=reducedMotion.matches||userPaused;
    document.querySelector('.particle-interaction').classList.toggle('reduced-motion',reducedMotion.matches);
  }
  motionToggle.addEventListener('click',()=>{userPaused=!userPaused;if(userPaused)stopNetwork();else startNetwork();updateMotionControls();});
  function syncMotion(){
    stopNetwork();
    if(reducedMotion.matches){anchors.forEach(n=>{n.dx=0;n.dy=0;n.vx=0;n.vy=0;});elapsed=0;drawWeb();}
    updateMotionControls();startNetwork();
  }
  reducedMotion.addEventListener('change',syncMotion);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopNetwork();else startNetwork();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{pageVisible=entries[0].isIntersecting;if(pageVisible)startNetwork();else stopNetwork();},{threshold:.01}).observe(hero);
  function drawSonic() {
    const target = document.querySelector('#sonic-lines');
    const size=fit(target);
    if(!size)return;
    const {context:c,width:w,height:h}=size;
    c.clearRect(0,0,w,h);
    for(let line=0;line<45;line++){
      c.beginPath();
      for(let x=0;x<=w;x+=2){
        const t=x/w;
        const envelope=Math.exp(-Math.pow((t-.59)*4.5,2));
        const wave=Math.sin(t*19+line*.15)*envelope*48+Math.sin(t*37-line*.1)*envelope*15;
        const y=h*.44+line*3.3+wave;
        if(x===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.strokeStyle=`rgba(216,227,255,${.24+line/90})`;c.lineWidth=.7;c.stroke();
    }
  }
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    view=button.dataset.view;
    document.querySelectorAll('[data-view]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    updateDescription();drawWeb();
  }));
  languageToggle.addEventListener('click',()=>setLanguage(language==='zh'?'en':'zh'));
  document.querySelector('#year').textContent=String(new Date().getFullYear());
  let resizeFrame;
  const resize = () => { cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{drawWeb();drawSonic();}); };
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(document.body);
  else window.addEventListener('resize',resize,{passive:true});
  document.fonts.ready.then(resize);
  setLanguage(language);drawSonic();syncMotion();
})();
