import { signOut } from "@/auth";

/**
 * Sign-out as a POST.
 *
 * A GET link would let any page log you out with an image tag; Auth.js expects
 * a form post for exactly that reason.
 */
export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400">
        Sign out
      </button>
    </form>
  );
}
