import { redirect } from "next/navigation";
import { getMySite } from "@/lib/auth";

/** /dashboard is a shortcut to whatever the signed-in user should see next. */
export default async function DashboardIndex() {
  const me = await getMySite();
  if (!me?.user) redirect("/signin");
  redirect(me.site ? `/dashboard/${me.site.id}/edit` : "/onboarding");
}
