import { z } from "zod";

export const interviewFormSchema = z.object({
	role: z.string().optional(),
	level: z.enum(["junior", "mid", "senior"]).optional(),
	type: z.enum(["technical", "behavioral", "mixed"]).optional(),
	techstack: z.array(z.string()).max(5).optional(),
	specialization: z.string().optional(),
  });
  