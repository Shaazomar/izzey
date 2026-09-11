'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { z } from 'zod';

const SettingsUpdateSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyLogoUrl: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  invoicePrefix: z.string().default('INV-'),
  quotePrefix: z.string().default('Q-'),
  paymentTermsDays: z.number().int().positive().default(14),
  currency: z.string().default('EUR'),
  language: z.string().default('de'),
  emailTemplatesJson: z.string().optional().nullable(),
});

export async function getSettings() {
  try {
    let settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      // Initialize default settings if none exist
      settings = await prisma.systemSetting.create({
        data: {
          companyName: 'Izzey Clean & Move',
          vatNumber: '1130/360/50274',
          invoicePrefix: 'INV-',
          quotePrefix: 'Q-',
          paymentTermsDays: 14,
          currency: 'EUR',
          language: 'de',
        },
      });
    }
    return { success: true, data: settings };
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return { success: false, error: error?.message || 'Failed to fetch settings.' };
  }
}

export async function updateSettings(data: any) {
  try {
    const validatedData = SettingsUpdateSchema.parse(data);
    const settings = await prisma.systemSetting.findFirst();
    
    let updated;
    if (settings) {
      updated = await prisma.systemSetting.update({
        where: { id: settings.id },
        data: validatedData,
      });
    } else {
      updated = await prisma.systemSetting.create({
        data: validatedData,
      });
    }

    revalidatePath('/erp/settings');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to update settings.' };
  }
}
