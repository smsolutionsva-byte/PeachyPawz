import PeachyApp from "@/components/PeachyApp";
import LoginScreen from "@/components/LoginScreen";
import { auth, signIn, signOut } from "@/auth";
import { isAIConfigured } from "@/lib/ai/provider";

export default async function Page() {
  const googleConfigured = Boolean(process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const session = googleConfigured ? await auth() : null;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  if (!session?.user) {
    return <LoginScreen signInAction={signInWithGoogle} configured={googleConfigured} />;
  }

  const id = session.user.email || session.user.name || "google-user";
  return (
    <PeachyApp
      user={{ id, name: session.user.name, email: session.user.email, image: session.user.image }}
      aiAvailable={isAIConfigured()}
      signOutAction={signOutAction}
    />
  );
}
