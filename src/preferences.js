export const PREFERENCES_KEY = 'dsh-startup-animation.preferences.v1';
export const DEFAULT_PREFERENCES = Object.freeze({enabled:true, sound:true, volume:0.7, desktopOnly:true});

export function normalizePreferences(value) {
  const input=value && typeof value==='object' ? value : {};
  return {
    enabled:typeof input.enabled==='boolean' ? input.enabled : true,
    sound:typeof input.sound==='boolean' ? input.sound : true,
    volume:typeof input.volume==='number' && Number.isFinite(input.volume) ? Math.max(0,Math.min(1,input.volume)) : 0.7,
    desktopOnly:typeof input.desktopOnly==='boolean' ? input.desktopOnly : true,
  };
}

export function readPreferences(storage) {
  try {return normalizePreferences(JSON.parse(storage.getItem(PREFERENCES_KEY) || '{}'));}
  catch {return {...DEFAULT_PREFERENCES};}
}

export function writePreferences(storage,value) {
  const preferences=normalizePreferences(value);
  try {storage.setItem(PREFERENCES_KEY,JSON.stringify(preferences));} catch {}
  return preferences;
}

export function shouldAutoPlay(preferences,{desktop,reducedMotion,seen}) {
  return preferences.enabled && (!preferences.desktopOnly || desktop) && !reducedMotion && !seen;
}
