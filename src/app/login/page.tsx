// src/app/login/page.tsx
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params?.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Vamo Feedback</CardTitle>
          <CardDescription>Sign in with your @vamo.app admin email</CardDescription>
        </CardHeader>
        
        <form>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 font-medium">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@vamo.app" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" formAction={login}>Sign In</Button>
            <Button variant="outline" className="w-full" formAction={signup}>Create Account</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}