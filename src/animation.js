/** Approved six-second Canvas sequence, rendered without a video decoder or network assets. */
function startAnimation(canvas,options={}) {
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Canvas 2D is unavailable');
  const mark=new Path2D(brand.mark),letters=brand.letters.map(d=>new Path2D(d));
  const outlineGeometry=document.createElementNS('http://www.w3.org/2000/svg','path');
  outlineGeometry.setAttribute('d',brand.mark.match(/[Mm][^Mm]*/)[0]);
  const outlineLength=outlineGeometry.getTotalLength();
  const whaleOutline=Array.from({length:513},(_,i)=>{const p=outlineGeometry.getPointAtLength(outlineLength*i/512);return[p.x,p.y]});
  const TAU=Math.PI*2,duration=6,referenceDuration=6,morphStart=2.1,originalMorphStart=2.8,morphEnd=3.5;
  const fog=document.createElement('canvas');fog.width=256;fog.height=144;
  const fogContext=fog.getContext('2d'),fogPixels=fogContext.createImageData(256,144);
  const upper=new Float32Array(256*144),lower=new Float32Array(256*144);
  for(let y=0;y<144;y++)for(let x=0;x<256;x++){
    const i=y*256+x,nx=x/255,ny=y/143;
    upper[i]=Math.exp(-.5*(((nx-lightShape[3])/lightShape[5])**2+((ny-lightShape[4])/lightShape[6])**2));
    lower[i]=Math.exp(-.5*(((nx-lightShape[10])/lightShape[12])**2+((ny-lightShape[11])/lightShape[13])**2));
  }
  let width=1000,height=562.5,dpr=1,elapsed=0,start=0,frame=0,playing=true,lastFog=-1;
  let audio=null,disposed=false;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  const range=(t,a,b)=>smooth((t-a)/(b-a));
  const mix=(a,b,u)=>a+(b-a)*u;
  function cubicEase(value,x1=.48,x2=.17){
    const x=clamp(value);if(x===0||x===1)return x;
    let low=0,high=1,u=x;
    for(let i=0;i<20;i++){
      const inverse=1-u,sample=3*inverse*inverse*u*x1+3*inverse*u*u*x2+u*u*u;
      if(sample<x)low=u;else high=u;u=(low+high)*.5;
    }
    return u*u*(3-2*u);
  }
  const motionProgress=t=>cubicEase((t-originalMorphStart)/(morphEnd-originalMorphStart));
  function motionPose(t){
    const p=motionProgress(t),pulse=Math.pow(Math.sin(Math.PI*p),2);
    const scale=1+.82*pulse;
    return{scale,angle:-.15*pulse};
  }
  function applyMotionPose(t,cx,cy,k){
    const pose=motionPose(t);ctx.translate(cx,cy);ctx.rotate(pose.angle);ctx.scale(k*pose.scale,k*pose.scale);
  }
  function background(t){
    const time=Math.min(t,.5),key=Math.round(time*60);
    if(key!==lastFog){
      lastFog=key;let index=0;while(index<lightFrames.length-2&&lightFrames[index+1][0]<time)index++;
      const a=lightFrames[index],b=lightFrames[index+1],u=clamp((time-a[0])/(b[0]-a[0])),c=[[],[],[]];
      for(let f=0;f<3;f++)for(let channel=0;channel<3;channel++)c[f][channel]=mix(a[f+1][channel],b[f+1][channel],u);
      for(let i=0;i<upper.length;i++){
        const noise=((i*13.137%1)-.5)*.4;
        for(let ch=0;ch<3;ch++)fogPixels.data[i*4+ch]=clamp(c[0][ch]+upper[i]*c[1][ch]+lower[i]*c[2][ch]+noise,0,255);
        fogPixels.data[i*4+3]=255;
      }
      fogContext.putImageData(fogPixels,0,0);
    }
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(fog,0,0,width,height);
    const out=range(t,5.35,5.98);if(out){ctx.save();ctx.globalAlpha=out;ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);ctx.restore()}
  }
  function whaleDraw(c,x,y,w,opacity=1,color='#4d6bfe',outline=false,reveal=1){
    c.save();c.translate(x-w/2,y-w*(41.3594/56.2)/2);c.scale(w/56.2,w/56.2);c.globalAlpha=opacity;
    if(outline){c.lineWidth=.64;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.setLineDash([Math.max(.01,reveal*320),900]);c.stroke(mark)}else{c.fillStyle=color;c.fill(mark)}c.restore();
  }
  function tracedWhale(t,exit){
    const arrival=cubicEase((t-3.40)/.74,.26,.14);
    const reveal=cubicEase((t-3.38)/.60,.48,.12);
    const fill=cubicEase((t-3.60)/.43,.35,.14);
    ctx.save();ctx.translate(-3*(1-arrival),8*(1-arrival));ctx.rotate(-.11*(1-arrival));
    whaleDraw(ctx,0,0,90,fill*exit,'#edf2f7');
    ctx.translate(-45,-90*(41.3594/56.2)/2);ctx.scale(90/56.2,90/56.2);
    const front=reveal*.5,back=1-front,light=range(t,3.38,3.50);
    const contour=light*(1-fill)*exit;
    line(whaleOutline,0,front,'#8eb7f2',contour,.64);
    line(whaleOutline,back,1,'#8eb7f2',contour,.64);
    const head=light*(1-range(t,3.90,4.07))*exit;
    ctx.shadowColor='#7db6ff';ctx.shadowBlur=2.2;
    line(whaleOutline,Math.max(0,front-.045),front,'#e3f2ff',head,.88);
    line(whaleOutline,back,Math.min(1,back+.045),'#e3f2ff',head,.88);
    ctx.restore();
  }
  function wordmark(x,y,w,opacity,color){
    ctx.save();ctx.globalAlpha=opacity;ctx.fillStyle=color;const scale=w/134.577469;ctx.translate(x-w/2,y-25.511124*scale/2);ctx.scale(scale,scale);ctx.translate(-60.422485,-10.022217);
    for(const p of letters)ctx.fill(p);ctx.fillRect(180.321533,10.022217,3.412687,20.625223);ctx.restore();
  }
  function trackedText(text,x,y,size,spacing,alpha){
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#b0bac9';ctx.font=`400 ${size}px Inter, "Segoe UI", sans-serif`;ctx.textBaseline='middle';let left=x-(ctx.measureText(text).width+(text.length-1)*spacing)/2;
    for(const ch of text){ctx.fillText(ch,left,y);left+=ctx.measureText(ch).width+spacing}ctx.restore();
  }
  function resample(vertices,count=100){
    const distances=[0];for(let i=1;i<vertices.length;i++)distances.push(distances[i-1]+Math.hypot(vertices[i][0]-vertices[i-1][0],vertices[i][1]-vertices[i-1][1]));
    return Array.from({length:count},(_,i)=>{const distance=i/(count-1)*distances.at(-1);let j=0;while(j<vertices.length-2&&distances[j+1]<distance)j++;const u=(distance-distances[j])/(distances[j+1]-distances[j]);return[mix(vertices[j][0],vertices[j+1][0],u),mix(vertices[j][1],vertices[j+1][1],u)]});
  }
  function roundedScreen(){
    const corners=[[53,-38,-Math.PI/2],[53,25,0],[-53,25,Math.PI/2],[-53,-38,Math.PI]],points=[];
    for(const[x,y,angle]of corners)for(let i=0;i<=20;i++){const a=angle+i/20*Math.PI/2;points.push([x+9*Math.cos(a),y+9*Math.sin(a)])}
    points.push(points[0]);return resample(points,180);
  }
  // A complete development workstation: screen, editor, code, cursor, and stand.
  const code=[
    roundedScreen(),resample([[-61,-26],[61,-26]]),
    resample([[-12,34],[-15,51],[15,51],[12,34]]),resample([[-34,55],[34,55]]),
    resample([[-23,-11],[-35,1],[-23,13]]),resample([[6,-15],[-6,17]]),
    resample([[23,-11],[35,1],[23,13]]),resample([[16,22],[31,22]])
  ];
  const strokeTimes=[[.16,1.38],[.55,1.3],[1.05,1.68],[1.2,1.8],[.76,1.56],[1,1.67],[.91,1.72],[1.4,1.86]];
  const strokeWidths=[3.8,1.65,2.8,3.4,2.7,2.7,2.7,2.4];
  const framePressure=[[0,4.4],[.10,5.1],[.19,3.4],[.25,4.7],[.31,2.5],[.45,3.1],[.53,4.6],[.64,1.65],[.73,4.1],[.87,5.0],[1,4.4]];
  function inkPressure(index,q){
    if(index===0){
      let i=0;while(i<framePressure.length-2&&q>framePressure[i+1][0])i++;
      const a=framePressure[i],b=framePressure[i+1],weight=mix(a[1],b[1],smooth((q-a[0])/(b[0]-a[0])));
      const gap=1-range(q,.330,.344)*(1-range(q,.388,.402));
      return weight*gap;
    }
    const peak=index===1?.85:index===3?3.85:strokeWidths[index];
    const bell=Math.pow(Math.max(0,Math.sin(Math.PI*q)),index===1?.45:.72);
    return .06+(peak-.06)*bell;
  }
  function toolbarDots(alpha,collapse=0){
    ctx.save();ctx.globalAlpha=alpha*.43;ctx.strokeStyle='#b4c1d5';ctx.lineWidth=.85;
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(mix(-48+i*9,0,collapse),mix(-37,0,collapse),1.8,0,TAU);ctx.stroke()}ctx.restore();
  }
  function line(points,from,to,color,alpha,lineWidth){
    if(to<=from||alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    const last=points.length-1,a=clamp(from)*last,b=clamp(to)*last;
    const at=value=>{const i=Math.min(last-1,Math.floor(value)),u=value-i;return[mix(points[i][0],points[i+1][0],u),mix(points[i][1],points[i+1][1],u)]};
    ctx.moveTo(...at(a));for(let i=Math.floor(a)+1;i<b;i++)ctx.lineTo(...points[i]);ctx.lineTo(...at(b));ctx.stroke();ctx.restore();
  }
  function inkRibbon(points,from,to,color,alpha,pressure){
    const start=clamp(from),end=clamp(to);if(end<=start||alpha<=0)return;
    const last=points.length-1;
    const at=q=>{const v=clamp(q)*last,i=Math.min(last-1,Math.floor(v)),u=v-i;return[mix(points[i][0],points[i+1][0],u),mix(points[i][1],points[i+1][1],u)]};
    const count=Math.max(2,Math.ceil((end-start)*last)),left=[],right=[];
    for(let i=0;i<=count;i++){
      const q=mix(start,end,i/count),p=at(q),before=at(q-1/last),after=at(q+1/last);
      const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1,half=Math.max(0,pressure(q))*.5;
      left.push([p[0]-dy/length*half,p[1]+dx/length*half]);right.push([p[0]+dy/length*half,p[1]-dx/length*half]);
    }
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();
    ctx.moveTo(...left[0]);for(let i=1;i<left.length;i++)ctx.lineTo(...left[i]);for(let i=right.length-1;i>=0;i--)ctx.lineTo(...right[i]);ctx.closePath();ctx.fill();ctx.restore();
  }
  function programmingMark(t,cx,cy,k){
    ctx.save();ctx.translate(cx,cy);ctx.scale(k*1.18,k*1.18);
    for(let i=0;i<code.length;i++){
      const[begin,end]=strokeTimes[i],p=cubicEase((t-begin)/(end-begin),.35,.22),settled=range(t,end-.15,end+.2);
      const hierarchy=i===1?.43:i===7?.8:1,baseColor=i===1?'#a7b4c7':'#ecf1f6';
      const basePressure=q=>{
        const leading=p<.9999?range(p-q,0,.035):1;
        const seam=i===0?mix(range(q,0,.025),1,range(p,.88,1)):1;
        return inkPressure(i,q)*leading*seam;
      };
      inkRibbon(code[i],0,p,baseColor,range(t,begin,begin+.2)*(.25+.75*settled)*hierarchy,basePressure);
      const headStart=Math.max(0,p-.24),headLength=p-headStart;
      inkRibbon(code[i],headStart,p,i%3===1?'#9163f8':'#4b94ff',range(t,begin,begin+.15)*(1-settled),q=>inkPressure(i,q)*Math.pow(Math.max(0,Math.sin(Math.PI*(q-headStart)/(headLength||1))),.65));
      const tipStart=Math.max(0,p-.055),tipLength=p-tipStart;
      inkRibbon(code[i],tipStart,p,'#dce9ff',range(t,begin,begin+.15)*(1-settled)*.8,q=>inkPressure(i,q)*.8*Math.sin(Math.PI*(q-tipStart)/(tipLength||1)));
    }
    toolbarDots(range(t,.62,1.32));
    ctx.restore();
  }
  function morphToRing(t,cx,cy,k){
    const p=motionProgress(t);
    ctx.save();applyMotionPose(t,cx,cy,k);
    for(let j=0;j<code.length;j++){
      const points=code[j].map((point,i)=>{
        const q=i/(code[j].length-1);
        const angle=j===0?Math.atan2(point[1]+6.5,point[0]):(-.5+j*.25+q*.25)*Math.PI;
        return[mix(point[0]*1.18,Math.cos(angle)*59,p),mix(point[1]*1.18,Math.sin(angle)*59,p)];
      });
      const opacity=j===0?1:1-range(t,2.88,3.26);
      const hierarchy=j===1?.43:j===7?.8:1;
      inkRibbon(points,0,1,j===1?'#a7b4c7':'#eaf0f7',opacity*hierarchy,q=>mix(inkPressure(j,q)*1.18,3.2,p));
      const head=(.17+t*1.2+j*.31)%1;
      const headStart=Math.max(0,head-.18),headLength=head-headStart;
      inkRibbon(points,headStart,head,j%3===1?'#9065ef':'#5b9cff',Math.sin(Math.PI*p)*.75*opacity,q=>mix(inkPressure(j,q)*1.18,2.2,p)*Math.sin(Math.PI*(q-headStart)/(headLength||1)));
    }
    ctx.save();ctx.scale(1.18,1.18);toolbarDots(1-range(t,2.8,3.17),p);ctx.restore();
    ctx.restore();
  }
  function pointField(t,cx,cy,k){
    const opacity=range(t,3.06,3.28)*(1-range(t,3.75,4.26));if(opacity<=0)return;
    const u=cubicEase((t-3.06)/1.2),spread=.48+4.02*u,rotation=.16+(t-3.1)*.05;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation);
    for(let row=-10;row<=10;row++)for(let col=-12;col<=12;col++){
      const radius=Math.hypot(col/12,row/10);if(radius>1)continue;
      const depth=((col*17+row*31+701)%7)/7;
      ctx.globalAlpha=opacity*(.45+.4*depth)*(1-radius*.12);ctx.fillStyle=(row+col)%3===0?'#8954ef':'#487cde';
      ctx.beginPath();ctx.arc(col*15*k*spread,row*15*k*spread,(.85+.4*depth)*k,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
  function resolvedLogo(t,cx,cy,k,exitTime=t){
    const entrance=range(t,3.36,3.50),exit=1-range(exitTime,5.35,5.98);if(entrance<=0||exit<=0)return;
    ctx.save();applyMotionPose(t,cx,cy,k);
    // Both sides of the handoff share the same continuous motion curve.
    if(t>=morphEnd){ctx.save();ctx.globalAlpha=exit;ctx.strokeStyle='#e9eff7';ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(0,0,59,0,TAU);ctx.stroke();ctx.restore()}
    tracedWhale(t,exit);
    const edge=range(t,3.40,3.54)*(1-range(t,3.98,4.28));
    if(edge>0){
      const sweep=cubicEase((t-3.40)/.88,.40,.16),start=-2.8+sweep*TAU*.88,length=mix(1.6,.45,sweep);
      ctx.save();ctx.globalAlpha=edge*.82*exit;ctx.lineWidth=1.6;ctx.lineCap='round';ctx.strokeStyle=t<3.92?'#6aa9ff':'#a384ef';ctx.beginPath();ctx.arc(0,0,63,start,start+length);ctx.stroke();ctx.restore();
    }
    ctx.restore();
    const typeTravel=cubicEase((t-3.98)/.36,.25,.16),type=typeTravel*exit,lift=6*(1-typeTravel)*k;
    wordmark(cx,cy+86*k+lift,104*k,type*.94,'#e2eaf4');trackedText('HARNESS',cx,cy+111*k+lift,9.5*k,3*k,type*.8);
  }
  function draw(playbackTime){
    const t=playbackTime*referenceDuration/duration,k=Math.min(width/1000,height/562.5),cx=width*.5,cy=height*.5;
    // The drawing still flows straight into the morph; final fade timing stays fixed.
    const phaseTime=t<morphStart?t:t+(originalMorphStart-morphStart);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);background(t);pointField(phaseTime,cx,cy,k);
    if(t<morphStart)programmingMark(t,cx,cy,k);else if(phaseTime<morphEnd)morphToRing(phaseTime,cx,cy,k);
    resolvedLogo(phaseTime,cx,cy,k,t);
    canvas.parentElement.style.opacity=String(1-range(t,5.88,6.0));
  }

  function stopAudio(){if(audio){audio.pause();try{audio.currentTime=0;}catch{}}}
  function enableSound(){
    if(disposed)return;
    try {
      audio=audio || new Audio(audioSource);
      audio.volume=options.volume ?? .7;
      const align=()=>{if(!disposed)audio.currentTime=Math.min(elapsed,audio.duration || 6);};
      if(audio.readyState>=1)align();else audio.addEventListener('loadedmetadata',align,{once:true});
      audio.play().catch(()=>{if(!disposed)options.onAudioBlocked?.();});
    }catch{options.onAudioBlocked?.();}
  }
  function dispose(){
    if(disposed)return;disposed=true;playing=false;cancelAnimationFrame(frame);observer.disconnect();
    document.removeEventListener('visibilitychange',onVisibility);stopAudio();
  }
  function finish(){dispose();options.onFinish?.();}
  function tick(now){
    if(disposed)return;
    elapsed=Math.min((now-start)/1000,duration);draw(elapsed);
    if(elapsed<duration)frame=requestAnimationFrame(tick);else finish();
  }
  function resize(){
    const box=canvas.parentElement.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    dpr=Math.min(window.devicePixelRatio || 1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    lastFog=-1;draw(elapsed);
  }
  function onVisibility(){
    if(disposed)return;
    if(document.hidden){cancelAnimationFrame(frame);if(audio)audio.pause();}
    else{start=performance.now()-elapsed*1000;frame=requestAnimationFrame(tick);if(audio && options.sound)enableSound();}
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement);
  document.addEventListener('visibilitychange',onVisibility);
  resize();start=performance.now();if(options.sound)enableSound();frame=requestAnimationFrame(tick);
  return {dispose,enableSound};
}
