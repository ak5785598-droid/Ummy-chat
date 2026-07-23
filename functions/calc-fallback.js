function getFallback(userId) {
  let hash = 0;
  const str = userId || 'fallback';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash % 900000) + 100000).toString();
}

console.log("Fallback ID for 4duuhA1dtba2iIVKJec3UXtSP1y1:", getFallback("4duuhA1dtba2iIVKJec3UXtSP1y1"));
