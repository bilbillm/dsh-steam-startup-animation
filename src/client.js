const {createElement:h,useState}=require('react');
const PAGE_STATE=Symbol.for('bilbillm.dsh-startup-animation.page');
const isChinese=()=>/^zh/i.test(document.documentElement.lang || navigator.language || '');
const text=(zh,en)=>isChinese()?zh:en;
const desktop=()=>location.protocol==='dsh-app:' || Boolean(window.dshDesktop?.window);

/** Only this document's preferences; unavailable storage never blocks startup. */
function storage(){try{return window.localStorage;}catch{return {getItem:()=>null,setItem:()=>{}};}}

function mountOverlay(preferences,onDone=()=>{}) {
  const root=document.createElement('div');
  root.id='dsh-startup-animation-overlay';
  root.setAttribute('role','dialog');
  root.setAttribute('aria-modal','true');
  root.setAttribute('aria-label',text('DeepSeek Harness 开屏动画','DeepSeek Harness startup animation'));
  root.style.cssText='position:fixed;inset:0;z-index:2147483000;isolation:isolate;background:#030609;overflow:hidden;color:#c7d5e7;font-family:system-ui,sans-serif;outline:none;';
  const canvas=document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='display:block;width:100%;height:100%;';
  const controls=document.createElement('div');
  controls.style.cssText='position:absolute;right:24px;bottom:22px;display:flex;gap:12px;align-items:center;';
  const button=(label)=>{const el=document.createElement('button');el.type='button';el.textContent=label;el.style.cssText='border:1px solid #61718b66;border-radius:6px;background:#080d16bb;color:#c0cede;font:12px system-ui,sans-serif;padding:10px 14px;min-height:40px;cursor:pointer;';return el;};
  const soundButton=button(text('开启声音','Enable sound'));soundButton.hidden=true;
  const skipButton=button(text('跳过  Esc','Skip  Esc'));
  controls.append(soundButton,skipButton);root.append(canvas,controls);
  const previousFocus=document.activeElement;
  // Isolate keyboard focus while the six-second overlay covers the app.
  const siblings=[...document.body.children].filter(el=>el instanceof HTMLElement);
  const inertBefore=siblings.map(el=>[el,el.inert]);
  for(const [el]of inertBefore)el.inert=true;
  document.body.append(root);skipButton.focus({preventScroll:true});
  let stopped=false,animation;
  const finish=()=>{
    if(stopped)return;stopped=true;
    animation?.dispose();document.removeEventListener('keydown',onKey,true);
    root.remove();for(const[el,inert]of inertBefore)if(el.isConnected)el.inert=inert;
    if(previousFocus instanceof HTMLElement && previousFocus.isConnected)previousFocus.focus({preventScroll:true});
    onDone();
  };
  const onKey=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();finish();}
    if(event.key==='Tab'){
      const buttons=[soundButton,skipButton].filter(el=>!el.hidden);
      if(buttons.length===1 || (event.shiftKey && document.activeElement===buttons[0]) || (!event.shiftKey && document.activeElement===buttons.at(-1))){event.preventDefault();buttons[event.shiftKey?buttons.length-1:0].focus();}
    }
  };
  document.addEventListener('keydown',onKey,true);skipButton.onclick=finish;
  try {
    animation=startAnimation(canvas,{...preferences,onFinish:finish,onAudioBlocked:()=>{if(!stopped)soundButton.hidden=false;}});
    soundButton.onclick=()=>{animation.enableSound();soundButton.hidden=true;skipButton.focus({preventScroll:true});};
  } catch(error){finish();console.warn('[dsh-startup-animation] Playback skipped:',error);}
  return finish;
}

function apply(ctx) {
  const state=window[PAGE_STATE] || (window[PAGE_STATE]={seen:false,stop:null});
  const playPreview=()=>{state.stop?.();state.stop=mountOverlay(readPreferences(storage()),()=>{state.stop=null;});};
  ctx.effect(()=>{
    const preferences=readPreferences(storage());
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(shouldAutoPlay(preferences,{desktop:desktop(),reducedMotion:reduced.matches,seen:state.seen})){
      state.seen=true;state.stop=mountOverlay(preferences,()=>{state.stop=null;});
    }
    const onReduction=()=>{if(reduced.matches)state.stop?.();};
    reduced.addEventListener('change',onReduction);
    return()=>{reduced.removeEventListener('change',onReduction);state.stop?.();};
  },'startup-animation: playback');
  function Settings({view}) {
    const [preferences,setPreferences]=useState(()=>readPreferences(storage()));
    const update=patch=>setPreferences(current=>writePreferences(storage(),{...current,...patch}));
    if(view==='summary')return h('span',null,text('6 秒开屏动画 · 可选启动音效','Six-second startup animation · optional audio'));
    const row=(label,key)=>h('label',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:20,padding:'12px 0'}},h('span',null,label),h('input',{type:'checkbox',checked:preferences[key],onChange:event=>update({[key]:event.target.checked})}));
    return h('section',{'aria-label':text('开屏动画','Startup animation'),style:{maxWidth:560,padding:'12px 0',color:'inherit',font:'inherit'}},
      h('h3',{style:{fontSize:16,fontWeight:500,margin:'0 0 12px'}},text('开屏动画','Startup animation')),
      row(text('启动时播放','Play at startup'),'enabled'),
      row(text('播放 Steam 启动音效','Play Steam startup audio'),'sound'),
      row(text('仅在桌面端自动播放','Automatically play on desktop only'),'desktopOnly'),
      h('label',{style:{display:'flex',gap:20,alignItems:'center',padding:'12px 0'}},h('span',null,text('音量','Volume')),h('input',{'aria-label':text('音量','Volume'),type:'range',min:0,max:1,step:0.05,value:preferences.volume,onChange:event=>update({volume:Number(event.target.value)}),style:{flex:1}}),h('span',null,`${Math.round(preferences.volume*100)}%`)),
      h('button',{type:'button',onClick:playPreview,style:{marginTop:12,padding:'9px 16px',font:'inherit',borderRadius:6,border:'1px solid currentColor',background:'transparent',color:'inherit',cursor:'pointer'}},text('播放预览','Play preview')));
  }
  ctx.slots.inject('plugins.bundle.config',()=>ctx.slots.register({name:'plugins.bundle.config',key:'dsh-startup-animation'},Settings));
}
exports.name='dsh-startup-animation';
exports.inject=['slots'];
exports.apply=apply;
