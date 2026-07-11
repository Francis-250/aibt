import "./node-network";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, emailOTP, phoneNumber, twoFactor, username } from "better-auth/plugins";
import prisma from "./prisma";
import { ac, admin, governmentOfficial, healthOfficer } from "./permission";
import { sendEmail, sendEmailOrThrow } from "./brevo";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  appName: "TyphoidWatch Rwanda",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendEmail({ to: user.email, subject: "Reset your TyphoidWatch password", html: `<p>Use this secure link to reset your password:</p><p><a href="${url}">Reset password</a></p>` });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    adminPlugin({ defaultRole: "health_officer", ac, roles: { admin, health_officer: healthOfficer, government_official: governmentOfficial } }),
    phoneNumber(), username(), twoFactor(),
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      resendStrategy: "rotate",
      async sendVerificationOTP({ email, otp, type }) {
        const purpose = type === "email-verification" ? "verify your email" : "sign in";
        await sendEmailOrThrow({
          to: email,
          subject: `${otp} is your TyphoidWatch code`,
          text: `Use ${otp} to ${purpose}. It expires in 10 minutes.`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px"><h2>TyphoidWatch Rwanda</h2><p>Use this code to ${purpose}:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires in 10 minutes.</p></div>`,
        });
      },
    }),
    nextCookies(),
  ],
});
