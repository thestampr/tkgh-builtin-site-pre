import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../db/prisma";
import { verifyPassword } from "./password";
import { revalidateTag } from "next/cache";

// Extend default user session/jwt types via module augmentation (add later if needed)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma), // We'll customize user model fields; minimal for now
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login"
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;
        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, role: user.role } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Future: check provider verification status if needed
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If an explicit callback URL exists, keep it
      try {
        const u = new URL(url, baseUrl);
        // Preserve external full URLs
        if (u.origin !== baseUrl) return url;
        // If logging in and we can detect provider role via query param flag
        if (u.searchParams.get("role") === "PROVIDER") {
          return baseUrl + "/account";
        }
        return u.toString();
      } catch {
        return baseUrl;
      }
    }
  },
  events: {
    async signOut({ token }) {
      revalidateTag("user");
    },
  }
};
