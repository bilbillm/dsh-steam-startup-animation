const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.DSH_PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const browser=await chromium.launch({channel:process.env.DSH_BROWSER_CHANNEL||'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let workers=0,closed=0;page.on('worker',worker=>{workers++;worker.on('close',()=>closed++);});
  await page.goto('about:blank');
  await page.setContent('<div id="app"><input id="draft" value="keep draft"><button id="focus">Host focus</button></div>');
  await page.evaluate(()=>{
   window.dshDesktop={window:{}};window.__cleanups=[];window.__nativeWorker=Worker;
   const NativeAudio=Audio;window.Audio=function(...args){window.__audio=new NativeAudio(...args);return window.__audio;};
   window.__ctx={effect(fn){const dispose=fn();if(dispose)window.__cleanups.push(dispose);},slots:{inject:(_name,fn)=>fn(),register:()=>()=>{}}};
   window.__ModuleLoader__={load({factory}){window.__plugin=factory(()=>({createElement(){},useState(){}}));}};
  });
  await page.locator('#focus').focus();
  await page.addScriptTag({path:path.resolve(__dirname,'../lib/client.js')});
  await page.evaluate(()=>window.__plugin.apply(window.__ctx));
  const overlay=page.locator('#dsh-startup-animation-overlay');
  await overlay.waitFor({state:'visible'});
  await overlay.waitFor({state:'detached',timeout:9000});
  assert.equal(workers,1);await page.waitForTimeout(100);assert.equal(closed,1);
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'focus');
  assert.equal(await page.locator('#draft').inputValue(),'keep draft');
  assert.equal(await page.evaluate(()=>window.__audio.paused&&window.__audio.currentTime===0),true);
  const restart=()=>page.evaluate(()=>{window.__cleanups.splice(0).forEach(fn=>fn());window[Symbol.for('bilbillm.dsh-startup-animation.page')].seen=false;window.__plugin.apply(window.__ctx);});
  await restart();await overlay.waitFor({state:'visible'});await page.keyboard.press('Escape');await overlay.waitFor({state:'detached'});
  await page.waitForTimeout(100);assert.equal(closed,2);
  await restart();await overlay.waitFor({state:'visible'});await page.emulateMedia({reducedMotion:'reduce'});await overlay.waitFor({state:'detached'});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{window.Worker=function(){throw new DOMException('blocked','SecurityError');};});
  await restart();await overlay.waitFor({state:'visible'});
  assert.equal(await overlay.locator('canvas').evaluate(canvas=>!!canvas.getContext('2d')),true,'Constructor failure falls back');
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{window.Worker=class extends window.__nativeWorker{constructor(){super(URL.createObjectURL(new Blob(['throw Error("fixture failure")'],{type:'text/javascript'})));}};});
  await restart();await overlay.waitFor({state:'visible'});await page.waitForTimeout(250);
  assert.equal(await overlay.locator('canvas').evaluate(canvas=>!!canvas.getContext('2d')),true,'Failure after transfer replaces the canvas and falls back');
  await page.keyboard.press('Escape');assert.deepEqual(errors,[]);
  console.log('Worker passed: six-second completion, audio/focus/draft cleanup, Escape, reduced motion, constructor failure and asynchronous fallback.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
