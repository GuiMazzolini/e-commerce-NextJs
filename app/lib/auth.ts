import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/app/api/db";
import { isAdminEmail } from "@/app/lib/admin";
import { users } from "@/app/lib/db-collections";
import { checkRateLimit, RATE_LIMITS } from "@/app/lib/rate-limit";
import { normalizeEmail } from "@/app/lib/normalize-email";

/**
 * NextAuth hands `authorize` a request-like object whose headers are a plain
 * record, not a `Headers` instance — so this cannot reuse `getClientIp`.
 */
function getLoginIp(req: { headers?: Record<string, string> | unknown }): string {
  const headers = req?.headers as Record<string, string> | undefined;
  const forwarded = headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers?.["x-real-ip"];
  return typeof realIp === "string" && realIp.trim() ? realIp.trim() : "unknown";
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        // Throttle on both the source IP and the targeted account, so neither
        // spraying one password across many accounts nor guessing many
        // passwords against one account gets unlimited attempts.
        const { limit, windowSec } = RATE_LIMITS.login;
        const ip = getLoginIp(req);
        const [byIp, byEmail] = await Promise.all([
          checkRateLimit(`login:ip:${ip}`, limit, windowSec),
          checkRateLimit(`login:email:${email}`, limit, windowSec),
        ]);
        if (!byIp.ok || !byEmail.ok) {
          return null;
        }

        const { db } = await connectToDB();
        const user = await users(db).findOne({ email });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Sessions are JWTs and there is no database adapter, so an OAuth sign-in
     * would otherwise never produce a users record — leaving account settings
     * with nothing to read or write. Upsert one on the way in.
     */
    async signIn({ user, account }) {
      const email = user?.email ? normalizeEmail(user.email) : null;
      if (!email) return false;

      // The credentials provider already has its record.
      if (account?.provider && account.provider !== "credentials") {
        const { db } = await connectToDB();
        await users(db).updateOne(
          { email },
          {
            $set: { updatedAt: new Date() },
            $setOnInsert: {
              email,
              name: user.name ?? email.split("@")[0],
              provider: account.provider,
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
      return true;
    },

    async jwt({ token, trigger, session }) {
      token.isAdmin = isAdminEmail(token.email as string | undefined);

      // useSession().update() after a profile edit, so the navbar and menu
      // reflect the new name without forcing a sign-out.
      if (trigger === "update" && typeof session?.name === "string") {
        token.name = session.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = !!token.isAdmin;
        if (typeof token.name === "string") {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
