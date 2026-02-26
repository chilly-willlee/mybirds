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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Birds for Me</h1>
          <p className="text-slate text-sm mt-1">Interesting birds seen nearby</p>
        </div>

        <LandingBirds isLoggedIn={!!session} />

        {!session && (
          <div className="bg-forest text-white rounded-lg p-6 mt-6 text-center">
            <h1 className="text-2xl font-bold mb-2">My Birds</h1>
            <p className="text-white/80 mb-4">
              Discover your next lifer. Import your eBird life list to see which birds near you are missing from your list.
            </p>
            <Link href="/auth/signin">
              <Button variant="accent" size="lg">Sign up with email &rarr;</Button>
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
