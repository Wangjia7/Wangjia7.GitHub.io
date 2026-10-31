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
  }

  const canvas = document.querySelector('#cosmic-web');
  const ctx = canvas.getContext('2d');
  let seed = 27319;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(random(), 0.00001))) * Math.cos(2 * Math.PI * random());
  // Conceptual geometry, not an astronomical catalogue or simulation output.
  const nodes = [
    [.17,.47],[.28,.23],[.42,.1],[.52,.31],[.67,.18],[.82,.26],[.91,.43],
    [.76,.56],[.88,.78],[.62,.85],[.52,.64],[.33,.76],[.35,.47],[.58,.48],[.7,.72],[.19,.86],[.97,.94]
  ];
  const edges = [[0,1],[0,12],[0,15],[1,2],[1,12],[2,3],[2,4],[3,4],[3,12],[3,13],[4,5],[5,6],[5,7],[6,7],[6,8],[7,13],[7,14],[8,14],[8,16],[9,10],[9,14],[10,11],[10,12],[10,13],[11,12],[11,15],[13,14]];
  const loops = [[1,2,3,12],[3,4,5,7,13],[10,13,14,9],[7,6,8,14],[0,12,11,15]];
  const particles = [];
  edges.forEach(([a,b]) => {
    for (let i = 0; i < 125; i++) {
      const t = random();
      const width = .003 + .012 * Math.sin(t * Math.PI);
      particles.push([nodes[a][0] * (1-t) + nodes[b][0] * t + gaussian()*width, nodes[a][1] * (1-t) + nodes[b][1] * t + gaussian()*width, .4 + random()*.8]);
    }
  });
  nodes.forEach(([x,y]) => { for (let i=0; i<125; i++) particles.push([x+gaussian()*.013,y+gaussian()*.017,.5+random()*1.3]); });
  for (let i=0;i<450;i++) particles.push([random(),random(),.3+random()*.5]);
  const displacement = particles.map(() => ({ x:0, y:0, vx:0, vy:0 }));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x:0, y:0, active:false };
  let animationFrame = 0;
  let remainingFrames = 0;
  let previousTime = 0;
  let pageVisible = true;

  function fit(target) {
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * ratio), height = Math.round(rect.height * ratio);
    if (target.width !== width || target.height !== height) { target.width = width; target.height = height; }
    const context = target.getContext('2d');
    if (!context) return null;
    context.setTransform(ratio,0,0,ratio,0,0);
    return { context, width: rect.width, height: rect.height };
  }
  function drawWeb() {
    if (!ctx) return;
    const size = fit(canvas);
    if (!size) return;
    const {width:w,height:h} = size;
    ctx.clearRect(0,0,w,h);
    const point = node => [node[0]*w, node[1]*h*.82+h*.05];
    const opacity = view === 'nodes' ? .09 : view === 'loops' ? .19 : .49;
    ctx.fillStyle = `rgba(36,72,173,${opacity})`;
    particles.forEach(([x,y,r],index) => {
      const d = displacement[index];
      ctx.fillRect(x*w+d.x,y*h*.82+h*.05+d.y,r*1.5,r*1.5);
    });
    if (view === 'loops') loops.forEach((loop, index) => {
      ctx.beginPath();
      loop.forEach((n,i)=>{const [x,y]=point(nodes[n]);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
      ctx.closePath();ctx.fillStyle='rgba(36,72,173,.045)';ctx.fill();ctx.strokeStyle='rgba(36,72,173,.78)';ctx.lineWidth=1.5;ctx.stroke();
      const center = loop.reduce((sum,n)=>[sum[0]+nodes[n][0]/loop.length,sum[1]+nodes[n][1]/loop.length],[0,0]);
      const [x,y]=point(center);ctx.fillStyle='#2448ad';ctx.font='12px Sora, sans-serif';ctx.textAlign='center';ctx.fillText(`H₁ · ${index+1}`,x,y);
    });
    nodes.forEach((node,i)=>{
      const [x,y]=point(node);
      if(view==='nodes'){
        ctx.strokeStyle='rgba(36,72,173,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,10+i%3*3,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#2448ad';ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill();
      } else {ctx.fillStyle='rgba(36,72,173,.8)';ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();}
    });
  }

  function animateParticles(time) {
    animationFrame = 0;
    if (!pageVisible || reducedMotion.matches) return;
    if (time - previousTime < 28) { animationFrame = requestAnimationFrame(animateParticles); return; }
    previousTime = time;
    const {width:w,height:h} = canvas.getBoundingClientRect();
    particles.forEach(([x,y],index) => {
      const d=displacement[index];
      let fx=-d.x*.035, fy=-d.y*.035;
      if(pointer.active){
        const dx=pointer.x-x*w-d.x, dy=pointer.y-y*h*.82-h*.05-d.y;
        const distance=Math.hypot(dx,dy);
        if(distance<155){
          const force=(1-distance/155)*.09;
          fx+=dx*force;fy+=dy*force;
        }
      }
      d.vx=(d.vx+fx)*.82;d.vy=(d.vy+fy)*.82;
      d.x+=d.vx;d.y+=d.vy;
    });
    drawWeb();
    if(--remainingFrames>0) animationFrame=requestAnimationFrame(animateParticles);
    else if(!pointer.active){displacement.forEach(d=>{d.x=0;d.y=0;d.vx=0;d.vy=0;});drawWeb();}
  }
  function startParticles() {
    remainingFrames=90;
    if(!animationFrame && pageVisible && !reducedMotion.matches) animationFrame=requestAnimationFrame(animateParticles);
  }
  function scatterParticles() {
    if(reducedMotion.matches)return;
    const {width:w,height:h}=canvas.getBoundingClientRect();
    const cx=pointer.active?pointer.x:w*.56,cy=pointer.active?pointer.y:h*.45;
    particles.forEach(([x,y],index)=>{
      const dx=x*w-cx,dy=y*h*.82+h*.05-cy;
      const distance=Math.hypot(dx,dy)||1;
      const force=Math.max(0,1-distance/Math.max(240,w*.5))*35;
      displacement[index].vx+=dx/distance*force;displacement[index].vy+=dy/distance*force;
    });
    pointer.active=false;startParticles();
  }
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch' || reducedMotion.matches)return;
    const rect=canvas.getBoundingClientRect();
    pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;
    pointer.active=pointer.x>=0&&pointer.x<=rect.width&&pointer.y>=0&&pointer.y<=rect.height;
    startParticles();
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{pointer.active=false;startParticles();});
  hero.addEventListener('click',event=>{if(!event.target.closest('a,button'))scatterParticles();});
  document.querySelector('#scatter-button').addEventListener('click',scatterParticles);
  const stopParticles=()=>{cancelAnimationFrame(animationFrame);animationFrame=0;pointer.active=false;displacement.forEach(d=>{d.x=0;d.y=0;d.vx=0;d.vy=0;});drawWeb();};
  const syncMotion=()=>{
    document.querySelector('#scatter-button').disabled=reducedMotion.matches;
    document.querySelector('.particle-interaction').classList.toggle('reduced-motion',reducedMotion.matches);
    stopParticles();
  };
  reducedMotion.addEventListener('change',syncMotion);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopParticles();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{pageVisible=entries[0].isIntersecting;if(!pageVisible)stopParticles();}).observe(hero);
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
