import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client/scripts/default-index.js";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { revalidateTag } from "next/cache";
import prisma from "../db/prisma";
import { verifyPassword } from "./password";

const prismaAdapter = PrismaAdapter(prisma as PrismaClient);

// Extend adapter methods to include profile relation
// Note: set strategy: "jwt" in session options to avoid session table usage

// @ts-ignore
prismaAdapter.getUser = async (id: string) => {
  return await prisma.user.findUnique({ 
    where: { id },
    include: { profile: true }
  });
};

// @ts-ignore
prismaAdapter.getSessionAndUser = async (sessionToken: string) => {
  const sessionAndUser = await prisma.session.findUnique({
    where: { sessionToken },
    include: { 
      user: { 
        include: { 
          profile: true 
        } 
      } 
    }
  });
  return sessionAndUser;
};

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
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
      // @ts-ignore
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email }
        });
        if (!user) return null;
        
        const ok = await verifyPassword(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { 
          id: user.id, 
          email: user.email, 
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as typeof session.user.role;
      }
      // get profile 
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { 
          id: true, 
          displayName: true, 
          coverImage: true, 
          avatarUrl: true 
        }
      });
      if (profile) {
        session.user.profile = profile;
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
