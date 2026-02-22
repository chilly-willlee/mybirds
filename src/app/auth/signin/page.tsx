import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <SignInForm />
    </main>
  );
}
