import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
      <SignUp routing="path" path="/sign-up" />
    </div>
  )
}
