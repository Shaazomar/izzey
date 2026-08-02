'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { EnquiryStatus } from '@prisma/client';

export async function getEnquiries(query?: string) {
  try {
    const enquiries = await prisma.enquiry.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
              { address: { contains: query, mode: 'insensitive' } },
              { service: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: enquiries };
  } catch (error: any) {
    console.error('Error fetching enquiries:', error);
    return { success: false, error: error?.message || 'Failed to fetch enquiries.' };
  }
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus) {
  try {
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { status },
    });
    revalidatePath('/erp/enquiries');
    return { success: true, data: enquiry };
  } catch (error: any) {
    console.error('Error updating enquiry status:', error);
    return { success: false, error: error?.message || 'Failed to update enquiry status.' };
  }
}

export async function updateEnquiryNotes(id: string, notes: string) {
  try {
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: { notes },
    });
    revalidatePath('/erp/enquiries');
    return { success: true, data: enquiry };
  } catch (error: any) {
    console.error('Error updating enquiry notes:', error);
    return { success: false, error: error?.message || 'Failed to update enquiry notes.' };
  }
}

export async function deleteEnquiry(id: string) {
  try {
    await prisma.enquiry.delete({
      where: { id },
    });
    revalidatePath('/erp/enquiries');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting enquiry:', error);
    return { success: false, error: error?.message || 'Failed to delete enquiry.' };
  }
}

export async function convertToCustomer(id: string) {
  try {
    // 1. Fetch enquiry
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      return { success: false, error: 'Enquiry not found.' };
    }

    // 2. Check if customer with this email already exists
    let customer = await prisma.customer.findUnique({
      where: { email: enquiry.email.toLowerCase() },
    });

    if (!customer) {
      // 3. Create customer
      customer = await prisma.customer.create({
        data: {
          name: enquiry.name,
          email: enquiry.email.toLowerCase(),
          phone: enquiry.phone,
          address: enquiry.address,
          city: 'Berlin', // Default fallback city
          country: 'Germany',
          notes: `Converted from booking enquiry. Desired service: ${enquiry.service}. Details: ${enquiry.notes || ''}`,
        },
      });
    }

    // 4. Create property for this customer using the enquiry address
    await prisma.property.create({
      data: {
        customerId: customer.id,
        address: enquiry.address,
        city: 'Berlin',
        postalCode: '10115', // Default postal code
        country: 'Germany',
        notes: `Registered during enquiry conversion. Preferred booking: ${enquiry.date} at ${enquiry.time}`,
      },
    });

    // 5. Update enquiry status to CONVERTED
    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: { status: EnquiryStatus.CONVERTED },
    });

    revalidatePath('/erp/enquiries');
    revalidatePath('/erp/customers');
    
    return { success: true, data: { customer, enquiry: updatedEnquiry } };
  } catch (error: any) {
    console.error('Error converting enquiry to customer:', error);
    return { success: false, error: error?.message || 'Failed to convert enquiry to customer.' };
  }
}
