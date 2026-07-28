const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onValueWritten } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
admin.initializeApp();

// ── SVIP Level Thresholds (monthlySpent/10 = SVIP Points) ──────────────────
// 10 Coins = 1 SVIP Point. Monthly reset with Points Back refund.
// threshold = coins needed to reach level (= SVIP Points × 10)
// pointsBack = coins refunded on monthly reset (= Points Back × 10)
const SVIP_LEVELS = [
  { level: 1,  threshold: 80000000,      pointsBack: 24000000 },
  { level: 2,  threshold: 240000000,     pointsBack: 80000000 },
  { level: 3,  threshold: 800000000,     pointsBack: 320000000 },
  { level: 4,  threshold: 2000000000,    pointsBack: 800000000 },
  { level: 5,  threshold: 4000000000,    pointsBack: 2000000000 },
  { level: 6,  threshold: 8000000000,    pointsBack: 4000000000 },
  { level: 7,  threshold: 13600000000,   pointsBack: 8000000000 },
  { level: 8,  threshold: 21600000000,   pointsBack: 13600000000 },
  { level: 9,  threshold: 36000000000,   pointsBack: 21600000000 },
  { level: 10, threshold: 56000000000,   pointsBack: 36000000000 },
  { level: 11, threshold: 84000000000,   pointsBack: 56000000000 },
  { level: 12, threshold: 120000000000,  pointsBack: 84000000000 },
  { level: 13, threshold: 168000000000,  pointsBack: 120000000000 },
  { level: 14, threshold: 224000000000,  pointsBack: 168000000000 },
  { level: 15, threshold: 300000000000,  pointsBack: 224000000000 },
  { level: 16, threshold: 400000000000,  pointsBack: 300000000000 },
  { level: 17, threshold: 520000000000,  pointsBack: 400000000000 },
  { level: 18, threshold: 680000000000,  pointsBack: 520000000000 },
];

// ── SVIP Monthly Coins Reward (level² × 400,000) ─────────────────────────────
const SVIP_MONTHLY_COINS = {};
for (let lvl = 1; lvl <= 18; lvl++) {
  SVIP_MONTHLY_COINS[lvl] = lvl * lvl * 400000;
}

// ── SVIP Privilege Assets (Firebase Storage URLs) ───────────────────────────
// Auto-assigned when user reaches a new SVIP level
const SVIP_PRIVILEGES = {
  owl: {
    bubble: 'svip-owl-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_owl_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_owl_entrance.png?alt=media',
    wave: 'svip-owl-wave',
  },
  wolf: {
    bubble: 'svip-wolf-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_wolf_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_wolf_entrance.png?alt=media',
    wave: 'svip-wolf-wave',
  },
  scorpion: {
    bubble: 'svip-scorpion-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_scorpion_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_scorpion_entrance.png?alt=media',
    wave: 'svip-scorpion-wave',
  },
  lion: {
    bubble: 'svip-lion-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_lion_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_lion_entrance.png?alt=media',
    wave: 'svip-lion-wave',
  },
  tiger: {
    bubble: 'svip-tiger-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_tiger_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_tiger_entrance.png?alt=media',
    wave: 'svip-tiger-wave',
  },
  dragon: {
    bubble: 'svip-dragon-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_dragon_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_dragon_entrance.png?alt=media',
    wave: 'svip-dragon-wave',
  },
};

// Per-level frame URLs (each SVIP level has its own unique frame)
const SVIP_LEVEL_FRAMES = {};
for (let lvl = 1; lvl <= 18; lvl++) {
  SVIP_LEVEL_FRAMES[lvl] = `https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_${lvl}_frame.png?alt=media`;
}

// Level → Theme mapping
function getSvipTheme(level) {
  if (level >= 16) return 'dragon';
  if (level >= 13) return 'tiger';
  if (level >= 10) return 'lion';
  if (level >= 7)  return 'scorpion';
  if (level >= 4)  return 'wolf';
  return 'owl';
}

// Calculate SVIP level from SVIP Points (monthlySpent / 10)
function calculateSvipLevel(svipPoints) {
  let level = 0;
  for (const tier of SVIP_LEVELS) {
    if (svipPoints >= tier.threshold / 10) {
      level = tier.level;
    } else {
      break;
    }
  }
  return level;
}

// Get Points Back (coins) for a given SVIP level
function getSvipPointsBack(level) {
  const tier = SVIP_LEVELS.find(t => t.level === level);
  return tier ? tier.pointsBack : 0;
}

// Get end of next month timestamp (retention period)
function getEndOfNextMonth() {
  const now = new Date();
  const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
  return admin.firestore.Timestamp.fromDate(endOfNextMonth);
}

const SKIP_PATHS = ['roomPresence', 'roomMessages', 'games/', 'globalPresence', '.info'];

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

// DISABLED — duplicate of monitorWalletCoinsRoot (fires on same wallet changes)
//节省 ~50% wallet monitor invocations
// exports.monitorWalletCoinsProfile = onDocumentWritten(
//   { document: 'users/{userId}/profile/{userId}', region: 'us-central1' },
//   async (event) => {
//     const { userId } = event.params;
//     await checkWalletChange(event, userId, 'users/{userId}/profile/{userId} (profile)');
//   }
// );

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
// DISABLED — was firing on EVERY RTDB change (voice heartbeat, presence, etc.)
// causing massive Pub/Sub + App Engine costs (~₹88+ per day).
// Koi feature affect nahi hoga — sirf Telegram alert tha.
// exports.monitorRealtimeDatabase = onValueWritten(
//   { ref: '/{node}', region: 'us-central1' },
//   async (event) => { ... }
// );

// ── Auto-Promote SVIP Level ────────────────────────────────────────────────
// Triggers when wallet.monthlySpent changes on profile subdoc.
// 10 Coins = 1 SVIP Point. Instant upgrade when threshold met.
// Level retained until end of next month (no mid-month downgrade).
exports.autoPromoteSvip = onDocumentWritten(
  { document: 'users/{userId}/profile/{userId}', region: 'us-central1' },
  async (event) => {
    const { userId } = event.params;
    const beforeData = event.data.before?.data() || {};
    const afterData = event.data.after?.data() || {};

    // Only process if monthlySpent actually changed
    const beforeMonthly = beforeData?.wallet?.monthlySpent ?? 0;
    const afterMonthly = afterData?.wallet?.monthlySpent ?? 0;
    if (beforeMonthly === afterMonthly) return;

    // Calculate SVIP Points = monthlySpent / 10
    const svipPoints = Math.floor(afterMonthly / 10);
    const newLevel = calculateSvipLevel(svipPoints);
    const currentSvip = afterData?.svip ?? 0;

    // Only process if level actually changed (upgrade only — no mid-month downgrade)
    if (newLevel <= currentSvip) return;

    const db = admin.firestore();
    const batch = db.batch();

    // Get SVIP privilege assets for the new level
    const theme = getSvipTheme(newLevel);
    const privileges = SVIP_PRIVILEGES[theme];

    // Privilege fields to set (frame is per-level, rest is theme-based)
    const privilegeUpdate = {
      'svipPrivileges.level': newLevel,
      'svipPrivileges.theme': theme,
      'svipPrivileges.frameUrl': SVIP_LEVEL_FRAMES[newLevel] || privileges.frame,
      'svipPrivileges.bubbleId': privileges.bubble,
      'svipPrivileges.bubbleUrl': privileges.bubbleUrl,
      'svipPrivileges.entranceType': privileges.entrance,
      'svipPrivileges.entranceUrl': privileges.entranceUrl,
      'svipPrivileges.waveId': privileges.wave,
      'svipPrivileges.assignedAt': admin.firestore.FieldValue.serverTimestamp(),
    };

    const retentionUntil = getEndOfNextMonth();

    // Write to profile subdoc (client reads this via useUserProfile)
    const profileRef = db.doc(`users/${userId}/profile/${userId}`);
    batch.update(profileRef, {
      svip: newLevel,
      svipUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      svipRetainedUntil: retentionUntil,
      ...privilegeUpdate,
    });

    // Write to root doc (backup/consistency)
    const rootRef = db.doc(`users/${userId}`);
    batch.update(rootRef, {
      svip: newLevel,
      svipUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      svipRetainedUntil: retentionUntil,
    });

    await batch.commit();

    // Telegram alert
    await sendTelegramAlert({
      emoji: '🎉',
      title: 'SVIP ⬆️ PROMOTED',
      lines: [
        `👤 User: \`${userId}\``,
        `📊 SVIP Points: ${svipPoints.toLocaleString('en-IN')}`,
        `🏷️ Old Level: SVIP ${currentSvip}`,
        `🏷️ New Level: SVIP ${newLevel}`,
        `🎨 Theme: ${theme}`,
        `🔒 Retained until: ${retentionUntil.toDate().toLocaleDateString('en-IN')}`,
        `🎁 Privileges: frame, bubble, entrance, wave auto-assigned`,
      ]
    });

    console.log(`[autoPromoteSvip] ${userId}: SVIP ${currentSvip} → ${newLevel} (points: ${svipPoints}) — ${theme} privileges assigned`);
  }
);

// ── Scheduled SVIP Monthly Coins Distribution ────────────────────────────────
// Runs on 1st of every month at 00:05 IST — auto-distributes coins to all SVIP users
exports.distributeSvipMonthlyCoins = onSchedule(
  {
    schedule: '5 0 1 * *',       // ← 1st of every month at 00:05 IST
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
  },
  async () => {
    const db = admin.firestore();
    console.log('[distributeSvipMonthlyCoins] Starting monthly SVIP coin distribution...');

    const usersSnapshot = await db.collection('users').get();
    let distributed = 0;
    let skipped = 0;
    let totalCoins = 0;

    const batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const svip = userData.svip || 0;
      if (svip <= 0) { skipped++; continue; }

      const coins = SVIP_MONTHLY_COINS[svip] || 0;
      if (coins <= 0) { skipped++; continue; }

      const userId = userDoc.id;
      const profileRef = db.doc(`users/${userId}/profile/${userId}`);

      batch.update(profileRef, {
        'wallet.coins': admin.firestore.FieldValue.increment(coins),
        svipMonthlyClaimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batch.update(userDoc.ref, {
        'wallet.coins': admin.firestore.FieldValue.increment(coins),
      });

      distributed++;
      totalCoins += coins;
      batchCount++;

      // Firestore batch limit is 500
      if (batchCount >= 500) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) await batch.commit();

    console.log(`[distributeSvipMonthlyCoins] Done! Distributed: ${distributed} users, Total: ${totalCoins.toLocaleString('en-IN')} coins`);
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

    // 1. Distribute daily rewards before resetting counters!
    try {
      await distributeDailyRewards(db);
    } catch (err) {
      console.error('[resetLeaderboardCounters] Error distributing daily rewards:', err);
    }

    // 2. Weekly rewards on Sunday before reset
    if (dayOfWeek === 0) {
      try {
        await distributeWeeklyRewards(db);
      } catch (err) {
        console.error('[resetLeaderboardCounters] Error distributing weekly rewards:', err);
      }
    }

    // 3. Monthly rewards on 1st before reset
    if (dayOfMonth === 1) {
      try {
        await distributeMonthlyRewards(db);
      } catch (err) {
        console.error('[resetLeaderboardCounters] Error distributing monthly rewards:', err);
      }
    }

    // 4. Always reset daily counters at midnight
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

// ── Room Support Weekly Reward Distribution ─────────────────────────────────
// Runs every Wednesday at 00:30 IST — distributes coins to room owners + partners
// based on their weekly gift level. Then the frontend shows lastWeekStats.
exports.distributeRoomSupportRewards = onSchedule(
  {
    schedule: '30 0 * * 3',       // Wednesday 00:30 IST
    timeZone: 'Asia/Kolkata',
    region: 'us-central1',
  },
  async () => {
    const db = admin.firestore();
    console.log('[distributeRoomSupportRewards] Starting Wednesday room support rewards...');

    const GOALS_REWARDS = [
      { level: 17, visitors: 130, roomCoins: 2600000000, hostCoins: 152200000, partnerCoins: 8230000, partners: 13 },
      { level: 16, visitors: 120, roomCoins: 1900000000, hostCoins: 100750000, partnerCoins: 7200000, partners: 12 },
      { level: 15, visitors: 110, roomCoins: 1300000000, hostCoins: 77350000, partnerCoins: 4930000, partners: 11 },
      { level: 14, visitors: 100, roomCoins: 800000000, hostCoins: 45250000, partnerCoins: 3700000, partners: 10 },
      { level: 13, visitors: 90, roomCoins: 600000000, hostCoins: 33950000, partnerCoins: 3080000, partners: 9 },
      { level: 12, visitors: 70, roomCoins: 400000000, hostCoins: 21400000, partnerCoins: 2470000, partners: 8 },
      { level: 11, visitors: 50, roomCoins: 300000000, hostCoins: 17900000, partnerCoins: 1850000, partners: 7 },
      { level: 10, visitors: 45, roomCoins: 200000000, hostCoins: 13150000, partnerCoins: 1230000, partners: 6 },
      { level: 9, visitors: 40, roomCoins: 150000000, hostCoins: 10300000, partnerCoins: 1070000, partners: 5 },
      { level: 8, visitors: 35, roomCoins: 100000000, hostCoins: 9200000, partnerCoins: 550000, partners: 5 },
      { level: 7, visitors: 30, roomCoins: 75000000, hostCoins: 7012500, partnerCoins: 506250, partners: 5 },
      { level: 6, visitors: 25, roomCoins: 50000000, hostCoins: 4750000, partnerCoins: 400000, partners: 5 },
      { level: 5, visitors: 20, roomCoins: 22500000, hostCoins: 2325000, partnerCoins: 225000, partners: 4 },
      { level: 4, visitors: 15, roomCoins: 15000000, hostCoins: 1600000, partnerCoins: 200000, partners: 3 },
      { level: 3, visitors: 10, roomCoins: 10000000, hostCoins: 1353350, partnerCoins: 135000, partners: 3 },
      { level: 2, visitors: 5, roomCoins: 5000000, hostCoins: 450000, partnerCoins: 150000, partners: 1 },
      { level: 1, visitors: 2, roomCoins: 2500000, hostCoins: 275000, partnerCoins: 75000, partners: 1 },
    ];

    const roomsSnap = await db.collection('chatRooms')
      .where('stats.lastWeekRewardsDistributed', '==', false)
      .get();

    const rewardLines = [];
    let roomsRewarded = 0;
    let totalHostCoins = 0;
    let totalPartnerCoins = 0;

    for (const roomDoc of roomsSnap.docs) {
      const roomData = roomDoc.data();
      const lastWeekGifts = roomData.stats?.lastWeekGifts || 0;
      const lastWeekLevel = roomData.stats?.lastWeekLevel || 0;
      const ownerId = roomData.ownerId;
      const partners = roomData.partners || [];

      if (lastWeekGifts <= 0 || !ownerId) {
        await roomDoc.ref.update({ 'stats.lastWeekRewardsDistributed': true });
        continue;
      }

      const goal = [...GOALS_REWARDS].reverse().find(g => lastWeekGifts >= g.roomCoins) || null;
      if (!goal) {
        await roomDoc.ref.update({ 'stats.lastWeekRewardsDistributed': true });
        continue;
      }

      const batch = db.batch();
      const roomTitle = roomData.title || roomDoc.id;

      // Reward host
      const hostRef = db.collection('users').doc(ownerId);
      const hostSnap = await hostRef.get();
      if (hostSnap.exists()) {
        batch.update(hostRef, {
          'wallet.coins': admin.firestore.FieldValue.increment(goal.hostCoins),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const hostProfRef = db.doc(`users/${ownerId}/profile/${ownerId}`);
        const hostProfSnap = await hostProfRef.get();
        if (hostProfSnap.exists()) {
          batch.update(hostProfRef, {
            'wallet.coins': admin.firestore.FieldValue.increment(goal.hostCoins),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        totalHostCoins += goal.hostCoins;
        const hostName = hostSnap.data().username || 'Owner';
        rewardLines.push(`🏠 ${roomTitle} | Host: ${hostName} | +${goal.hostCoins.toLocaleString()} coins`);
      }

      // Reward partners (up to goal.partners count)
      const maxPartners = Math.min(partners.length, goal.partners);
      for (let i = 0; i < maxPartners; i++) {
        const p = partners[i];
        if (p?.uid) {
          const pRef = db.collection('users').doc(p.uid);
          const pSnap = await pRef.get();
          if (pSnap.exists()) {
            batch.update(pRef, {
              'wallet.coins': admin.firestore.FieldValue.increment(goal.partnerCoins),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            const pProfRef = db.doc(`users/${p.uid}/profile/${p.uid}`);
            const pProfSnap = await pProfRef.get();
            if (pProfSnap.exists()) {
              batch.update(pProfRef, {
                'wallet.coins': admin.firestore.FieldValue.increment(goal.partnerCoins),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
            totalPartnerCoins += goal.partnerCoins;
          }
        }
      }

      // Mark as distributed
      batch.update(roomDoc.ref, {
        'stats.lastWeekRewardsDistributed': true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      roomsRewarded++;
    }

    console.log(`[distributeRoomSupportRewards] Rewarded ${roomsRewarded} rooms`);
    if (rewardLines.length > 0) {
      await sendTelegramAlert({
        emoji: '🏆',
        title: 'ROOM SUPPORT WEEKLY REWARDS',
        lines: [
          `🏠 Rooms rewarded: ${roomsRewarded}`,
          `💰 Total host coins: ${totalHostCoins.toLocaleString()}`,
          `💰 Total partner coins: ${totalPartnerCoins.toLocaleString()}`,
          ...rewardLines,
        ]
      });
    }
  }
);

async function distributeDailyRewards(db) {
  console.log('[distributeDailyRewards] Starting reward distribution...');

  const themeSnap = await db.collection('leaderboardThemes').where('isActive', '==', true).limit(1).get();
  let activeTheme = null;
  let activeThemeId = 'default_theme';
  if (!themeSnap.empty) {
    activeTheme = themeSnap.docs[0].data();
    activeThemeId = themeSnap.docs[0].id;
  }

  function getFrameUrl(rank) {
    if (!activeTheme || !activeTheme.frameConfigs) return null;
    const config = rank === 1 ? activeTheme.frameConfigs.rank1 : rank === 2 ? activeTheme.frameConfigs.rank2 : rank === 3 ? activeTheme.frameConfigs.rank3 : null;
    if (config && config.isEnabled) return config.videoUrl || config.imageUrl || null;
    return null;
  }

  function getCoinReward(rank) {
    if (rank >= 1 && rank <= 3) return 10000000;
    if (rank >= 4 && rank <= 7) return 3000000;
    if (rank >= 8 && rank <= 10) return 1000000;
    return 0;
  }

  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 24);
  const expiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);

  const rewardLines = [];

  async function distributeToUsers(snap, categoryName, field, cashbackRate) {
    let rank = 1;
    rewardLines.push('\n' + categoryName + ' DAILY WINNERS:');
    for (const doc of snap.docs) {
      const data = doc.data();
      const value = data[field] || 0;
      if (value > 0) {
        const coinReward = getCoinReward(rank);
        const cashback = Math.floor(value * cashbackRate);
        const totalReward = coinReward + cashback;
        const frameUrl = getFrameUrl(rank);
        const username = data.username || 'User';

        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(totalReward) };

        if (frameUrl && rank <= 3) {
          const storeFrameId = rank === 1 ? 'event_rank1_frame' : rank === 2 ? 'event_rank2_frame' : 'event_rank3_frame';
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(storeFrameId);
          updates['inventory.expiries.' + storeFrameId] = expiryTimestamp;
        }

        const batch = db.batch();
        batch.update(doc.ref, updates);
        const profRef = db.doc('users/' + doc.id + '/profile/' + doc.id);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();

        rewardLines.push('  Rank ' + rank + ': ' + username + ' (ID: ' + (data.accountNumber || 'N/A') + ') | Coins: ' + totalReward.toLocaleString() + (frameUrl && rank <= 3 ? ' + Frame' : ''));
      }
      rank++;
    }
  }

  const richSnap = await db.collection('users').orderBy('wallet.dailySpent', 'desc').limit(10).get();
  await distributeToUsers(richSnap, 'HONOR', 'wallet.dailySpent', 0.014);

  const charmSnap = await db.collection('users').orderBy('stats.dailyGiftsReceived', 'desc').limit(10).get();
  await distributeToUsers(charmSnap, 'CHARM', 'stats.dailyGiftsReceived', 0.014);

  const roomSnap = await db.collection('chatRooms').orderBy('stats.dailyGifts', 'desc').limit(10).get();
  let roomRank = 1;
  rewardLines.push('\nROOM RANKING DAILY WINNERS (Room Owners):');
  for (const doc of roomSnap.docs) {
    const roomData = doc.data();
    const dailyGifts = roomData.stats?.dailyGifts || 0;
    const ownerId = roomData.ownerId;
    if (dailyGifts > 0 && ownerId) {
      const ownerRef = db.collection('users').doc(ownerId);
      const ownerSnap = await ownerRef.get();
      if (ownerSnap.exists()) {
        const ownerData = ownerSnap.data();
        const coinReward = getCoinReward(roomRank);
        const cashback = Math.floor(dailyGifts * 0.013);
        const totalReward = coinReward + cashback;
        const frameUrl = getFrameUrl(roomRank);
        const ownerName = ownerData.username || 'Owner';

        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(totalReward) };
        if (frameUrl && roomRank <= 3) {
          const storeFrameId = roomRank === 1 ? 'event_rank1_frame' : roomRank === 2 ? 'event_rank2_frame' : 'event_rank3_frame';
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(storeFrameId);
          updates['inventory.expiries.' + storeFrameId] = expiryTimestamp;
        }

        const batch = db.batch();
        batch.update(ownerRef, updates);
        const profRef = db.doc('users/' + ownerId + '/profile/' + ownerId);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();

        rewardLines.push('  Rank ' + roomRank + ': Room Owner ' + ownerName + ' (Room ID: ' + doc.id + ') | Coins: ' + totalReward.toLocaleString() + (frameUrl && roomRank <= 3 ? ' + Frame' : ''));
      }
    }
    roomRank++;
  }

  if (rewardLines.length > 0) {

  // --- CATEGORY 4: FAMILY ---
  const familySnap = await db.collection('families').orderBy('totalWealth', 'desc').limit(10).get();
  let familyRank = 1;
  rewardLines.push('\nFAMILY RANKING DAILY WINNERS:');
  for (const doc of familySnap.docs) {
    const familyData = doc.data();
    const totalWealth = familyData.totalWealth || 0;
    const ownerId = familyData.ownerId;
    if (totalWealth > 0 && ownerId) {
      const ownerRef = db.collection('users').doc(ownerId);
      const ownerSnap = await ownerRef.get();
      if (ownerSnap.exists()) {
        const ownerData = ownerSnap.data();
        const coinReward = getCoinReward(familyRank);
        const frameUrl = getFrameUrl(familyRank);
        const ownerName = ownerData.username || 'Owner';
        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
        if (frameUrl && familyRank <= 3) {
          const storeFrameId = familyRank === 1 ? 'event_rank1_frame' : familyRank === 2 ? 'event_rank2_frame' : 'event_rank3_frame';
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(storeFrameId);
          updates['inventory.expiries.' + storeFrameId] = expiryTimestamp;
        }
        const batch = db.batch();
        batch.update(ownerRef, updates);
        const profRef = db.doc('users/' + ownerId + '/profile/' + ownerId);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();
        rewardLines.push('  Rank ' + familyRank + ': Family ' + (familyData.name || 'Unknown') + ' | Coins: ' + coinReward.toLocaleString() + (frameUrl && familyRank <= 3 ? ' + Frame' : ''));
      }
    }
    familyRank++;
  }

  // --- CATEGORY 5: CP ---
  const cpSnap = await db.collection('cpPairs').orderBy('cpValue', 'desc').limit(10).get();
  let cpRank = 1;
  rewardLines.push('\nCP RANKING DAILY WINNERS:');
  for (const doc of cpSnap.docs) {
    const cpData = doc.data();
    const cpValue = cpData.cpValue || 0;
    if (cpValue > 0) {
      const coinReward = getCoinReward(cpRank);
      const frameUrl = getFrameUrl(cpRank);
      const user1Name = cpData.user1Name || 'User';
      const user2Name = cpData.user2Name || 'User';
      const partners = [cpData.user1Uid, cpData.user2Uid];
      for (let pi = 0; pi < partners.length; pi++) {
        const partnerUid = partners[pi];
        if (partnerUid) {
          const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
          if (frameUrl && cpRank <= 3) {
            let storeFrameId;
            if (cpRank === 1) {
              storeFrameId = pi === 0 ? 'cp_king_frame' : 'cp_queen_frame';
            } else {
              storeFrameId = cpRank === 2 ? 'event_rank2_frame' : 'event_rank3_frame';
            }
            updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(storeFrameId);
            updates['inventory.expiries.' + storeFrameId] = expiryTimestamp;
          }
          const batch = db.batch();
          const userRef = db.collection('users').doc(partnerUid);
          batch.update(userRef, updates);
          const profRef = db.doc('users/' + partnerUid + '/profile/' + partnerUid);
          const pSnap = await profRef.get();
          if (pSnap.exists()) batch.update(profRef, updates);
          await batch.commit();
        }
      }
      rewardLines.push('  Rank ' + cpRank + ': ' + user1Name + ' & ' + user2Name + ' | Coins: ' + coinReward.toLocaleString() + ' each' + (frameUrl && cpRank <= 3 ? ' + Frame' : ''));
    }
    cpRank++;
  }

      await sendTelegramAlert({ emoji: '🎁', title: 'DAILY LEADERBOARD REWARDS DISPATCHED (Top 10)', lines: rewardLines });
  }
}

async function distributeWeeklyRewards(db) {
  console.log('[distributeWeeklyRewards] Starting weekly reward distribution...');

  const themeSnap = await db.collection('leaderboardThemes').where('isActive', '==', true).limit(1).get();
  let activeTheme = null;
  let activeThemeId = 'default_theme';
  if (!themeSnap.empty) {
    activeTheme = themeSnap.docs[0].data();
    activeThemeId = themeSnap.docs[0].id;
  }

  function getFrameUrl(rank) {
    if (!activeTheme || !activeTheme.frameConfigs) return null;
    const config = rank === 1 ? activeTheme.frameConfigs.rank1 : rank === 2 ? activeTheme.frameConfigs.rank2 : rank === 3 ? activeTheme.frameConfigs.rank3 : null;
    if (config && config.isEnabled) return config.videoUrl || config.imageUrl || null;
    return null;
  }

  function getCoinReward(rank) {
    // Weekly = 2x Daily (Daily: 10M/3M/1M)
    if (rank >= 1 && rank <= 3) return 20000000;
    if (rank >= 4 && rank <= 7) return 6000000;
    if (rank >= 8 && rank <= 10) return 2000000;
    return 0;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  const expiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);

  const rewardLines = [];

  async function distributeToUsers(snap, categoryName, field) {
    let rank = 1;
    rewardLines.push('\n' + categoryName + ' WEEKLY WINNERS:');
    for (const doc of snap.docs) {
      const data = doc.data();
      const value = data[field] || 0;
      if (value > 0) {
        const coinReward = getCoinReward(rank);
        const frameUrl = getFrameUrl(rank);
        const username = data.username || 'User';

        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };

        if (frameUrl && rank <= 3) {
          const frameItemId = activeThemeId + '_' + categoryName.toLowerCase().replace(/[^a-z]/g,'') + '_rank' + rank + '_weekly';
          updates['inventory.activeFrame'] = frameItemId;
          updates['inventory.activeFrameMediaUrl'] = frameUrl;
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
          updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
        }

        const batch = db.batch();
        batch.update(doc.ref, updates);
        const profRef = db.doc('users/' + doc.id + '/profile/' + doc.id);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();

        rewardLines.push('  Rank ' + rank + ': ' + username + ' (ID: ' + (data.accountNumber || 'N/A') + ') | Coins: ' + coinReward.toLocaleString() + (frameUrl && rank <= 3 ? ' + Frame' : ''));
      }
      rank++;
    }
  }

  const richSnap = await db.collection('users').orderBy('wallet.weeklySpent', 'desc').limit(10).get();
  await distributeToUsers(richSnap, 'HONOR', 'wallet.weeklySpent');

  const charmSnap = await db.collection('users').orderBy('stats.weeklyGiftsReceived', 'desc').limit(10).get();
  await distributeToUsers(charmSnap, 'CHARM', 'stats.weeklyGiftsReceived');

  const roomSnap = await db.collection('chatRooms').orderBy('stats.weeklyGifts', 'desc').limit(10).get();
  let roomRank = 1;
  rewardLines.push('\nROOM RANKING WEEKLY WINNERS (Room Owners):');
  for (const doc of roomSnap.docs) {
    const roomData = doc.data();
    const weeklyGifts = roomData.stats?.weeklyGifts || 0;
    const ownerId = roomData.ownerId;
    if (weeklyGifts > 0 && ownerId) {
      const ownerRef = db.collection('users').doc(ownerId);
      const ownerSnap = await ownerRef.get();
      if (ownerSnap.exists()) {
        const ownerData = ownerSnap.data();
        const coinReward = getCoinReward(roomRank);
        const frameUrl = getFrameUrl(roomRank);
        const ownerName = ownerData.username || 'Owner';

        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
        if (frameUrl && roomRank <= 3) {
          const frameItemId = activeThemeId + '_room_rank' + roomRank + '_weekly';
          updates['inventory.activeFrame'] = frameItemId;
          updates['inventory.activeFrameMediaUrl'] = frameUrl;
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
          updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
        }

        const batch = db.batch();
        batch.update(ownerRef, updates);
        const profRef = db.doc('users/' + ownerId + '/profile/' + ownerId);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();

        rewardLines.push('  Rank ' + roomRank + ': Room Owner ' + ownerName + ' (Room ID: ' + doc.id + ') | Coins: ' + coinReward.toLocaleString() + (frameUrl && roomRank <= 3 ? ' + Frame' : ''));
      }
    }
    roomRank++;
  }

  if (rewardLines.length > 0) {

  // --- CATEGORY 4: FAMILY ---
  const familySnap = await db.collection('families').orderBy('totalWealth', 'desc').limit(10).get();
  let familyRank = 1;
  rewardLines.push('\nFAMILY RANKING WEEKLY WINNERS:');
  for (const doc of familySnap.docs) {
    const familyData = doc.data();
    const totalWealth = familyData.totalWealth || 0;
    const ownerId = familyData.ownerId;
    if (totalWealth > 0 && ownerId) {
      const ownerRef = db.collection('users').doc(ownerId);
      const ownerSnap = await ownerRef.get();
      if (ownerSnap.exists()) {
        const ownerData = ownerSnap.data();
        const coinReward = getCoinReward(familyRank);
        const frameUrl = getFrameUrl(familyRank);
        const ownerName = ownerData.username || 'Owner';
        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
        if (frameUrl && familyRank <= 3) {
          const frameItemId = activeThemeId + '_family_rank' + familyRank + '_weekly';
          updates['inventory.activeFrame'] = frameItemId;
          updates['inventory.activeFrameMediaUrl'] = frameUrl;
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
          updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
        }
        const batch = db.batch();
        batch.update(ownerRef, updates);
        const profRef = db.doc('users/' + ownerId + '/profile/' + ownerId);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();
        rewardLines.push('  Rank ' + familyRank + ': Family ' + (familyData.name || 'Unknown') + ' | Coins: ' + coinReward.toLocaleString() + (frameUrl && familyRank <= 3 ? ' + Frame' : ''));
      }
    }
    familyRank++;
  }

  // --- CATEGORY 5: CP ---
  const cpSnap = await db.collection('cpPairs').orderBy('cpValue', 'desc').limit(10).get();
  let cpRank = 1;
  rewardLines.push('\nCP RANKING WEEKLY WINNERS:');
  for (const doc of cpSnap.docs) {
    const cpData = doc.data();
    const cpValue = cpData.cpValue || 0;
    if (cpValue > 0) {
      const coinReward = getCoinReward(cpRank);
      const frameUrl = getFrameUrl(cpRank);
      const user1Name = cpData.user1Name || 'User';
      const user2Name = cpData.user2Name || 'User';
      for (const partnerUid of [cpData.user1Uid, cpData.user2Uid]) {
        if (partnerUid) {
          const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
          if (frameUrl && cpRank <= 3) {
            const frameItemId = activeThemeId + '_cp_rank' + cpRank + '_weekly';
            updates['inventory.activeFrame'] = frameItemId;
            updates['inventory.activeFrameMediaUrl'] = frameUrl;
            updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
            updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
          }
          const batch = db.batch();
          const userRef = db.collection('users').doc(partnerUid);
          batch.update(userRef, updates);
          const profRef = db.doc('users/' + partnerUid + '/profile/' + partnerUid);
          const pSnap = await profRef.get();
          if (pSnap.exists()) batch.update(profRef, updates);
          await batch.commit();
        }
      }
      rewardLines.push('  Rank ' + cpRank + ': ' + user1Name + ' & ' + user2Name + ' | Coins: ' + coinReward.toLocaleString() + ' each' + (frameUrl && cpRank <= 3 ? ' + Frame' : ''));
    }
    cpRank++;
  }

      await sendTelegramAlert({ emoji: '📅', title: 'WEEKLY LEADERBOARD REWARDS DISPATCHED (Top 10)', lines: rewardLines });
  }
}

async function distributeMonthlyRewards(db) {
  console.log('[distributeMonthlyRewards] Starting monthly reward distribution...');

  const themeSnap = await db.collection('leaderboardThemes').where('isActive', '==', true).limit(1).get();
  let activeTheme = null;
  let activeThemeId = 'default_theme';
  if (!themeSnap.empty) {
    activeTheme = themeSnap.docs[0].data();
    activeThemeId = themeSnap.docs[0].id;
  }

  function getFrameUrl(rank) {
    if (!activeTheme || !activeTheme.frameConfigs) return null;
    const config = rank === 1 ? activeTheme.frameConfigs.rank1 : rank === 2 ? activeTheme.frameConfigs.rank2 : rank === 3 ? activeTheme.frameConfigs.rank3 : null;
    if (config && config.isEnabled) return config.videoUrl || config.imageUrl || null;
    return null;
  }

  function getCoinReward(rank) {
    if (rank >= 1 && rank <= 3) return 30000000;
    if (rank >= 4 && rank <= 7) return 9000000;
    if (rank >= 8 && rank <= 10) return 3000000;
    return 0;
  }

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  const expiryTimestamp = admin.firestore.Timestamp.fromDate(expiryDate);

  const rewardLines = [];

  async function distributeToUsers(snap, categoryName, field) {
    let rank = 1;
    rewardLines.push('\n' + categoryName + ' MONTHLY WINNERS:');
    for (const doc of snap.docs) {
      const data = doc.data();
      const value = data[field] || 0;
      if (value > 0) {
        const coinReward = getCoinReward(rank);
        const frameUrl = getFrameUrl(rank);
        const username = data.username || 'User';

        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };

        if (frameUrl && rank <= 3) {
          const frameItemId = activeThemeId + '_' + categoryName.toLowerCase().replace(/[^a-z]/g,'') + '_rank' + rank + '_monthly';
          updates['inventory.activeFrame'] = frameItemId;
          updates['inventory.activeFrameMediaUrl'] = frameUrl;
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
          updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
        }

        const batch = db.batch();
        batch.update(doc.ref, updates);
        const profRef = db.doc('users/' + doc.id + '/profile/' + doc.id);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();

        rewardLines.push('  Rank ' + rank + ': ' + username + ' (ID: ' + (data.accountNumber || 'N/A') + ') | Coins: ' + coinReward.toLocaleString() + (frameUrl && rank <= 3 ? ' + Frame' : ''));
      }
      rank++;
    }
  }

  const richSnap = await db.collection('users').orderBy('wallet.monthlySpent', 'desc').limit(10).get();
  await distributeToUsers(richSnap, 'HONOR', 'wallet.monthlySpent');

  const charmSnap = await db.collection('users').orderBy('stats.monthlyGiftsReceived', 'desc').limit(10).get();
  await distributeToUsers(charmSnap, 'CHARM', 'stats.monthlyGiftsReceived');

  const roomSnap = await db.collection('chatRooms').orderBy('stats.monthlyGifts', 'desc').limit(10).get();
  let roomRank = 1;
  rewardLines.push('\nROOM RANKING MONTHLY WINNERS (Room Owners):');
  for (const doc of roomSnap.docs) {
    const roomData = doc.data();
    const monthlyGifts = roomData.stats?.monthlyGifts || 0;
    const ownerId = roomData.ownerId;
    if (monthlyGifts > 0 && ownerId) {
      const ownerRef = db.collection('users').doc(ownerId);
      const ownerSnap = await ownerRef.get();
      if (ownerSnap.exists()) {
        const ownerData = ownerSnap.data();
        const coinReward = getCoinReward(roomRank);
        const frameUrl = getFrameUrl(roomRank);
        const ownerName = ownerData.username || 'Owner';

        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
        if (frameUrl && roomRank <= 3) {
          const frameItemId = activeThemeId + '_room_rank' + roomRank + '_monthly';
          updates['inventory.activeFrame'] = frameItemId;
          updates['inventory.activeFrameMediaUrl'] = frameUrl;
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
          updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
        }

        const batch = db.batch();
        batch.update(ownerRef, updates);
        const profRef = db.doc('users/' + ownerId + '/profile/' + ownerId);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();

        rewardLines.push('  Rank ' + roomRank + ': Room Owner ' + ownerName + ' (Room ID: ' + doc.id + ') | Coins: ' + coinReward.toLocaleString() + (frameUrl && roomRank <= 3 ? ' + Frame' : ''));
      }
    }
    roomRank++;
  }

  if (rewardLines.length > 0) {

  // --- CATEGORY 4: FAMILY ---
  const familySnap = await db.collection('families').orderBy('totalWealth', 'desc').limit(10).get();
  let familyRank = 1;
  rewardLines.push('\nFAMILY RANKING MONTHLY WINNERS:');
  for (const doc of familySnap.docs) {
    const familyData = doc.data();
    const totalWealth = familyData.totalWealth || 0;
    const ownerId = familyData.ownerId;
    if (totalWealth > 0 && ownerId) {
      const ownerRef = db.collection('users').doc(ownerId);
      const ownerSnap = await ownerRef.get();
      if (ownerSnap.exists()) {
        const ownerData = ownerSnap.data();
        const coinReward = getCoinReward(familyRank);
        const frameUrl = getFrameUrl(familyRank);
        const ownerName = ownerData.username || 'Owner';
        const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
        if (frameUrl && familyRank <= 3) {
          const frameItemId = activeThemeId + '_family_rank' + familyRank + '_monthly';
          updates['inventory.activeFrame'] = frameItemId;
          updates['inventory.activeFrameMediaUrl'] = frameUrl;
          updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
          updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
        }
        const batch = db.batch();
        batch.update(ownerRef, updates);
        const profRef = db.doc('users/' + ownerId + '/profile/' + ownerId);
        const pSnap = await profRef.get();
        if (pSnap.exists()) batch.update(profRef, updates);
        await batch.commit();
        rewardLines.push('  Rank ' + familyRank + ': Family ' + (familyData.name || 'Unknown') + ' | Coins: ' + coinReward.toLocaleString() + (frameUrl && familyRank <= 3 ? ' + Frame' : ''));
      }
    }
    familyRank++;
  }

  // --- CATEGORY 5: CP ---
  const cpSnap = await db.collection('cpPairs').orderBy('cpValue', 'desc').limit(10).get();
  let cpRank = 1;
  rewardLines.push('\nCP RANKING MONTHLY WINNERS:');
  for (const doc of cpSnap.docs) {
    const cpData = doc.data();
    const cpValue = cpData.cpValue || 0;
    if (cpValue > 0) {
      const coinReward = getCoinReward(cpRank);
      const frameUrl = getFrameUrl(cpRank);
      const user1Name = cpData.user1Name || 'User';
      const user2Name = cpData.user2Name || 'User';
      for (const partnerUid of [cpData.user1Uid, cpData.user2Uid]) {
        if (partnerUid) {
          const updates = { 'wallet.coins': admin.firestore.FieldValue.increment(coinReward) };
          if (frameUrl && cpRank <= 3) {
            const frameItemId = activeThemeId + '_cp_rank' + cpRank + '_monthly';
            updates['inventory.activeFrame'] = frameItemId;
            updates['inventory.activeFrameMediaUrl'] = frameUrl;
            updates['inventory.ownedItems'] = admin.firestore.FieldValue.arrayUnion(frameItemId);
            updates['inventory.expiries.' + frameItemId] = expiryTimestamp;
          }
          const batch = db.batch();
          const userRef = db.collection('users').doc(partnerUid);
          batch.update(userRef, updates);
          const profRef = db.doc('users/' + partnerUid + '/profile/' + partnerUid);
          const pSnap = await profRef.get();
          if (pSnap.exists()) batch.update(profRef, updates);
          await batch.commit();
        }
      }
      rewardLines.push('  Rank ' + cpRank + ': ' + user1Name + ' & ' + user2Name + ' | Coins: ' + coinReward.toLocaleString() + ' each' + (frameUrl && cpRank <= 3 ? ' + Frame' : ''));
    }
    cpRank++;
  }

      await sendTelegramAlert({ emoji: '🗓️', title: 'MONTHLY LEADERBOARD REWARDS DISPATCHED (Top 10)', lines: rewardLines });
  }
}

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
      'wallet.dailyReceived': 0,
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
      'wallet.weeklyReceived': 0,
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

  const GOALS_REWARDS = [
    { level: 17, visitors: 130, roomCoins: 2600000000, hostCoins: 152200000, partnerCoins: 8230000, partners: 13 },
    { level: 16, visitors: 120, roomCoins: 1900000000, hostCoins: 100750000, partnerCoins: 7200000, partners: 12 },
    { level: 15, visitors: 110, roomCoins: 1300000000, hostCoins: 77350000, partnerCoins: 4930000, partners: 11 },
    { level: 14, visitors: 100, roomCoins: 800000000, hostCoins: 45250000, partnerCoins: 3700000, partners: 10 },
    { level: 13, visitors: 90, roomCoins: 600000000, hostCoins: 33950000, partnerCoins: 3080000, partners: 9 },
    { level: 12, visitors: 70, roomCoins: 400000000, hostCoins: 21400000, partnerCoins: 2470000, partners: 8 },
    { level: 11, visitors: 50, roomCoins: 300000000, hostCoins: 17900000, partnerCoins: 1850000, partners: 7 },
    { level: 10, visitors: 45, roomCoins: 200000000, hostCoins: 13150000, partnerCoins: 1230000, partners: 6 },
    { level: 9, visitors: 40, roomCoins: 150000000, hostCoins: 10300000, partnerCoins: 1070000, partners: 5 },
    { level: 8, visitors: 35, roomCoins: 100000000, hostCoins: 9200000, partnerCoins: 550000, partners: 5 },
    { level: 7, visitors: 30, roomCoins: 75000000, hostCoins: 7012500, partnerCoins: 506250, partners: 5 },
    { level: 6, visitors: 25, roomCoins: 50000000, hostCoins: 4750000, partnerCoins: 400000, partners: 5 },
    { level: 5, visitors: 20, roomCoins: 22500000, hostCoins: 2325000, partnerCoins: 225000, partners: 4 },
    { level: 4, visitors: 15, roomCoins: 15000000, hostCoins: 1600000, partnerCoins: 200000, partners: 3 },
    { level: 3, visitors: 10, roomCoins: 10000000, hostCoins: 1353350, partnerCoins: 135000, partners: 3 },
    { level: 2, visitors: 5, roomCoins: 5000000, hostCoins: 450000, partnerCoins: 150000, partners: 1 },
    { level: 1, visitors: 2, roomCoins: 2500000, hostCoins: 275000, partnerCoins: 75000, partners: 1 },
  ];

  const roomsSnapshot = await db.collection('chatRooms').get();
  let roomBatch = db.batch();
  let roomCount = 0;
  let roomsSaved = 0;

  for (const doc of roomsSnapshot.docs) {
    const roomData = doc.data();
    const weeklyGifts = roomData.stats?.weeklyGifts || 0;
    if (weeklyGifts > 0) {
      const currentGoal = [...GOALS_REWARDS].reverse().find(g => weeklyGifts >= g.roomCoins) || null;
      const participantsSnap = await doc.ref.collection('participants').get();
      const visitorCount = participantsSnap.size;
      roomBatch.update(doc.ref, {
        'stats.lastWeekGifts': weeklyGifts,
        'stats.lastWeekLevel': currentGoal ? currentGoal.level : 0,
        'stats.lastWeekVisitors': visitorCount,
        'stats.lastWeekRewardsDistributed': false,
        'stats.weeklyGifts': 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      roomsSaved++;
    } else {
      roomBatch.update(doc.ref, {
        'stats.weeklyGifts': 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    roomCount++;
    if (roomCount % 250 === 0) {
      await roomBatch.commit();
      roomBatch = db.batch();
    }
  }
  if (roomCount % 250 !== 0) await roomBatch.commit();

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
  console.log('[resetMonthlyCounters] Starting monthly reset with SVIP recalculation...');

  const usersSnapshot = await db.collection('users').get();
  let count = 0;
  let promoted = 0;
  let demoted = 0;
  let retained = 0;
  let batch = db.batch();
  const retentionUntil = getEndOfNextMonth();

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const rootRef = userDoc.ref;
    const profRef = db.doc(`users/${uid}/profile/${uid}`);
    const data = userDoc.data();
    const monthlySpent = data?.wallet?.monthlySpent ?? 0;
    const currentSvip = data?.svip ?? 0;

    // Calculate SVIP Points from this month's spending
    const svipPoints = Math.floor(monthlySpent / 10);
    let newSvipLevel = calculateSvipLevel(svipPoints);

    // If points don't meet current level, downgrade to highest qualifying level
    if (newSvipLevel < currentSvip) {
      newSvipLevel = newSvipLevel; // downgrade
      demoted++;
    } else if (newSvipLevel > currentSvip) {
      // Promoted during the month via autoPromoteSvip — keep new level
      promoted++;
    } else {
      retained++;
    }

    // Get Points Back for the level user will have next month
    const pointsBackCoins = getSvipPointsBack(newSvipLevel);

    const resetFields = {
      'wallet.monthlySpent': pointsBackCoins,
      'wallet.monthlyReceived': 0,
      'stats.monthlyGiftsReceived': 0,
      svip: newSvipLevel,
      svipRetainedUntil: retentionUntil,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.update(rootRef, resetFields);
    batch.update(profRef, resetFields);
    count++;

    if (count % 250 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (count % 250 !== 0) await batch.commit();

  // Reset room stats
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

  console.log(`[resetMonthlyCounters] Reset ${count} users (${promoted} promoted, ${retained} retained, ${demoted} demoted), ${roomCount} rooms`);

  await sendTelegramAlert({
    emoji: '📆',
    title: 'MONTHLY SVIP RECALCULATION',
    lines: [
      `👥 Users processed: ${count}`,
      `⬆️ Promoted: ${promoted}`,
      `✅ Retained: ${retained}`,
      `⬇️ Demoted: ${demoted}`,
      `🏠 Rooms reset: ${roomCount}`,
      `📊 Points Back applied, monthlySpent reset to refund amount`,
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

// Note: Duplicate dailyWalletReset and weeklyWalletReset schedulers have been completely removed
// to avoid conflicts with resetLeaderboardCounters.


