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
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 3600, // 1 hour token expiry
    sendResetPassword: async ({ user, url }) => {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(resendApiKey);
          const sender = process.env.RESEND_SENDER || "Matrix <onboarding@resend.dev>";
          
          await resend.emails.send({
            from: sender,
            to: user.email,
            subject: "Reset your Matrix Password",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;">Reset Password Request</h2>
                <p style="font-size: 14px; color: #475569; line-height: 1.5;">
                  Hi ${user.name},
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.5;">
                  We received a request to reset the password for your Matrix Event Management account. Click the button below to set a new password:
                </p>
                <div style="margin: 24px 0;">
                  <a href="${url}" style="display: inline-block; background-color: #0f766e; color: #fff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 10px 20px; border-radius: 6px;">
                    Reset Password
                  </a>
                </div>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 0;">
                  This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
                </p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Failed to send password reset email via Resend:", error);
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log("\n=========================================");
        console.log(`PASSWORD RESET REQUEST FOR: ${user.email}`);
        console.log(`Reset URL: ${url}`);
        console.log("=========================================\n");
      }
    }
  },
  session: {
    modelName: "UserSession",
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
      phoneNumber: {
        type: "string",
        required: false,
        input: true,
      },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
});
