import { auth } from "@/lib/auth";
import { Navigation } from "@/components/nav/navigation";
import { LandingBirds } from "@/components/birds/landing-birds";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        {!session && (
          <div className="bg-forest text-white rounded-lg p-6 mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">New Birds</h1>
            <p className="text-white/80 mb-4">
              Discover your next lifer. Import your eBird life list to see which birds near you are missing from your list.
            </p>
            <Link href="/auth/signin">
              <Button variant="accent" size="lg">Sign up with email &rarr;</Button>
            </Link>
          </div>
        )}

        {session && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Birds for You</h1>
            <p className="text-slate text-sm mt-1">Interesting birds spotted near you recently</p>
          </div>
        )}

        <LandingBirds isLoggedIn={!!session} />

        {!session && (
          <div className="mt-8 bg-surface rounded-lg border border-gray-100 p-6 text-center">
            <p className="text-slate mb-3">
              See your full life list and discover new birds nearby.
            </p>
            <Link href="/auth/signin">
              <Button variant="primary">Sign up with email &rarr;</Button>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
