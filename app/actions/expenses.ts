'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { ExpenseSchema } from '../../lib/validators';
import { ExpenseCategory } from '@prisma/client';

export async function getExpenses(options?: { isOfficial?: boolean; category?: ExpenseCategory; search?: string }) {
  try {
    const where: any = {};
    
    if (options?.isOfficial !== undefined) {
      where.isOfficial = options.isOfficial;
    }
    
    if (options?.category) {
      where.category = options.category;
    }
    
    if (options?.search) {
      where.OR = [
        { vendor: { contains: options.search, mode: 'insensitive' } },
        { notes: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    
    return { success: true, data: expenses };
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return { success: false, error: error?.message || 'Failed to fetch expenses.' };
  }
}

export async function createExpense(data: any) {
  try {
    const validatedData = ExpenseSchema.parse(data);
    const expense = await prisma.expense.create({
      data: validatedData,
    });
    
    revalidatePath('/erp/expenses');
    revalidatePath('/erp'); // dashboard revalidate
    return { success: true, data: expense };
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to create expense.' };
  }
}

export async function updateExpense(id: string, data: any) {
  try {
    const validatedData = ExpenseSchema.parse(data);
    const expense = await prisma.expense.update({
      where: { id },
      data: validatedData,
    });
    
    revalidatePath('/erp/expenses');
    return { success: true, data: expense };
  } catch (error: any) {
    console.error('Error updating expense:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to update expense.' };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({
      where: { id },
    });
    revalidatePath('/erp/expenses');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return { success: false, error: error?.message || 'Failed to delete expense.' };
  }
}
