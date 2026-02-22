"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("resend", {
      email,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Something went wrong. Please try again.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-slate">
          We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
        </p>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Sign in to New Birds</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="birder@example.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Send magic link
        </Button>
      </form>
    </Card>
  );
}
