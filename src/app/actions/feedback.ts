// src/app/actions/feedback.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function addManualFeedback(formData: FormData) {
  const supabase = await createClient()

  // 1. Handle Customer Email (Requirement A01.1 & A01.3)
  const rawEmail = formData.get('customerEmail') as string
  const customerEmail = rawEmail && rawEmail.trim() !== '' ? rawEmail.trim() : 'Unassigned'

  // Extract other data
  const rawData = {
    customer_email: customerEmail,
    source: formData.get('source') as string,
    rating: parseInt(formData.get('rating') as string),
    content: formData.get('content') as string,
  }

  let imageUrl = null

  // 2. Handle Image Upload (Requirement A01.4)
  const imageFile = formData.get('image') as File
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('feedback-attachments')
      .upload(fileName, imageFile)

    if (uploadError) {
      console.error('Image upload failed:', uploadError)
    } else {
      const { data: publicUrlData } = supabase.storage
        .from('feedback-attachments')
        .getPublicUrl(fileName)
      imageUrl = publicUrlData.publicUrl
    }
  }

  let aiData = {
    sentiment: 'neutral',
    summary: 'No summary generated.',
    tags: [] as string[],
    ocr_content: null,
    is_processed: false
  }

  // 3. Strict AI Processing (Requirement A02)
  try {
    const userContent: any[] = [{ type: 'text', text: rawData.content }]
    if (imageUrl) {
      userContent.push({ type: 'image_url', image_url: { url: imageUrl } })
    }

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        {
          role: 'system',
          content: `You are a strict customer feedback analyzer. Analyze the text and images. 
          Respond ONLY with valid JSON in this exact format: 
          {
            "sentiment": "Positive" | "Neutral" | "Negative",
            "summary": "A brief 1-sentence summary",
            "tags": ["tag1", "tag2"],
            "ocr_content": "Extracted text from image, or null"
          }
          
          STRICT TAGGING RULES:
          You MUST ONLY use tags from this exact list if the user mentions them:
          ["UI", "Bug", "Search Bar", "Search Results", "Filter", "Sequences", "Inbox", "Integrations"]
          
          Additionally, if the tone is generally positive, add the tag "Positive Feedback". 
          If negative, add "Negative Feedback".`
        },
        {
          role: 'user',
          content: userContent
        }
      ],
      response_format: { type: 'json_object' }
    })

    const parsedResponse = JSON.parse(aiResponse.choices[0].message.content || '{}')
    
    // Get the AI tags
    let finalTags: string[] = parsedResponse.tags || []
    
    // Add manual "Needs Assignment" tag if no email was provided (Requirement A01.3)
    if (customerEmail === 'Unassigned') {
      finalTags.push('Needs Assignment')
    }

    aiData = {
      sentiment: parsedResponse.sentiment || 'neutral',
      summary: parsedResponse.summary || 'No summary generated.',
      tags: finalTags,
      ocr_content: parsedResponse.ocr_content || null,
      is_processed: true
    }
  } catch (error) {
    console.error("AI Processing failed:", error)
  }

  // 4. Save to Database
  const finalData = {
    ...rawData,
    ...aiData,
    image_url: imageUrl
  }

  const { error } = await supabase.from('feedback').insert(finalData)

  if (error) {
    console.error('Insert error:', error)
    throw new Error('Failed to insert feedback')
  }

  revalidatePath('/')
}

export async function updateFeedback(formData: FormData) {
  const supabase = await createClient()
  
  // Extract the data
  const id = formData.get('id') as string
  const customer_email = formData.get('customerEmail') as string
  const tagsRaw = formData.get('tags') as string
  
  // Convert the comma-separated string back into a clean array
  const tags = tagsRaw.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

  // Update the database
  const { error } = await supabase
    .from('feedback')
    .update({ customer_email, tags })
    .eq('id', id)

  if (error) {
    console.error('Update error:', error)
    throw new Error('Failed to update feedback')
  }

  // Refresh the UI
  revalidatePath('/')
}