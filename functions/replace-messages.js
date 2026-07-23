const fs = require('fs');
const path = 'd:/Ummy_Dev_Live/ummy-native/src/app/(tabs)/messages.tsx';

let content = fs.readFileSync(path, 'utf8');

const targetStr = `      batch.update(senderUserRef, {
        'wallet.coins': increment(-totalCost + levelUpCoins),
        'wallet.totalSpent': increment(totalCost),
        'wallet.dailySpent': increment(totalCost),
        'wallet.weeklySpent': increment(totalCost),
        'wallet.monthlySpent': increment(totalCost),
      });`;

const replacementStr = `      batch.update(senderUserRef, {
        'wallet.coins': increment(-totalCost + levelUpCoins),
        'wallet.totalSpent': increment(totalCost),
        'wallet.dailySpent': increment(totalCost),
        'wallet.weeklySpent': increment(totalCost),
        'wallet.monthlySpent': increment(totalCost),
      });

      if (myProfile?.familyId) {
        const familyRef = doc(firestore, 'families', myProfile.familyId);
        try {
          const familySnap = await getDoc(familyRef);
          if (familySnap.exists()) {
            const currentWealth = familySnap.data()?.totalWealth || 0;
            const newWealth = currentWealth + totalCost;
            const newFamilyLevel = getFamilyLevel(newWealth);
            batch.update(familyRef, {
              totalWealth: increment(totalCost),
              [\`contributions.\${user.uid}\`]: increment(totalCost),
              level: newFamilyLevel,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.log('[Family Chat Gift Update Error]', err);
        }
      }`;

// Normalize line endings for reliable matching
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetStr.replace(/\r\n/g, '\n');
const normalizedReplacement = replacementStr.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const updatedContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(path, updatedContent, 'utf8');
  console.log('SUCCESS: messages.tsx updated successfully!');
} else {
  console.log('ERROR: Target string not found in messages.tsx');
}
