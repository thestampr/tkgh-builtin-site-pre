import NextAuth, { DefaultUser, DefaultSession } from "next-auth";

/**
 * model User {
  id              String            @id @default(cuid())
  email           String            @unique
  passwordHash    String
  role            String            @default("PUBLIC")
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  analytics       AnalyticsEvent[]  @relation("UserAnalytics")
  builtIns        BuiltIn[]         @relation("ProviderBuiltIns")
  categories      Category[]
  favorites       FavoriteBuiltIn[]
  formSubmissions FormSubmission[]
  profile         Profile?
}
 * 
 */

declare module "next-auth" {
    interface User extends DefaultUser {
        id: string;
        email: string;
        role: 'PUBLIC' | 'USER' | 'PROVIDER' | 'ADMIN';
        avatarUrl?: string | null;
        profile?: {
            avatarUrl?: string | null;
        } | null;
    }

    interface Session extends DefaultSession {
        user: User;
    }
}