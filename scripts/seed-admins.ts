import "dotenv/config";
import { adminAuth, adminDb } from "../src/lib/firebase-admin";

const admins = [
  { name: "Matrix Karunya", email: "matrixkarunya@gmail.com", password: "matrixkits" },
  { name: "Benny Manuel", email: "bennymanuel2020@gmail.com", password: "nissangtr" },
];

async function main() {
  for (const adminUser of admins) {
    try {
      let uid: string;
      try {
        const existing = await adminAuth.getUserByEmail(adminUser.email);
        uid = existing.uid;
        console.log(`User ${adminUser.email} already exists in Firebase Auth.`);
      } catch (err: any) {
        const created = await adminAuth.createUser({
          email: adminUser.email,
          password: adminUser.password,
          displayName: adminUser.name,
          emailVerified: true,
        });
        uid = created.uid;
        console.log(`Created Firebase Auth user: ${adminUser.email}`);
      }

      await adminAuth.setCustomUserClaims(uid, { role: "ADMIN" });

      await adminDb.collection("users").doc(uid).set(
        {
          id: uid,
          name: adminUser.name,
          email: adminUser.email,
          role: "ADMIN",
          emailVerified: true,
          mustChangePassword: false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log(`Promoted ${adminUser.email} to ADMIN in Firestore.`);
    } catch (e: any) {
      console.error(`Error seeding ${adminUser.email}:`, e);
    }
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
