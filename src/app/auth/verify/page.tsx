import { Card } from "@/components/ui/card";

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-slate">
          We sent you a magic link. Click the link in your email to sign in.
        </p>
      </Card>
    </main>
  );
}
