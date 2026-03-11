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

/**
 * Vamo Feedback Hub - Full Dashboard
 * Requirement A02: Domain Protection (@vamo.app only)
 * Requirement A03: Advanced Filtering (Email, Tags, Date)
 */
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; tag?: string; days?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // 🔐 Requirement A02: Domain Security
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email?.endsWith('@vamo.app')) {
    redirect('/login')
  }

  // 🔍 Requirement A03: Build Dynamic Supabase Query
  let query = supabase.from('feedback').select('*').order('created_at', { ascending: false })

  if (params.email) {
    query = query.ilike('customer_email', `%${params.email}%`)
  }

  if (params.tag && params.tag !== 'All') {
    query = query.contains('tags', [params.tag])
  }

  if (params.days && params.days !== 'All') {
    const dateLimit = new Date()
    dateLimit.setDate(dateLimit.getDate() - parseInt(params.days))
    query = query.gte('created_at', dateLimit.toISOString())
  }

  const { data: feedbacks } = await query

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900">Vamo Feedback Hub</h1>
            <p className="text-zinc-500 font-medium">Admin: {user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="outline" className="font-bold hover:text-red-600">Sign Out</Button>
          </form>
        </div>

        {/* 🛠 Requirement A03: Filter Engine */}
        <Card className="bg-white shadow-sm border-zinc-200">
          <CardContent className="p-6">
            <form method="GET" action="/" className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <Label htmlFor="emailFilter" className="text-xs font-bold text-zinc-400 uppercase">Customer Email</Label>
                <Input id="emailFilter" name="email" placeholder="Search email..." defaultValue={params.email || ''} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagFilter" className="text-xs font-bold text-zinc-400 uppercase">Category Tag</Label>
                <select 
                  id="tagFilter" 
                  name="tag" 
                  defaultValue={params.tag || 'All'}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                >
                  <option value="All">All Tags</option>
                  <option value="UI">UI</option>
                  <option value="Bug">Bug</option>
                  <option value="Search Bar">Search Bar</option>
                  <option value="Sequences">Sequences</option>
                  <option value="Inbox">Inbox</option>
                  <option value="Integrations">Integrations</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysFilter" className="text-xs font-bold text-zinc-400 uppercase">Timeframe</Label>
                <select id="daysFilter" name="days" defaultValue={params.days || 'All'} className="flex h-10 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                  <option value="All">All Time</option>
                  <option value="1">Last 24 Hours</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 font-bold">Apply</Button>
                <a href="/"><Button type="button" variant="ghost">Clear</Button></a>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          
          {/* 📥 Requirement A01: Manual Feedback Log */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 border-2 border-zinc-900 shadow-xl">
              <CardHeader className="bg-zinc-900 text-white rounded-t-lg">
                <CardTitle className="text-xl">Log New Insight</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form action={addManualFeedback} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="font-bold">Customer Email</Label>
                    <Input id="customerEmail" name="customerEmail" type="email" placeholder="user@agency.com" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source" className="font-bold">Source</Label>
                      <select id="source" name="source" className="flex h-10 w-full rounded-md border border-zinc-200 px-3 text-sm" required>
                        <option value="direct">Direct</option>
                        <option value="app_store">App Store</option>
                        <option value="google_play">Google Play</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating" className="font-bold">Rating</Label>
                      <Input id="rating" name="rating" type="number" min="1" max="5" defaultValue="5" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content" className="font-bold">Content</Label>
                    <Textarea id="content" name="content" placeholder="Paste feedback text here..." className="min-h-[120px]" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image" className="font-bold">Screenshot (OCR Ready)</Label>
                    <Input id="image" name="image" type="file" accept="image/*" className="cursor-pointer" />
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700">Save to Hub</Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 📰 Live Feedback Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">{feedbacks?.length || 0} Results</h2>
            </div>

            {/* 🤖 Requirement A04: Aggregate Summary Button */}
            <SummaryButton feedbacks={feedbacks || []} />
            
            {!feedbacks || feedbacks.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-20 text-center text-zinc-400 bg-white">
                No matching insights found.
              </div>
            ) : (
              <div className="grid gap-6">
                {feedbacks.map((item) => (
                  <Card key={item.id} className="group hover:border-zinc-900 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <p className="font-bold text-lg text-zinc-900">{item.customer_email}</p>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            {new Date(item.created_at).toLocaleDateString()} • {item.source} • {item.rating}/5
                          </p>
                        </div>
                        
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase
                          ${item.sentiment === 'Positive' ? 'bg-green-100 text-green-700' : 
                            item.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-zinc-100'}`}
                        >
                          {item.is_processed ? item.sentiment : 'Raw'}
                        </div>
                      </div>

                      <p className="text-zinc-700 leading-relaxed italic text-lg font-medium">"{item.content}"</p>

                      {item.image_url && (
                        <div className="mt-6 rounded-xl border p-2 bg-zinc-50">
                          <img src={item.image_url} alt="Screenshot" className="max-h-80 w-full object-contain rounded-lg" />
                        </div>
                      )}

                      {item.is_processed && (
                        <div className="mt-6 pt-6 border-t border-zinc-100 space-y-4">
                          <div className="bg-zinc-50 p-4 rounded-lg">
                            <p className="text-sm font-bold text-zinc-900 mb-1">AI Contextual Summary:</p>
                            <p className="text-sm text-zinc-600 leading-relaxed">{item.summary}</p>
                          </div>
                          
                          {item.ocr_content && (
                            <div className="p-4 rounded-lg border border-dashed border-zinc-200">
                              <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Image Text (OCR)</p>
                              <p className="text-sm text-zinc-600 italic">"{item.ocr_content}"</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {item.tags?.map((tag: string) => (
                              <span key={tag} className="px-2.5 py-1 rounded-md bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-tight">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 flex justify-end">
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