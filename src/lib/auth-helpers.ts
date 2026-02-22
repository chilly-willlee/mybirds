import "server-only";
import { auth } from "./auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  return session;
}

export async function getOptionalSession() {
  return await auth();
}
