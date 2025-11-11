import { SignIn } from '@clerk/react-router';
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Well cumback</h1>
          <SignIn signUpUrl='/sign-up'/>
      </div>
    </div>
  );
}
