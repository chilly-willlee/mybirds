import { Navigation } from "@/components/nav/navigation";
import { MyLifeList } from "@/components/lifelist/my-life-list";
import { getOptionalSession } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function LifeListPage() {
  const session = await getOptionalSession();
  return (
    <>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        {!session ? (
          <div className="bg-forest text-white rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">My Birds</h1>
            <p className="text-white/80 mb-4">
              Discover your next lifer. Import your eBird life list to see which birds near you are missing from your list.
            </p>
            <Link href="/auth/signin">
              <Button variant="accent" size="lg">Sign up with email &rarr;</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">Life List</h1>
            <MyLifeList />
          </>
        )}
      </main>
    </>
  );
}
