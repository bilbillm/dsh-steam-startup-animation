let scene=null,surface=null,frame=0,startAt=0,running=false;
const clock=()=>performance.timeOrigin+performance.now();
const elapsed=()=>Math.max(0,Math.min(6,(clock()-startAt)/1000));
function fail(error){running=false;cancelAnimationFrame(frame);self.postMessage({type:'error',message:String(error?.message||error)});}
function tick(){
  if(!running)return;
  try{
    const time=elapsed();scene.draw(time);
    if(time<6)frame=requestAnimationFrame(tick);else{running=false;self.postMessage({type:'done'});}
  }catch(error){fail(error);}
}
self.onmessage=event=>{
  try{
    const message=event.data;
    if(message.type==='start'){
      surface=message.canvas;scene=createRenderer(surface);scene.resize(message.width,message.height,message.dpr);startAt=message.startAt;
      scene.draw(message.paused?0:elapsed());running=!message.paused;if(running)frame=requestAnimationFrame(tick);self.postMessage({type:'ready'});
    }else if(message.type==='resize'&&scene){scene.resize(message.width,message.height,message.dpr);scene.draw(elapsed());}
    else if(message.type==='pause'){running=false;cancelAnimationFrame(frame);}
    else if(message.type==='resume'&&scene){startAt=message.startAt;running=true;frame=requestAnimationFrame(tick);}
  }catch(error){fail(error);}
};
