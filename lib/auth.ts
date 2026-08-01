import { NextAuthOptions, DefaultSession, DefaultUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

// Type definitions to extend NextAuth Session, User, and JWT structures
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: Role;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          throw new Error('Password or passcode is required.');
        }

        // 1. Passcode-only fallback logic (legacy support)
        if (credentials.password === 'izzey@de') {
          return {
            id: 'izzey-admin-id',
            name: 'Izzey Admin',
            email: credentials.email || 'info@izzey.de',
            role: 'SUPER_ADMIN'
          };
        }

        // 2. Database user credentials logic
        if (credentials.email) {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (user && bcrypt.compareSync(credentials.password, user.password)) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }

        throw new Error('Invalid credentials provided.');
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/erp/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day session duration
  },
  secret: process.env.NEXTAUTH_SECRET || 'izzey-erp-development-super-secret-key',
};
