import { notFound, redirect } from "next/navigation";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { migrate } from "@/lib/schema/portfolio";
import { EditorApp } from "@/components/editor/EditorApp";
import { SignOutButton } from "@/components/editor/SignOutButton";

export const metadata = { title: "Editor" };

export default async function EditPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  // Signed out is a different answer from "not yours": send them to sign in
  // rather than showing a 404 they cannot act on.
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  // Ownership, not existence: looking a site up by id alone is how one user
  // ends up editing another's portfolio.
  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  return (
    <EditorApp
      siteId={owned.site.id}
      subdomain={owned.site.subdomain}
      initialDoc={migrate(owned.site.draftDoc)}
      initialUpdatedAt={owned.site.updatedAt.toISOString()}
      publishedAt={owned.site.publishedAt?.toISOString() ?? null}
      signOutSlot={<SignOutButton />}
    />
  );
}
