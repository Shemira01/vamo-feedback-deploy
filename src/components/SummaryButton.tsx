// src/components/SummaryButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { generateAggregateSummary } from '@/app/actions/summary'
import { Card, CardContent } from '@/components/ui/card'

export default function SummaryButton({ feedbacks }: { feedbacks: any[] }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const result = await generateAggregateSummary(feedbacks)
    setSummary(result || "Failed to generate.")
    setLoading(false)
  }

  return (
    <div className="space-y-4 w-full mb-6">
      <Button 
        onClick={handleGenerate} 
        disabled={loading || !feedbacks || feedbacks.length === 0} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      >
        {loading ? 'Analyzing Feedback...' : '✨ Generate AI Report for Current View'}
      </Button>

      {summary && (
        <Card className="bg-blue-50/50 border-blue-200 shadow-inner">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">AI Insights Report</h3>
            <div className="whitespace-pre-wrap text-sm text-blue-800 leading-relaxed">
              {summary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}