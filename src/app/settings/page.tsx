import { Navigation } from "@/components/nav/navigation";
import { SettingsContent } from "@/components/settings/settings-content";
import { getRequiredSession } from "@/lib/auth-helpers";

export default async function SettingsPage() {
  await getRequiredSession();
  return (
    <>
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <SettingsContent />
      </main>
    </>
  );
}
