import type { VendorId } from '@/utils/vendors';

export interface ApiKey {
  id: string;
  name: string;
  vendor: VendorId;
  createdAt: string;
  usageCount?: number;
}

// Optional: Define a Zod schema if needed for validation elsewhere
// import { z } from 'zod';
// import { vendorIds } from '@/utils/vendors';

// export const ApiKeySchema = z.object({
//   id: z.string().uuid(),
//   name: z.string().min(1).max(100),
//   vendor: z.enum(vendorIds),
//   createdAt: z.string().datetime(),
//   usageCount: z.number().int().optional(),
// }); 