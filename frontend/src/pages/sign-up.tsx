import { SignUp } from '@clerk/react-router'

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black">
            <div className="w-full max-w-md p-8">
                <h1 className="text-3xl font-bold text-center mb-8 text-white">Ăn ba tô cơm</h1>
                <SignUp signInUrl='/sign-in' />
            </div>
        </div>
    )
}