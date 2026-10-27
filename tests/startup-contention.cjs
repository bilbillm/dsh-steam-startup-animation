const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(process.env.DSH_PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const browser=await chromium.launch({channel:process.env.DSH_BROWSER_CHANNEL || 'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'no-preference'});
    const workers=[];
    page.on('worker',worker=>workers.push(worker));
    await page.route('http://startup.test/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="zh"><body style="margin:0"><main id="app">Harness</main></body></html>'}));
    await page.goto('http://startup.test/');
    await page.evaluate(()=>{
      window.dshDesktop={window:{}};window.__probeFrames=[];
      const nativeRaf=window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame=callback=>nativeRaf(timestamp=>{
        if(callback.name==='tick')window.__probeFrames.push(timestamp);
        return callback(timestamp);
      });
      window.__ctx={effect:fn=>fn(),slots:{inject:(_name,fn)=>fn(),register:()=>()=>{}}};
      window.__ModuleLoader__={load({factory}){window.__plugin=factory(name=>{if(name==='react')return{createElement(){},useState(){}};throw Error(name);});}};
    });
    await page.addScriptTag({path:path.resolve(__dirname,'../lib/client.js')});
    await page.evaluate(()=>window.__plugin.apply(window.__ctx));
    await page.waitForTimeout(150);
    for(const worker of workers)await worker.evaluate(()=>{
      self.__probeFrames=[];
      const nativeRaf=self.requestAnimationFrame.bind(self);
      self.requestAnimationFrame=callback=>nativeRaf(timestamp=>{self.__probeFrames.push(timestamp);return callback(timestamp);});
    });
    await page.evaluate(()=>{setTimeout(()=>{const deadline=performance.now()+180;while(performance.now()<deadline){}},250);});
    await page.waitForTimeout(1400);
    const times=workers.length ? await workers[0].evaluate(()=>self.__probeFrames) : await page.evaluate(()=>window.__probeFrames);
    const gaps=times.slice(1).map((time,i)=>time-times[i]);
    const result={renderer:workers.length?'worker':'main',frames:times.length,maxGap:+Math.max(0,...gaps).toFixed(2),over50:gaps.filter(v=>v>50).length};
    console.log(JSON.stringify(result));
    assert.ok(times.length>20,'The actual startup renderer must produce frames');
    assert.ok(result.maxGap<=50,`Startup froze for ${result.maxGap} ms while Harness occupied the UI thread for 180 ms`);
    await page.keyboard.press('Escape');
  }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
