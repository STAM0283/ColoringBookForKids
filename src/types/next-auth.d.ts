import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "ADMIN";
      invalid?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN";
    invalid?: boolean;
    sessionStartedAt?: number;
  }
}
