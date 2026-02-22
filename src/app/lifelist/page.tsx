import { Navigation } from "@/components/nav/navigation";
import { Tabs } from "@/components/ui/tabs";
import { MyLifeList } from "@/components/lifelist/my-life-list";
import { BirdsForYou } from "@/components/lifelist/birds-for-you";
import { getRequiredSession } from "@/lib/auth-helpers";

export default async function LifeListPage() {
  await getRequiredSession();
  return (
    <>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold mb-4">My Birds</h1>
        <Tabs
          tabs={[
            { label: "My Life List", content: <MyLifeList /> },
            { label: "Birds for You", content: <BirdsForYou /> },
          ]}
        />
      </main>
    </>
  );
}
