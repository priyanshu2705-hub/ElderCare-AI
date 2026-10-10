// Talks to the FastAPI AI service. The AI service has no database access.
const env = require('../config/env');
const AppError = require('../utils/AppError');

const FRIENDLY = "I'm having trouble thinking right now. Please try again in a moment.";

async function request(path, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${env.aiServiceUrl}${path}`, {
      ...options,
      headers: { 'x-internal-key': env.aiInternalKey, ...(options.headers || {}) },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`AI service ${path} returned ${res.status}`);
      throw new AppError(502, FRIENDLY, 'AI_FAILED');
    }
    return await res.json();
  } catch (e) {
    if (e instanceof AppError) throw e;
    console.error(`AI service ${path} unreachable:`, e.message);
    throw new AppError(503, FRIENDLY, 'AI_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
}

const postJson = (path, body) =>
  request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

module.exports = {
  chat: (payload) => postJson('/ai/chat', payload),
  explain: (payload) => postJson('/ai/explain', payload),
  analyzeSample: () => postJson('/ai/analyze-document/sample', {}),
  analyzeDocument(file, fields = {}) {
    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'photo');
    Object.entries(fields).forEach(([k, v]) => form.append(k, String(v)));
    return request('/ai/analyze-document', { method: 'POST', body: form }, 60000);
  },
};
