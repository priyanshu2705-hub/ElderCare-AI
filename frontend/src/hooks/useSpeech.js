import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelSpeech, speakNow } from '../utils/tts.js';

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

const ERROR_TEXT = {
  'not-allowed': "I can't use the microphone. Please allow it in your browser, or type your question below.",
  'service-not-allowed': "I can't use the microphone. Please allow it in your browser, or type your question below.",
  'no-speech': 'I did not hear anything. Please tap the microphone and try again.',
  'audio-capture': 'I cannot find a microphone on this device. Please type your question below.',
  network: 'Voice needs the internet in this browser. Please type your question below.',
};

/** Speech-to-text (browser) + text-to-speech (browser). Always safe to call: if the
 *  browser has no speech recognition, `supported` is false and the UI shows a text box. */
export default function useSpeech({ lang = 'en-IN', rate = 0.9, voiceEnabled = true } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const finalRef = useRef('');

  const stopSpeaking = useCallback(() => { cancelSpeech(); setSpeaking(false); }, []);

  // force=true is used by "Listen again" buttons, which should speak even if auto-voice is off
  const speak = useCallback((text, { force = false } = {}) => {
    if (!voiceEnabled && !force) return;
    speakNow(text, { lang, rate, onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
  }, [lang, rate, voiceEnabled]);

  const listen = useCallback((onFinal) => {
    if (!SR) { setError('Voice is not available in this browser. Please type your question below.'); return; }
    stopSpeaking();
    setError('');
    setInterim('');
    finalRef.current = '';
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(finalRef.current + interimText);
    };
    rec.onerror = (e) => { if (e.error !== 'aborted') setError(ERROR_TEXT[e.error] || 'I could not hear you. Please try again, or type below.'); };
    rec.onend = () => {
      setListening(false);
      setInterim('');
      recRef.current = null;
      const text = finalRef.current.trim();
      if (text) onFinal(text);
    };
    recRef.current = rec;
    try { rec.start(); } catch { setError('I could not start the microphone. Please try again.'); }
  }, [lang, stopSpeaking]);

  const stopListening = useCallback(() => { if (recRef.current) recRef.current.stop(); }, []);

  useEffect(() => () => { if (recRef.current) recRef.current.abort(); cancelSpeech(); }, []);

  return { supported: !!SR, listening, interim, speaking, error, setError, listen, stopListening, speak, stopSpeaking };
}
