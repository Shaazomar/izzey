import { z } from 'zod';

export const wohnungsgeberSchema = z.object({
  wohnungsgeber: z.object({
    name: z.string().trim().min(1, 'Wohnungsgeber name is required'),
    street: z.string().trim().min(1, 'Wohnungsgeber street is required'),
    zip: z.string().trim().min(1, 'Wohnungsgeber PLZ is required'),
    city: z.string().trim().min(1, 'Wohnungsgeber city is required'),
  }),
  owner: z.object({ name: z.string().optional() }).optional(),
  moveInDate: z.string().min(1, 'Einzugsdatum is required'),
  property: z.object({
    street: z.string().trim().min(1, 'Wohnung street is required'),
    additionalInfo: z.string().optional(),
    zip: z.string().trim().min(1, 'Wohnung PLZ is required'),
    city: z.string().trim().min(1, 'Wohnung city is required'),
  }),
  persons: z
    .array(
      z.object({
        lastName: z.string().trim().min(1, 'Familienname is required'),
        firstName: z.string().trim().min(1, 'Vorname is required'),
      })
    )
    .min(1, 'At least one person must be entered'),
  issueDate: z.string().min(1, 'Datum is required'),
  issuePlace: z.string().optional(),
});

export type WohnungsgeberInput = z.infer<typeof wohnungsgeberSchema>;
