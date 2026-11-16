import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().or(z.literal("")),
  clientId: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
