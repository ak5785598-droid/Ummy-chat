const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onValueWritten } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');
admin.initializeApp();

const SKIP_PATHS = ['roomPresence'];

/**
 * Monitors wallet.coins changes on users/{userId} root doc.
 */
exports.monitorWalletCoinsRoot = onDocumentWritten(
  { document: 'users/{userId}', region: 'us-central1' },
  async (event) => {
    const { userId } = event.params;
    await checkWalletChange(event, userId, 'users/{userId} (root)');
  }
);

/**
 * Monitors wallet.coins changes on users/{userId}/profile/{userId} profile doc.
 */
exports.monitorWalletCoinsProfile = onDocumentWritten(
  { document: 'users/{userId}/profile/{userId}', region: 'us-central1' },
  async (event) => {
    const { userId } = event.params;
    await checkWalletChange(event, userId, 'users/{userId}/profile/{userId} (profile)');
  }
);

async function checkWalletChange(event, userId, path) {
  const beforeData = event.data.before?.data() || {};
  const afterData = event.data.after?.data() || {};

  const beforeCoins = beforeData?.wallet?.coins ?? 0;
  const afterCoins = afterData?.wallet?.coins ?? 0;

  if (beforeCoins === afterCoins) return;

  const difference = afterCoins - beforeCoins;
  const sign = difference >= 0 ? '+' : '';

  await sendTelegramAlert({
    emoji: difference > 0 ? '🟢' : '🔴',
    title: 'WALLET CHANGE',
    lines: [
      `👤 User: \`${userId}\``,
      `📂 Path: \`${path}\``,
      `💰 Before: ${beforeCoins}`,
      `💰 After:  ${afterCoins}`,
      `📊 Diff:   ${sign}${difference}`,
    ]
  });
}

/**
 * Monitors ALL Realtime Database changes (except roomPresence).
 * Catches any manual edit via Firebase Console.
 */
exports.monitorRealtimeDatabase = onValueWritten(
  { ref: '/{node}', region: 'us-central1' },
  async (event) => {
    const fullPath = event.params.node || '(root)';
    const before = event.data.before?.val();
    const after = event.data.after?.val();

    // Skip high-frequency paths to avoid spam
    for (const skip of SKIP_PATHS) {
      if (fullPath.startsWith(skip)) return;
    }
    // Skip null→null (no real change)
    if (before === null && after === null) return;
    // Skip null→empty object (initial write) and empty object→null (cleanup)
    if (before === null && typeof after === 'object' && after !== null && Object.keys(after).length === 0) return;
    if (typeof before === 'object' && before !== null && Object.keys(before).length === 0 && after === null) return;
    // Skip if only timestamps changed (heartbeat)
    if (fullPath.includes('/') && typeof before === 'number' && typeof after === 'number' && Math.abs(after - before) < 5000) return;

    const beforeStr = before === null ? 'null' : (typeof before === 'object' ? JSON.stringify(before).substring(0, 200) : String(before));
    const afterStr = after === null ? 'null' : (typeof after === 'object' ? JSON.stringify(after).substring(0, 200) : String(after));
    if (beforeStr === afterStr) return;

    await sendTelegramAlert({
      emoji: '🔵',
      title: 'RTDB CHANGE',
      lines: [
        `📂 Path: \`/${fullPath}\``,
        `📥 Before: ${beforeStr}`,
        `📤 After:  ${afterStr}`,
      ]
    });
  }
);

async function sendTelegramAlert({ emoji, title, lines }) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram config not set. Deploy with:');
    console.warn('  firebase functions:secrets:set TELEGRAM_BOT_TOKEN');
    console.warn('  firebase functions:secrets:set TELEGRAM_CHAT_ID');
    return;
  }

  const now = new Date();
  const timestamp = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const message = `${emoji} ${title} DETECTED
━━━━━━━━━━━━━━━━━━━
${lines.join('\n')}
🕐 Time: ${timestamp}
━━━━━━━━━━━━━━━━━━━`;

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram send failed:', JSON.stringify(result));
    }
  } catch (e) {
    console.error('Telegram fetch error:', e.message);
  }
}
