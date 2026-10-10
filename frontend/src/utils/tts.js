// Text-to-speech using the browser's built-in voices (no API key, works offline).
const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function cancelSpeech() {
  if (supported()) window.speechSynthesis.cancel();
}

export function speakNow(text, { lang = 'en-IN', rate = 0.9, onStart, onEnd } = {}) {
  if (!supported() || !text) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
  if (voice) u.voice = voice;
  u.onstart = () => onStart && onStart();
  u.onend = u.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(u);
  return true;
}
