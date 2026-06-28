const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onValueWritten } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
admin.initializeApp();

// ── SVIP Level Thresholds (wallet.totalSpent → SVIP level) ─────────────────
// Matches SVIP_LEVELS_DATA in src/app/vips/index.tsx
const SVIP_LEVELS = [
  { level: 1,  threshold: 1500000 },
  { level: 2,  threshold: 3000000 },
  { level: 3,  threshold: 6250000 },
  { level: 4,  threshold: 12500000 },
  { level: 5,  threshold: 25000000 },
  { level: 6,  threshold: 50000000 },
  { level: 7,  threshold: 75000000 },
  { level: 8,  threshold: 100000000 },
  { level: 9,  threshold: 150000000 },
  { level: 10, threshold: 200000000 },
  { level: 11, threshold: 275000000 },
  { level: 12, threshold: 350000000 },
  { level: 13, threshold: 425000000 },
  { level: 14, threshold: 500000000 },
  { level: 15, threshold: 575000000 },
  { level: 16, threshold: 650000000 },
  { level: 17, threshold: 700000000 },
  { level: 18, threshold: 750000000 },
];

function calculateSvipLevel(totalSpent) {
  let level = 0;
  for (const tier of SVIP_LEVELS) {
    if (totalSpent >= tier.threshold) {
      level = tier.level;
    } else {
      break;
    }
  }
  return level;
}

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

// ── Auto-Promote SVIP Level ────────────────────────────────────────────────
// Triggers when wallet.totalSpent changes on profile subdoc.
// Writes svip to BOTH root doc and profile subdoc for consistency.
exports.autoPromoteSvip = onDocumentWritten(
  { document: 'users/{userId}/profile/{userId}', region: 'us-central1' },
  async (event) => {
    const { userId } = event.params;
    const beforeData = event.data.before?.data() || {};
    const afterData = event.data.after?.data() || {};

    // Only process if totalSpent actually changed
    const beforeSpent = beforeData?.wallet?.totalSpent ?? 0;
    const afterSpent = afterData?.wallet?.totalSpent ?? 0;
    if (beforeSpent === afterSpent) return;

    const newLevel = calculateSvipLevel(afterSpent);
    const currentSvip = afterData?.svip ?? 0;

    // Only write if level actually changed
    if (newLevel === currentSvip) return;

    const db = admin.firestore();
    const batch = db.batch();

    // Write to profile subdoc (client reads this via useUserProfile)
    const profileRef = db.doc(`users/${userId}/profile/${userId}`);
    batch.update(profileRef, {
      svip: newLevel,
      svipUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Write to root doc (backup/consistency)
    const rootRef = db.doc(`users/${userId}`);
    batch.update(rootRef, {
      svip: newLevel,
      svipUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // Telegram alert
    const direction = newLevel > currentSvip ? '⬆️ PROMOTED' : '⬇️ DEMOTED';
    await sendTelegramAlert({
      emoji: newLevel > currentSvip ? '🎉' : '📉',
      title: `SVIP ${direction}`,
      lines: [
        `👤 User: \`${userId}\``,
        `📊 Total Spent: ${afterSpent.toLocaleString('en-IN')}`,
        `🏷️ Old Level: SVIP ${currentSvip}`,
        `🏷️ New Level: SVIP ${newLevel}`,
      ]
    });

    console.log(`[autoPromoteSvip] ${userId}: SVIP ${currentSvip} → ${newLevel} (totalSpent: ${afterSpent})`);
  }
);

// ── Scheduled Leaderboard Reset ─────────────────────────────────────────────
// Runs at exactly midnight IST daily to reset daily counters.
// On Monday midnight also resets weekly. On 1st midnight also resets monthly.
exports.resetLeaderboardCounters = onSchedule(
  {
    schedule: '0 0 * * *',       // ← cron: exactly midnight every day
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
  },
  async () => {
    const db = admin.firestore();
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dayOfWeek  = now.getDay();   // 0=Sun, 1=Mon
    const dayOfMonth = now.getDate();

    console.log(`[resetLeaderboardCounters] Midnight IST — dayOfWeek=${dayOfWeek}, dayOfMonth=${dayOfMonth}`);

    // Always reset daily counters at midnight
    await resetDailyCounters(db);

    // Weekly reset every Monday midnight
    if (dayOfWeek === 1) {
      await resetWeeklyCounters(db);
    }

    // Monthly reset on 1st of each month
    if (dayOfMonth === 1) {
      await resetMonthlyCounters(db);
    }

    console.log('[resetLeaderboardCounters] Done');
  }
);

async function resetDailyCounters(db) {
  console.log('[resetDailyCounters] Starting daily reset...');

  const usersSnapshot = await db.collection('users').get();
  let count = 0;
  let batch = db.batch();

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const rootRef  = userDoc.ref;
    const profRef  = db.doc(`users/${uid}/profile/${uid}`);

    const resetFields = {
      'wallet.dailySpent': 0,
      'stats.dailyGiftsReceived': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.update(rootRef, resetFields);   // root doc
    batch.update(profRef, resetFields);   // profile subdoc ← NEW FIX
    count++;

    // Firestore batch limit: 500 ops (2 ops per user → flush every 250 users)
    if (count % 250 === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`[resetDailyCounters] Reset ${count} users...`);
    }
  }

  if (count % 250 !== 0) await batch.commit();

  // Reset room stats.dailyGifts
  const roomsSnapshot = await db.collection('chatRooms').get();
  let roomBatch = db.batch();
  let roomCount = 0;

  for (const doc of roomsSnapshot.docs) {
    roomBatch.update(doc.ref, {
      'stats.dailyGifts': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    roomCount++;
    if (roomCount % 500 === 0) {
      await roomBatch.commit();
      roomBatch = db.batch();
    }
  }
  if (roomCount % 500 !== 0) await roomBatch.commit();

  console.log(`[resetDailyCounters] Reset ${count} users, ${roomCount} rooms`);

  await sendTelegramAlert({
    emoji: '🔄',
    title: 'DAILY LEADERBOARD RESET',
    lines: [
      `👥 Users reset: ${count} (root + profile)`,
      `🏠 Rooms reset: ${roomCount}`,
      `📊 Reset: wallet.dailySpent, stats.dailyGiftsReceived, stats.dailyGifts`,
    ]
  });
}

async function resetWeeklyCounters(db) {
  console.log('[resetWeeklyCounters] Starting weekly reset...');

  const usersSnapshot = await db.collection('users').get();
  let count = 0;
  let batch = db.batch();

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const rootRef = userDoc.ref;
    const profRef = db.doc(`users/${uid}/profile/${uid}`);

    const resetFields = {
      'wallet.weeklySpent': 0,
      'stats.weeklyGiftsReceived': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.update(rootRef, resetFields);
    batch.update(profRef, resetFields);  // ← profile subdoc
    count++;

    if (count % 250 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (count % 250 !== 0) await batch.commit();

  const roomsSnapshot = await db.collection('chatRooms').get();
  let roomBatch = db.batch();
  let roomCount = 0;

  for (const doc of roomsSnapshot.docs) {
    roomBatch.update(doc.ref, {
      'stats.weeklyGifts': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    roomCount++;
    if (roomCount % 500 === 0) {
      await roomBatch.commit();
      roomBatch = db.batch();
    }
  }
  if (roomCount % 500 !== 0) await roomBatch.commit();

  console.log(`[resetWeeklyCounters] Reset ${count} users, ${roomCount} rooms`);

  await sendTelegramAlert({
    emoji: '📅',
    title: 'WEEKLY LEADERBOARD RESET',
    lines: [
      `👥 Users reset: ${count} (root + profile)`,
      `🏠 Rooms reset: ${roomCount}`,
      `📊 Reset: wallet.weeklySpent, stats.weeklyGiftsReceived, stats.weeklyGifts`,
    ]
  });
}

async function resetMonthlyCounters(db) {
  console.log('[resetMonthlyCounters] Starting monthly reset...');

  const usersSnapshot = await db.collection('users').get();
  let count = 0;
  let batch = db.batch();

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const rootRef = userDoc.ref;
    const profRef = db.doc(`users/${uid}/profile/${uid}`);

    const resetFields = {
      'wallet.monthlySpent': 0,
      'stats.monthlyGiftsReceived': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.update(rootRef, resetFields);
    batch.update(profRef, resetFields);  // ← profile subdoc
    count++;

    if (count % 250 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (count % 250 !== 0) await batch.commit();

  const roomsSnapshot = await db.collection('chatRooms').get();
  let roomBatch = db.batch();
  let roomCount = 0;

  for (const doc of roomsSnapshot.docs) {
    roomBatch.update(doc.ref, {
      'stats.monthlyGifts': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    roomCount++;
    if (roomCount % 500 === 0) {
      await roomBatch.commit();
      roomBatch = db.batch();
    }
  }
  if (roomCount % 500 !== 0) await roomBatch.commit();

  console.log(`[resetMonthlyCounters] Reset ${count} users, ${roomCount} rooms`);

  await sendTelegramAlert({
    emoji: '📆',
    title: 'MONTHLY LEADERBOARD RESET',
    lines: [
      `👥 Users reset: ${count} (root + profile)`,
      `🏠 Rooms reset: ${roomCount}`,
      `📊 Reset: wallet.monthlySpent, stats.monthlyGiftsReceived, stats.monthlyGifts`,
    ]
  });
}

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

// ─────────────────────────────────────────────────────────────
// SCHEDULED: Daily reset of wallet.dailySpent at midnight IST
// IST = UTC+5:30, so midnight IST = 18:30 UTC previous day
// Cron: "30 18 * * *" = runs every day at 18:30 UTC = 00:00 IST
// ─────────────────────────────────────────────────────────────
exports.dailyWalletReset = onSchedule(
  { schedule: '30 18 * * *', timeZone: 'UTC', region: 'us-central1' },
  async () => {
    const db = admin.firestore();
    console.log('[dailyWalletReset] Starting daily reset at midnight IST...');

    const BATCH_SIZE = 400;
    let totalUpdated = 0;
    let lastDoc = null;

    while (true) {
      let q = db.collection('users').limit(BATCH_SIZE);
      if (lastDoc) q = q.startAfter(lastDoc);

      const snapshot = await q.get();
      if (snapshot.empty) break;

      const batch = db.batch();

      snapshot.docs.forEach(docSnap => {
        const uid = docSnap.id;
        const userRef = db.doc(`users/${uid}`);
        const profileRef = db.doc(`users/${uid}/profile/${uid}`);

        batch.set(userRef, {
          'wallet.dailySpent': 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        batch.set(profileRef, {
          'wallet.dailySpent': 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      await batch.commit();
      totalUpdated += snapshot.docs.length;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      console.log(`[dailyWalletReset] Processed ${totalUpdated} users so far...`);

      if (snapshot.docs.length < BATCH_SIZE) break;
    }

    console.log(`[dailyWalletReset] ✅ Daily reset complete. Total users reset: ${totalUpdated}`);
  }
);

// ─────────────────────────────────────────────────────────────
// SCHEDULED: Weekly reset of wallet.weeklySpent at midnight IST
// Every Monday midnight IST = Sunday 18:30 UTC
// Cron: "30 18 * * 0" = every Sunday at 18:30 UTC
// ─────────────────────────────────────────────────────────────
exports.weeklyWalletReset = onSchedule(
  { schedule: '30 18 * * 0', timeZone: 'UTC', region: 'us-central1' },
  async () => {
    const db = admin.firestore();
    console.log('[weeklyWalletReset] Starting weekly reset at Monday midnight IST...');

    const BATCH_SIZE = 400;
    let totalUpdated = 0;
    let lastDoc = null;

    while (true) {
      let q = db.collection('users').limit(BATCH_SIZE);
      if (lastDoc) q = q.startAfter(lastDoc);

      const snapshot = await q.get();
      if (snapshot.empty) break;

      const batch = db.batch();

      snapshot.docs.forEach(docSnap => {
        const uid = docSnap.id;
        const userRef = db.doc(`users/${uid}`);
        const profileRef = db.doc(`users/${uid}/profile/${uid}`);

        batch.set(userRef, {
          'wallet.weeklySpent': 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        batch.set(profileRef, {
          'wallet.weeklySpent': 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      await batch.commit();
      totalUpdated += snapshot.docs.length;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.docs.length < BATCH_SIZE) break;
    }

    console.log(`[weeklyWalletReset] ✅ Weekly reset complete. Total users reset: ${totalUpdated}`);
  }
);

