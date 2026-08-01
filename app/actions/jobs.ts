'use server';

import { revalidatePath } from 'next/cache';
import prisma from '../../lib/prisma';
import { JobSchema, ManagementCostSchema } from '../../lib/validators';
import { JobStatus, JobImageType, Role } from '@prisma/client';

export async function getJobs(status?: JobStatus) {
  try {
    const jobs = await prisma.job.findMany({
      where: status ? { status } : undefined,
      include: {
        quotation: {
          include: {
            customer: true,
            property: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        images: true,
        managementCost: true,
      },
      orderBy: { startDate: 'asc' },
    });
    return { success: true, data: jobs };
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return { success: false, error: error?.message || 'Failed to fetch jobs.' };
  }
}

export async function createJob(data: any) {
  try {
    const validatedData = JobSchema.parse(data);
    
    const job = await prisma.$transaction(async (tx) => {
      const createdJob = await tx.job.create({
        data: {
          quotationId: validatedData.quotationId,
          invoiceId: validatedData.invoiceId,
          status: validatedData.status,
          startDate: validatedData.startDate,
          completionDate: validatedData.completionDate,
          notes: validatedData.notes,
        },
      });

      if (validatedData.employeeIds.length > 0) {
        await tx.jobAssignment.createMany({
          data: validatedData.employeeIds.map((empId) => ({
            jobId: createdJob.id,
            employeeId: empId,
          })),
        });
      }

      // Initialize empty management costs
      await tx.managementJobCost.create({
        data: {
          jobId: createdJob.id,
          realLabourCost: 0,
          bonuses: 0,
          commission: 0,
          materialCost: 0,
          hiddenCosts: 0,
        },
      });

      return createdJob;
    });

    revalidatePath('/erp/jobs');
    return { success: true, data: job };
  } catch (error: any) {
    console.error('Error creating job:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to create job.' };
  }
}

export async function updateJobStatus(id: string, status: JobStatus) {
  try {
    const completionDate = status === JobStatus.COMPLETED ? new Date() : null;
    const job = await prisma.job.update({
      where: { id },
      data: { 
        status,
        completionDate
      },
    });
    revalidatePath('/erp/jobs');
    revalidatePath(`/erp/jobs/${id}`);
    return { success: true, data: job };
  } catch (error: any) {
    console.error('Error updating job status:', error);
    return { success: false, error: error?.message || 'Failed to update job status.' };
  }
}

export async function updateJobAssignments(jobId: string, employeeIds: string[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // Clear current assignments
      await tx.jobAssignment.deleteMany({
        where: { jobId },
      });

      // Insert new ones
      if (employeeIds.length > 0) {
        await tx.jobAssignment.createMany({
          data: employeeIds.map((empId) => ({
            jobId,
            employeeId: empId,
          })),
        });
      }
    });

    revalidatePath('/erp/jobs');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating job assignments:', error);
    return { success: false, error: error?.message || 'Failed to update assignments.' };
  }
}

export async function uploadJobImage(jobId: string, url: string, type: JobImageType) {
  try {
    const img = await prisma.jobImage.create({
      data: {
        jobId,
        url,
        type,
      },
    });
    revalidatePath('/erp/jobs');
    return { success: true, data: img };
  } catch (error: any) {
    console.error('Error saving job image:', error);
    return { success: false, error: error?.message || 'Failed to upload job image.' };
  }
}

export async function saveManagementCosts(data: any) {
  try {
    const validatedData = ManagementCostSchema.parse(data);
    const cost = await prisma.managementJobCost.upsert({
      where: { jobId: validatedData.jobId },
      update: {
        realLabourCost: validatedData.realLabourCost,
        bonuses: validatedData.bonuses,
        commission: validatedData.commission,
        materialCost: validatedData.materialCost,
        hiddenCosts: validatedData.hiddenCosts,
        notes: validatedData.notes,
      },
      create: validatedData,
    });
    
    revalidatePath('/erp/jobs');
    revalidatePath('/erp'); // dashboard revalidate
    return { success: true, data: cost };
  } catch (error: any) {
    console.error('Error saving management costs:', error);
    return { success: false, error: error?.errors?.[0]?.message || error?.message || 'Failed to save management costs.' };
  }
}

export async function getEmployees() {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.EMPLOYEE, Role.ADMIN, Role.SUPER_ADMIN],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: employees };
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return { success: false, error: error?.message || 'Failed to fetch employees.' };
  }
}
