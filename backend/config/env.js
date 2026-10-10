const path = require('path');
// Load the root .env first, then backend/.env (dotenv never overrides existing vars)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config();

const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\nMissing environment variables: ${missing.join(', ')}\nCopy .env.example to .env and fill them in.\n`);
  process.exit(1);
}
const placeholder = /change-me/i.test(process.env.JWT_SECRET);
if (process.env.NODE_ENV === 'production' && (placeholder || process.env.JWT_SECRET.length < 32)) {
  console.error('\nRefusing to start: set JWT_SECRET to a long random value (32+ characters).\nGenerate one:  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
  process.exit(1);
}
if (placeholder || process.env.JWT_SECRET.length < 16) {
  console.warn('Warning: JWT_SECRET is a placeholder or too short. Fine for local demos, never for a real deployment.');
}
if (process.env.NODE_ENV === 'production' && !process.env.AI_INTERNAL_KEY) {
  console.warn('Warning: AI_INTERNAL_KEY is not set; using the default. Set the same random value on the backend and the AI service.');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d',
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiInternalKey: process.env.AI_INTERNAL_KEY || 'dev-internal-key-change-me',
  timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
};
