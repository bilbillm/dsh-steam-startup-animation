import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences,readPreferences,writePreferences,shouldAutoPlay} from '../src/preferences.js';
test('damaged or unavailable storage preserves bootable defaults',()=>{
  assert.equal(readPreferences({getItem:()=>'{bad'}).enabled,true);
  assert.equal(readPreferences({getItem:()=>{throw Error('denied')}}).sound,true);
  assert.equal(writePreferences({setItem:()=>{throw Error('full')}},{volume:.4}).volume,.4);
});
test('unsafe values do not escape audio bounds',()=>{
  assert.equal(normalizePreferences({volume:2}).volume,1);
  assert.equal(normalizePreferences({volume:-5}).volume,0);
  assert.equal(normalizePreferences({volume:NaN}).volume,.7);
  assert.equal(normalizePreferences({enabled:'false'}).enabled,true);
});
test('startup respects desktop, reduced motion, disabled state and HMR',()=>{
  const p=normalizePreferences({});
  assert.equal(shouldAutoPlay(p,{desktop:true,reducedMotion:false,seen:false}),true);
  for(const environment of [{desktop:false,reducedMotion:false,seen:false},{desktop:true,reducedMotion:true,seen:false},{desktop:true,reducedMotion:false,seen:true}])assert.equal(shouldAutoPlay(p,environment),false);
  assert.equal(shouldAutoPlay({...p,enabled:false},{desktop:true,reducedMotion:false,seen:false}),false);
});
