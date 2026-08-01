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
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          throw new Error('Passcode is required.');
        }

        if (credentials.password !== 'izzey@de') {
          throw new Error('Invalid passcode provided.');
        }

        return {
          id: 'izzey-admin-id',
          name: 'Izzey Admin',
          email: 'info@izzey.de',
          role: 'SUPER_ADMIN'
        };
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
