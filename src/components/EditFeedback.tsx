// src/components/EditFeedback.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateFeedback } from '@/app/actions/feedback'

export default function EditFeedback({ feedback }: { feedback: any }) {
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
        Edit Tags & Email
      </Button>
    )
  }

  return (
    <div className="mt-4 p-4 border rounded-md bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <form action={async (formData) => {
        await updateFeedback(formData)
        setIsEditing(false) // Close the editor after saving
      }} className="space-y-4">
        
        {/* Hidden input to pass the ID to the server */}
        <input type="hidden" name="id" value={feedback.id} />
        
        <div className="space-y-2">
          <Label htmlFor={`email-${feedback.id}`}>Customer Email</Label>
          <Input 
            id={`email-${feedback.id}`} 
            name="customerEmail" 
            defaultValue={feedback.customer_email} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`tags-${feedback.id}`}>Tags (comma separated)</Label>
          <Input 
            id={`tags-${feedback.id}`} 
            name="tags" 
            defaultValue={feedback.tags?.join(', ')} 
          />
          <p className="text-xs text-zinc-500">
            Allowed: UI, Bug, Search Bar, Search Results, Filter, Sequences, Inbox, Integrations, Positive Feedback, Negative Feedback, Needs Assignment
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm">Save Changes</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}