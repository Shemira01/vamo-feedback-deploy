// src/app/actions/summary.ts
'use server'

import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// REQUIREMENT: Use Zod for structured outputs
const AggregateReportSchema = z.object({
  headline_summary: z.string(),
  key_themes: z.array(z.string()),
  recommended_actions: z.array(z.string()),
})

export async function generateAggregateSummary(feedbacks: any[]) {
  if (!feedbacks || feedbacks.length === 0) {
    return "No data to summarize."
  }

  // Simplify data for the prompt to save tokens
  const simplifiedData = feedbacks.map(f => ({
    rating: f.rating,
    tags: f.tags,
    content: f.content
  }))

  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a Product Manager. Analyze the feedback batch. 
          Respond ONLY with a JSON object containing:
          - headline_summary: A 2-sentence overview.
          - key_themes: Array of the top 3 recurring themes.
          - recommended_actions: Array of 2 actionable steps.`
        },
        {
          role: 'user',
          content: JSON.stringify(simplifiedData)
        }
      ],
      response_format: { type: 'json_object' }
    })

    // REQUIREMENT: Use Zod and .parse
    const rawJson = JSON.parse(aiResponse.choices[0].message.content || '{}')
    const validatedReport = AggregateReportSchema.parse(rawJson)

    // Return a clean string for the UI
    return `
**Summary:** ${validatedReport.headline_summary}

**Top Themes:**
${validatedReport.key_themes.map(t => `- ${t}`).join('\n')}

**Recommendations:**
${validatedReport.recommended_actions.map(a => `- ${a}`).join('\n')}
    `.trim()

  } catch (error) {
    console.error("AI Summary generation failed:", error)
    return "The AI is currently unavailable. Please check your API quota."
  }
}