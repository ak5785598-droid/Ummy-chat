/**
 * Backfill svipPrivileges for existing SVIP users.
 * Run: node backfill-svip-privileges.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app',
});

const db = admin.firestore();

const SVIP_PRIVILEGES = {
  1:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_1_frame.png?alt=media',  bubble: 'svip-owl-bubble',     bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_owl_bubble.png?alt=media',     entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_owl_entrance.png?alt=media',       wave: 'svip-owl-wave' },
  2:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_2_frame.png?alt=media',  bubble: 'svip-owl-bubble',     bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_owl_bubble.png?alt=media',     entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_owl_entrance.png?alt=media',       wave: 'svip-owl-wave' },
  3:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_3_frame.png?alt=media',  bubble: 'svip-owl-bubble',     bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_owl_bubble.png?alt=media',     entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_owl_entrance.png?alt=media',       wave: 'svip-owl-wave' },
  4:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_4_frame.png?alt=media',  bubble: 'svip-wolf-bubble',    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_wolf_bubble.png?alt=media',    entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_wolf_entrance.png?alt=media',      wave: 'svip-wolf-wave' },
  5:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_5_frame.png?alt=media',  bubble: 'svip-wolf-bubble',    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_wolf_bubble.png?alt=media',    entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_wolf_entrance.png?alt=media',      wave: 'svip-wolf-wave' },
  6:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_6_frame.png?alt=media',  bubble: 'svip-wolf-bubble',    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_wolf_bubble.png?alt=media',    entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_wolf_entrance.png?alt=media',      wave: 'svip-wolf-wave' },
  7:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_7_frame.png?alt=media',  bubble: 'svip-scorpion-bubble', bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_scorpion_bubble.png?alt=media', entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_scorpion_entrance.png?alt=media', wave: 'svip-scorpion-wave' },
  8:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_8_frame.png?alt=media',  bubble: 'svip-scorpion-bubble', bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_scorpion_bubble.png?alt=media', entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_scorpion_entrance.png?alt=media', wave: 'svip-scorpion-wave' },
  9:  { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_9_frame.png?alt=media',  bubble: 'svip-scorpion-bubble', bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_scorpion_bubble.png?alt=media', entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_scorpion_entrance.png?alt=media', wave: 'svip-scorpion-wave' },
  10: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_10_frame.png?alt=media', bubble: 'svip-lion-bubble',     bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_lion_bubble.png?alt=media',     entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_lion_entrance.png?alt=media',       wave: 'svip-lion-wave' },
  11: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_11_frame.png?alt=media', bubble: 'svip-lion-bubble',     bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_lion_bubble.png?alt=media',     entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_lion_entrance.png?alt=media',       wave: 'svip-lion-wave' },
  12: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_12_frame.png?alt=media', bubble: 'svip-lion-bubble',     bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_lion_bubble.png?alt=media',     entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_lion_entrance.png?alt=media',       wave: 'svip-lion-wave' },
  13: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_13_frame.png?alt=media', bubble: 'svip-tiger-bubble',    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_tiger_bubble.png?alt=media',    entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_tiger_entrance.png?alt=media',      wave: 'svip-tiger-wave' },
  14: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_14_frame.png?alt=media', bubble: 'svip-tiger-bubble',    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_tiger_bubble.png?alt=media',    entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_tiger_entrance.png?alt=media',      wave: 'svip-tiger-wave' },
  15: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_15_frame.png?alt=media', bubble: 'svip-tiger-bubble',    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_tiger_bubble.png?alt=media',    entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_tiger_entrance.png?alt=media',      wave: 'svip-tiger-wave' },
  16: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_16_frame.png?alt=media', bubble: 'svip-dragon-bubble',   bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_dragon_bubble.png?alt=media',   entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_dragon_entrance.png?alt=media', wave: 'svip-dragon-wave' },
  17: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_17_frame.png?alt=media', bubble: 'svip-dragon-bubble',   bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_dragon_bubble.png?alt=media',   entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_dragon_entrance.png?alt=media', wave: 'svip-dragon-wave' },
  18: { frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_level_18_frame.png?alt=media', bubble: 'svip-dragon-bubble',   bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_dragon_bubble.png?alt=media',   entrance: 'slide', entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_dragon_entrance.png?alt=media', wave: 'svip-dragon-wave' },
};

function getSvipTheme(level) {
  if (level >= 16) return 'dragon';
  if (level >= 13) return 'tiger';
  if (level >= 10) return 'lion';
  if (level >= 7)  return 'scorpion';
  if (level >= 4)  return 'wolf';
  return 'owl';
}

async function main() {
  console.log('🚀 Backfilling svipPrivileges for existing SVIP users...\n');

  // Get all users from root collection
  const usersSnapshot = await db.collection('users').get();
  console.log(`Found ${usersSnapshot.size} total users\n`);

  let updated = 0;
  let skipped = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const svip = userData.svip || 0;
    const userId = userDoc.id;

    if (svip <= 0) {
      skipped++;
      continue;
    }

    const theme = getSvipTheme(svip);
    const levelPrivileges = SVIP_PRIVILEGES[svip];
    const themePrivileges = SVIP_PRIVILEGES[svip]; // frame is per-level, bubble/entrance/wave still theme-based

    const svipPrivileges = {
      level: svip,
      theme: theme,
      frameUrl: levelPrivileges.frame,
      bubbleId: themePrivileges.bubble,
      bubbleUrl: themePrivileges.bubbleUrl,
      entranceType: themePrivileges.entrance,
      entranceUrl: themePrivileges.entranceUrl,
      waveId: themePrivileges.wave,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Update root doc
    await userDoc.ref.update({ svipPrivileges });

    // Also update profile doc if it exists
    const profileRef = db.doc(`users/${userId}/profile/${userId}`);
    const profileSnap = await profileRef.get();
    if (profileSnap.exists) {
      await profileRef.update({ svipPrivileges });
    }

    console.log(`✅ ${userId}: SVIP ${svip} → ${theme} privileges assigned`);
    updated++;
  }

  console.log(`\n📊 Done! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
