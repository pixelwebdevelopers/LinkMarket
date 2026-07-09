import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
}

export class UnverifiedEmailError extends CredentialsSignin {
  code = "unverified_email";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;
        if (user.isDisabled) return null;

        // Block unverified accounts
        if (!user.emailVerified) {
          throw new UnverifiedEmailError();
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          const updatedAttempts = (user as unknown as { loginAttempts: number }).loginAttempts + 1;
          if (updatedAttempts >= 3) {
            // Lock account (require email verification)
            await db.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: 0, // reset so they get fresh attempts after verifying
                emailVerified: null, // this locks/unverifies them
              },
            });
            // Send verification email
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const { sendVerificationEmail } = await import("@/lib/verification");
            try {
              await sendVerificationEmail(user, appUrl);
            } catch (err) {
              console.error("[auth] failed to send lockout verification email", err);
            }

            throw new TooManyAttemptsError();
          } else {
            await db.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: updatedAttempts,
              },
            });
          }
          return null;
        }

        // Reset login attempts on successful login
        if ((user as unknown as { loginAttempts: number }).loginAttempts > 0) {
          await db.user.update({
            where: { id: user.id },
            data: { loginAttempts: 0 },
          });
        }

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
