'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { UserSchema } from '../../lib/validators';
import { Role } from '@prisma/client';

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, error: error?.message || 'Failed to fetch users.' };
  }
}

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
        createdAt: true,
      },
    });

    revalidatePath('/erp/users');
    return { success: true, data: user };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to create user.' };
  }
}
