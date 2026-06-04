import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "../src/firebase/config";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  try {
    const levelsSnap = await getDocs(collection(db, "levels"));
    console.log("TOTAL LEVELS IN DB:", levelsSnap.size);
    levelsSnap.docs.forEach(doc => {
      console.log(`Document ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log("----------------------------");
    });
  } catch (err: any) {
    console.error("ERROR FETCHING LEVELS:", err.message);
  }
}

main();
