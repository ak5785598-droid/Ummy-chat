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
  owl: {
    frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_owl_frame.png?alt=media',
    bubble: 'svip-owl-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_owl_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_owl_entrance.png?alt=media',
    wave: 'svip-owl-wave',
  },
  wolf: {
    frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_wolf_frame.png?alt=media',
    bubble: 'svip-wolf-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_wolf_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_wolf_entrance.png?alt=media',
    wave: 'svip-wolf-wave',
  },
  scorpion: {
    frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_scorpion_frame.png?alt=media',
    bubble: 'svip-scorpion-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_scorpion_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_scorpion_entrance.png?alt=media',
    wave: 'svip-scorpion-wave',
  },
  lion: {
    frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_lion_frame.png?alt=media',
    bubble: 'svip-lion-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_lion_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_lion_entrance.png?alt=media',
    wave: 'svip-lion-wave',
  },
  tiger: {
    frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_tiger_frame.png?alt=media',
    bubble: 'svip-tiger-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_tiger_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_tiger_entrance.png?alt=media',
    wave: 'svip-tiger-wave',
  },
  dragon: {
    frame: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fframe%2Fsvip_dragon_frame.png?alt=media',
    bubble: 'svip-dragon-bubble',
    bubbleUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fbubble%2Fsvip_dragon_bubble.png?alt=media',
    entrance: 'slide',
    entranceUrl: 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/svip-privileges%2Fentrance%2Fsvip_dragon_entrance.png?alt=media',
    wave: 'svip-dragon-wave',
  },
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
    const privileges = SVIP_PRIVILEGES[theme];

    const svipPrivileges = {
      level: svip,
      theme: theme,
      frameUrl: privileges.frame,
      bubbleId: privileges.bubble,
      bubbleUrl: privileges.bubbleUrl,
      entranceType: privileges.entrance,
      entranceUrl: privileges.entranceUrl,
      waveId: privileges.wave,
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
