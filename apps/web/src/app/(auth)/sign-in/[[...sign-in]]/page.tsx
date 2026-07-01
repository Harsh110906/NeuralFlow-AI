import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <SignIn routing="path" path="/sign-in" />
    </div>
  )
}
