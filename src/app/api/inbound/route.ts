// src/app/api/inbound/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Use the SERVICE_ROLE key to securely bypass RLS for system-level background ingestion
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    
    // Extract email from subject (Requirement A01.1)
    // Example: "New feedback from awesome.user@gmail.com!" -> extracts "awesome.user@gmail.com"
    const emailMatch = subject.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)
    const customerEmail = emailMatch ? emailMatch[1] : 'Unassigned'

    let aiData = {
      sentiment: 'Neutral',
      summary: 'No summary generated.',
      tags: [] as string[],
      ocr_content: null,
      is_processed: false
    }

    // 2. Process with AI (Using the strict bounty tagging rules)
    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a strict customer feedback analyzer. Analyze the text. Respond ONLY with valid JSON: { "sentiment": "Positive" | "Neutral" | "Negative", "summary": "1-sentence summary", "tags": ["tag1"] } 
            STRICT RULES: You MUST ONLY use tags from this exact list: ["UI", "Bug", "Search Bar", "Search Results", "Filter", "Sequences", "Inbox", "Integrations"]. If positive, add "Positive Feedback". If negative, add "Negative Feedback".`
          },
          { role: 'user', content }
        ],
        response_format: { type: 'json_object' }
      })

      const parsedResponse = JSON.parse(aiResponse.choices[0].message.content || '{}')
      let finalTags: string[] = parsedResponse.tags || []
      
      // Requirement A01.3: Unassigned tag
      if (customerEmail === 'Unassigned') finalTags.push('Needs Assignment')

      aiData = {
        sentiment: parsedResponse.sentiment || 'Neutral',
        summary: parsedResponse.summary || 'No summary generated.',
        tags: finalTags,
        ocr_content: null,
        is_processed: true
      }
    } catch (error) {
      console.log("AI processing skipped (likely quota limit)")
      if (customerEmail === 'Unassigned') aiData.tags.push('Needs Assignment')
    }

    // 3. Insert into database
    const { error } = await supabase.from('feedback').insert({
      customer_email: customerEmail,
      source: 'email',
      rating: 3, // Default rating for emails since they don't have stars
      content: content,
      ...aiData
    })

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    return NextResponse.json({ success: true, message: 'Email ingested successfully' })

  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 })
  }
}