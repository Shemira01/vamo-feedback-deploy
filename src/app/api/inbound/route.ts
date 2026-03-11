import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { FeedbackAnalysisSchema } from '@/lib/schemas'

// REQUIREMENT: Use the ANON key instead of Service Role to comply with "No service key" rule
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 1. Parse the incoming email payload
    const subject = body.subject || ''
    const content = body.text || ''
    
    // REQUIREMENT A01.1: Extract email from subject
    const emailMatch = subject.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)
    const customerEmail = emailMatch ? emailMatch[1] : 'Unassigned'

    // Placeholder for AI data in case of failure
    let aiData = {
      sentiment: 'Neutral',
      summary: 'No summary generated.',
      tags: [] as string[],
      ocr_content: null as string | null,
      is_processed: false
    }

    // 2. Process with AI using strict bounty tagging rules
    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a strict customer feedback analyzer. Analyze the text. Respond ONLY with valid JSON.
            STRICT RULES: Use ONLY tags from this list: ["UI", "Bug", "Search Bar", "Search Results", "Filter", "Sequences", "Inbox", "Integrations"]. 
            If positive, add "Positive Feedback". If negative, add "Negative Feedback".`
          },
          { role: 'user', content }
        ],
        response_format: { type: 'json_object' }
      })

      // REQUIREMENT: Use Zod and .parse for structured outputs
      const rawJson = JSON.parse(aiResponse.choices[0].message.content || '{}')
      const validatedData = FeedbackAnalysisSchema.parse(rawJson)
      
      aiData = {
        sentiment: validatedData.sentiment,
        summary: validatedData.summary,
        tags: validatedData.tags,
        ocr_content: validatedData.ocr_content || null,
        is_processed: true
      }
    } catch (aiError) {
      console.warn("AI processing skipped or failed validation:", aiError)
    }

    // REQUIREMENT A01.3: Apply "Needs Assignment" if email is missing
    if (customerEmail === 'Unassigned' && !aiData.tags.includes('Needs Assignment')) {
      aiData.tags.push('Needs Assignment')
    }

    // 3. Insert into database using the standard client
    // Ensure your Supabase RLS allows "Anon" to perform Inserts on the feedback table
    const { error } = await supabase.from('feedback').insert({
      customer_email: customerEmail,
      source: 'email',
      rating: 3, // Default rating for email channel
      content: content,
      ...aiData
    })

    if (error) {
      console.error('Database Insert error:', error)
      throw error
    }

    return NextResponse.json({ success: true, message: 'Email ingested successfully' })

  } catch (error) {
    console.error('Webhook Runtime Error:', error)
    return NextResponse.json(
      { error: 'Failed to process inbound feedback' }, 
      { status: 500 }
    )
  }
}