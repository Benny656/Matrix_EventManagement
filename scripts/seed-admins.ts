import "dotenv/config";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/db";

const admins = [
  { name: "Matrix Karunya", email: "matrixkarunya@gmail.com", password: "matrixkits" },
  { name: "Benny Manuel", email: "bennymanuel2020@gmail.com", password: "nissangtr" },
];

async function main() {
  for (const admin of admins) {
    try {
      try {
        // Creates the user + Better Auth account/session tables correctly
        // (proper password hashing etc.) — do not insert into these tables by hand.
        await auth.api.signUpEmail({
          body: {
            name: admin.name,
            email: admin.email,
            password: admin.password,
          },
        });
        console.log(`Created auth account for ${admin.email}`);
      } catch (signUpError: any) {
        const errCode = signUpError.body?.code || "";
        const errMsg = signUpError.message || "";
        if (errCode === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" || errMsg.includes("already exists")) {
          console.log(`User ${admin.email} already exists. Continuing to role update...`);
        } else {
          throw signUpError;
        }
      }

      // Promote to Admin role
      await prisma.user.update({
        where: { email: admin.email },
        data: { role: "ADMIN" },
      });

      console.log(`Promoted ${admin.email} to ADMIN`);
    } catch (e: any) {
      console.error(`Error processing ${admin.email}:`, e);
    }
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
