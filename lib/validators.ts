import { z } from "zod";

export const authSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100)
});

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(20).max(1000)
});
