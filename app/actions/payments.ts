'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export async function getPayments() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
    return { success: true, data: payments };
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return { success: false, error: error?.message || 'Failed to fetch payments.' };
  }
}
