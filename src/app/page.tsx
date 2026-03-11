// src/app/page.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addManualFeedback } from './actions/feedback'
import SummaryButton from '@/components/SummaryButton'
import EditFeedback from '@/components/EditFeedback'

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; tag?: string; days?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Build the Supabase Query dynamically based on the filters applied
  let query = supabase.from('feedback').select('*').order('created_at', { ascending: false })

  // Requirement A03.1: Filter by Customer Email
  if (params.email) {
    query = query.ilike('customer_email', `%${params.email}%`)
  }

  // Requirement A03.2: Filter by specific tag
  if (params.tag && params.tag !== 'All') {
    query = query.contains('tags', [params.tag])
  }

  // Requirement A03.3: Filter within certain date ranges
  if (params.days && params.days !== 'All') {
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - parseInt(params.days))
    query = query.gte('created_at', dateLimit.toISOString())
  }

  // Execute the query
  const { data: feedbacks } = await query

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vamo Feedback Hub</h1>
            <p className="text-zinc-500">Welcome back, {user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="outline">Sign Out</Button>
          </form>
        </div>

        {/* The Filtering Engine (Requirement A03 & A03.4) */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <form method="GET" action="/" className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="emailFilter" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer Email</Label>
                <Input id="emailFilter" name="email" placeholder="Search by email..." defaultValue={params.email || ''} />
              </div>
              
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="tagFilter" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tag</Label>
                <select 
                  id="tagFilter" 
                  name="tag" 
                  defaultValue={params.tag || 'All'}
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                >
                  <option value="All">All Tags</option>
                  <option value="UI">UI</option>
                  <option value="Bug">Bug</option>
                  <option value="Search Bar">Search Bar</option>
                  <option value="Search Results">Search Results</option>
                  <option value="Filter">Filter</option>
                  <option value="Sequences">Sequences</option>
                  <option value="Inbox">Inbox</option>
                  <option value="Integrations">Integrations</option>
                  <option value="Positive Feedback">Positive Feedback</option>
                  <option value="Negative Feedback">Negative Feedback</option>
                  <option value="Needs Assignment">Needs Assignment</option>
                </select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="daysFilter" className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date Range</Label>
                <select 
                  id="daysFilter" 
                  name="days" 
                  defaultValue={params.days || 'All'}
                  className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                >
                  <option value="All">All Time</option>
                  <option value="1">Last 24 Hours</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Apply Filters</Button>
                <a href="/">
                  <Button type="button" variant="outline">Clear</Button>
                </a>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column: The Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Log Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={addManualFeedback} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Customer Email</Label>
                    <Input id="customerEmail" name="customerEmail" type="email" placeholder="e.g. user@company.com (leave blank if unknown)" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <select 
                        id="source" 
                        name="source" 
                        className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                        required
                      >
                        <option value="direct">Direct</option>
                        <option value="app_store">App Store</option>
                        <option value="google_play">Google Play</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Rating (1-5)</Label>
                      <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue="5" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Feedback</Label>
                    <Textarea 
                      id="content" 
                      name="content" 
                      placeholder="What did the customer say?" 
                      className="min-h-[100px]"
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Screenshot (Optional)</Label>
                    <Input id="image" name="image" type="file" accept="image/*" />
                  </div>

                  <Button type="submit" className="w-full">Save Feedback</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: The Live Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                {feedbacks?.length === 1 ? '1 Entry Found' : `${feedbacks?.length || 0} Entries Found`}
              </h2>
            </div>

            {/* The AI Aggregator Button */}
            <SummaryButton feedbacks={feedbacks || []} />
            
            {(!feedbacks || feedbacks.length === 0) ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-zinc-500 bg-white">
                No feedback matches those filters.
              </div>
            ) : (
              <div className="grid gap-4">
                {feedbacks.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.customer_email}</p>
                          <p className="text-sm text-zinc-500">
                            {new Date(item.created_at).toLocaleDateString()} • {item.source} • {item.rating}/5 Stars
                          </p>
                        </div>
                        
                        {item.is_processed ? (
                          <div className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider
                            ${item.sentiment === 'Positive' ? 'bg-green-100 text-green-800' : 
                              item.sentiment === 'Negative' ? 'bg-red-100 text-red-800' : 
                              'bg-zinc-100 text-zinc-800'}`}
                          >
                            {item.sentiment}
                          </div>
                        ) : (
                          <div className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">
                            Raw
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        "{item.content}"
                      </p>

                      {item.image_url && (
                        <div className="mt-4">
                          <img 
                            src={item.image_url} 
                            alt="User submitted screenshot" 
                            className="max-h-64 rounded-md border border-zinc-200 object-contain"
                          />
                        </div>
                      )}

                      {item.is_processed && (
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-medium text-zinc-900">AI Summary:</p>
                          <p className="text-sm text-zinc-600 mb-3">{item.summary}</p>
                          
                          {item.ocr_content && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-zinc-900">Extracted Text (OCR):</p>
                              <p className="text-sm text-zinc-600 italic">"{item.ocr_content}"</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {item.tags?.map((tag: string) => (
                              <span key={tag} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* NEW EDIT BUTTON COMPONENT */}
                      <div className="mt-4 flex justify-end">
                        <EditFeedback feedback={item} />
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}