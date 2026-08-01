'use server';

import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { UserSchema } from '../../lib/validators';
import { Role } from '@prisma/client';

export async function createUser(data: any) {
  try {
    const validatedData = UserSchema.parse(data);
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const existing = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existing) {
      return { success: false, error: 'User with this email already exists.' };
    }

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        role: validatedData.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return { success: true, data: user };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to create user.' };
  }
}
