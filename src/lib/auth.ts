import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = (user.email || "").toLowerCase();
          const allowedAdmins = [
            "matrixkarunya@gmail.com",
            "bennymanuel2020@gmail.com"
          ];
          if (!email.endsWith("@karunya.edu.in") && !allowedAdmins.includes(email)) {
            throw new APIError("BAD_REQUEST", { message: "Only @karunya.edu.in emails are allowed." });
          }
          return { data: user };
        }
      }
    }
  },
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false,
      },
      rollNumber: {
        type: "string",
        required: false,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
});
