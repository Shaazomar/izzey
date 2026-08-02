'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { CustomerSchema, PropertySchema } from '../../lib/validators';

export async function getCustomers(query?: string) {
  try {
    const customers = await prisma.customer.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { companyName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        properties: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            properties: true,
            quotations: true,
            invoices: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: customers };
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return { success: false, error: error?.message || 'Failed to fetch customers.' };
  }
}

export async function getCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        properties: { orderBy: { createdAt: 'desc' } },
        quotations: { orderBy: { createdAt: 'desc' } },
        invoices: { 
          orderBy: { createdAt: 'desc' },
          include: { payments: true }
        },
      },
    });

    if (!customer) {
      return { success: false, error: 'Customer not found.' };
    }

    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return { success: false, error: error?.message || 'Failed to fetch customer.' };
  }
}

export async function createCustomer(data: any) {
  try {
    const { properties, ...customerData } = data;
    const validatedData = CustomerSchema.parse(customerData);
    
    // Check if email already exists
    const existing = await prisma.customer.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    });
    if (existing) {
      return { success: false, error: 'A customer with this email already exists.' };
    }

    const customer = await prisma.customer.create({
      data: {
        ...validatedData,
        email: validatedData.email.toLowerCase(),
        properties: properties && properties.length > 0 ? {
          create: properties.map((p: any) => ({
            address: p.address,
            city: p.city,
            postalCode: p.postalCode,
            country: p.country || 'Germany',
          }))
        } : undefined
      },
      include: {
        properties: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    revalidatePath('/erp/customers');
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to create customer.' };
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    const validatedData = CustomerSchema.parse(data);
    
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email.toLowerCase(),
      },
    });

    revalidatePath(`/erp/customers`);
    revalidatePath(`/erp/customers/${id}`);
    return { success: true, data: customer };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to update customer.' };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id },
    });
    revalidatePath('/erp/customers');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return { success: false, error: error?.message || 'Failed to delete customer.' };
  }
}

export async function addProperty(data: any) {
  try {
    const validatedData = PropertySchema.parse(data);
    const property = await prisma.property.create({
      data: validatedData,
    });
    revalidatePath(`/erp/customers/${validatedData.customerId}`);
    return { success: true, data: property };
  } catch (error: any) {
    console.error('Error adding property:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to add property.' };
  }
}

export async function deleteProperty(propertyId: string, customerId: string) {
  try {
    await prisma.property.delete({
      where: { id: propertyId },
    });
    revalidatePath(`/erp/customers/${customerId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting property:', error);
    return { success: false, error: error?.message || 'Failed to delete property.' };
  }
}
