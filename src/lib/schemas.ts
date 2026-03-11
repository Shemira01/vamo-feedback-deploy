import { z } from 'zod'

// Validates the AI's response to ensure it matches our database structure
export const FeedbackAnalysisSchema = z.object({
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']),
  summary: z.string().min(5),
  tags: z.array(z.string()),
  ocr_content: z.string().nullable().optional(),
})

export type FeedbackAnalysis = z.infer<typeof FeedbackAnalysisSchema>