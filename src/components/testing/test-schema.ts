import { z } from 'zod';

export const testSchema = z.object({
  testType: z.enum(['TOD', 'TOE']),
  method: z.enum(["Inquiry", "Observation", "Inspection", "Reperformance"]),
  result: z.enum(['Effective', 'Ineffective']),
  comments: z.string().min(1, 'Comments are required'),
  sampleSize: z.number().optional(),
  homogeneityJustification: z.string().optional(),
  evaluationAttributes: z.object({
    objectiveAchieved: z.boolean(),
    timingAccuracy: z.boolean(),
    authorityCompetence: z.boolean(),
    infoReliability: z.boolean(),
    periodCoverage: z.boolean(),
    evidenceAvailability: z.boolean(),
  }),
}).superRefine((data, ctx) => {
  if (data.testType === 'TOE') {
    if (data.sampleSize === undefined || data.sampleSize === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sample size is required for TOE",
        path: ["sampleSize"],
      });
    }
  }
});

export type TestFormValues = z.infer<typeof testSchema>;
