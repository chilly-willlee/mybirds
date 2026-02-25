import { Navigation } from "@/components/nav/navigation";
import { MyLifeList } from "@/components/lifelist/my-life-list";
import { getRequiredSession } from "@/lib/auth-helpers";

export default async function LifeListPage() {
  await getRequiredSession();
  return (
    <>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold mb-4">Life List</h1>
        <MyLifeList />
      </main>
    </>
  );
}
