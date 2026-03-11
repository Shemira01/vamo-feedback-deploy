// src/app/actions/summary.ts
'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAggregateSummary(feedbacks: any[]) {
  if (!feedbacks || feedbacks.length === 0) {
    return "No data to summarize."
  }

  // Strip down the data to save tokens and only pass what the AI needs
  const simplifiedData = feedbacks.map(f => ({
    source: f.source,
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
          content: `You are a brilliant Product Manager analyzing a batch of customer feedback. 
          
          YOUR GOAL: Provide a macro-summary of the provided feedback.
          
          RULES:
          1. Do not just list the feedback. Find the common themes.
          2. Give MORE WEIGHT to issues or sentiments that are mentioned multiple times (e.g., "3 users complained about...").
          3. Keep it actionable and concise.
          4. Use plain text formatting with dashes (-) for bullet points. Do not use complex markdown.`
        },
        {
          role: 'user',
          content: JSON.stringify(simplifiedData)
        }
      ]
    })

    return aiResponse.choices[0].message.content
  } catch (error) {
    console.error("AI Summary generation failed:", error)
    return "The AI is currently unavailable (Check your OpenAI API quota). But when it is online, your report will appear right here!"
  }
}