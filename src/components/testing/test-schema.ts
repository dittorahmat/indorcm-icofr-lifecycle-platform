import { z } from 'zod';

export const testSampleSchema = z.object({
  id: z.string().optional(),
  sampleRef: z.string().min(1, 'Sample reference is required'),
  attrA: z.boolean().default(true),
  attrB: z.boolean().default(true),
  attrC: z.boolean().default(true),
  attrD: z.boolean().default(true),
  status: z.enum(['Pass', 'Fail']).default('Pass'),
  comments: z.string().optional(),
});

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
  
  // Lampiran 8: 6-Pilar TOD
  todPilarObjective: z.boolean().default(true),
  todPilarTiming: z.boolean().default(true),
  todPilarAuthority: z.boolean().default(true),
  todPilarReliability: z.boolean().default(true),
  todPilarCoverage: z.boolean().default(true),
  todPilarEvidence: z.boolean().default(true),
  todPilarComments: z.record(z.string(), z.string()).optional(),

  // Lampiran 7: Sampling
  samples: z.array(testSampleSchema).default([]),
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
  
  // Zero Tolerance enforcement: if any sample is Fail, result must be Ineffective
  if (data.testType === 'TOE' && data.samples.length > 0) {
    const hasFail = data.samples.some(s => s.status === 'Fail');
    if (hasFail && data.result === 'Effective') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Overall result must be Ineffective if any sample fails (Zero Tolerance)",
            path: ["result"],
        });
    }
  }
});

export type TestFormValues = z.infer<typeof testSchema>;
export type TestSampleValues = z.infer<typeof testSampleSchema>;
