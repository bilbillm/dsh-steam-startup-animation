/** A compositor fade and worker-owned frame loop keep host startup work from freezing the artwork. */
function startAnimation(canvas,options={}){
  const root=canvas.parentElement,duration=6;
  const now=()=>performance.timeOrigin+performance.now();
  let startAt=now(),elapsed=0,disposed=false,hidden=document.hidden,frame=0;
  let worker=null,workerUrl=null,transferred=false,scene=null,audio=null,metadataHandler=null,watchdog=0;
  const fade=typeof root.animate==='function'?root.animate([
    {opacity:1,offset:0},
    {opacity:1,offset:.98,easing:'cubic-bezier(0.3333333333,0,0.6666666667,1)'},
    {opacity:0,offset:1},
  ],{duration:duration*1000,fill:'forwards'}):null;
  if(hidden)fade?.pause();
  const readSize=()=>{const box=root.getBoundingClientRect();return{width:Math.max(1,box.width),height:Math.max(1,box.height),dpr:Math.min(window.devicePixelRatio||1,2)};};
  let size=readSize();
  const time=()=>Math.max(0,Math.min(duration,(now()-startAt)/1000));
  function stopAudio(){if(audio){audio.pause();try{audio.currentTime=0;}catch{}if(metadataHandler)audio.removeEventListener('loadedmetadata',metadataHandler);}}
  function enableSound(){
    if(disposed)return;
    try{
      audio=audio||new Audio(audioSource);audio.volume=options.volume??.7;
      metadataHandler=()=>{if(!disposed)audio.currentTime=Math.min(time(),audio.duration||duration);};
      if(audio.readyState>=1)metadataHandler();else audio.addEventListener('loadedmetadata',metadataHandler,{once:true});
      audio.play().catch(()=>{if(!disposed)options.onAudioBlocked?.();});
    }catch{options.onAudioBlocked?.();}
  }
  function releaseWorker(){
    if(worker){worker.onmessage=null;worker.onerror=null;worker.terminate();worker=null;}
    if(workerUrl){URL.revokeObjectURL(workerUrl);workerUrl=null;}
    clearTimeout(watchdog);
  }
  function dispose(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();
    releaseWorker();fade?.cancel();stopAudio();document.removeEventListener('visibilitychange',onVisibility);
  }
  function finish(){if(disposed)return;dispose();options.onFinish?.();}
  function tick(){
    if(disposed||hidden)return;
    elapsed=time();const opacity=scene.draw(elapsed);if(!fade)root.style.opacity=String(opacity);
    if(elapsed<duration)frame=requestAnimationFrame(tick);else finish();
  }
  function fallback(){
    if(disposed||scene)return;
    releaseWorker();
    if(transferred){const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;transferred=false;}
    try{
      scene=createRenderer(canvas);scene.resize(size.width,size.height,size.dpr);scene.draw(hidden?elapsed:time());root.style.background='transparent';
      if(!hidden)frame=requestAnimationFrame(tick);
    }catch{finish();}
  }
  function resize(){
    if(disposed)return;
    const next=readSize();if(next.width===size.width&&next.height===size.height&&next.dpr===size.dpr)return;
    size=next;
    if(worker)worker.postMessage({type:'resize',...size});
    else if(scene){scene.resize(size.width,size.height,size.dpr);scene.draw(hidden?elapsed:time());}
  }
  function onVisibility(){
    if(disposed)return;
    hidden=document.hidden;
    if(hidden){
      elapsed=time();cancelAnimationFrame(frame);fade?.pause();if(audio)audio.pause();worker?.postMessage({type:'pause'});
    }else{
      startAt=now()-elapsed*1000;fade?.play();
      if(worker)worker.postMessage({type:'resume',startAt});else if(scene)frame=requestAnimationFrame(tick);
      if(options.sound)enableSound();
    }
  }
  const observer=new ResizeObserver(resize);observer.observe(root);document.addEventListener('visibilitychange',onVisibility);
  try{
    if(typeof Worker!=='function'||typeof OffscreenCanvas!=='function'||typeof canvas.transferControlToOffscreen!=='function')fallback();
    else{
      workerUrl=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));worker=new Worker(workerUrl);
      worker.onmessage=event=>{
        if(disposed)return;
        if(event.data.type==='ready'){clearTimeout(watchdog);root.style.background='transparent';}
        else if(event.data.type==='done')finish();
        else if(event.data.type==='error')fallback();
      };
      worker.onerror=event=>{event.preventDefault();fallback();};
      const surface=canvas.transferControlToOffscreen();transferred=true;
      worker.postMessage({type:'start',canvas:surface,startAt,paused:hidden,...size},[surface]);
      watchdog=setTimeout(fallback,1500);
    }
    if(options.sound&&!hidden)enableSound();
  }catch{fallback();if(options.sound&&!hidden)enableSound();}
  return{dispose,enableSound};
}
