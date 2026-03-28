import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const signIn = async (formData: FormData) => {
    "use server";
    const provider = formData.get("provider") as string;
    const supabase = await createClient();
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${protocol}://${host}/auth/callback`,
      },
    });

    if (data.url) {
      redirect(data.url);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-center text-sm text-slate-500">
          Sign in to access your PMAP board.
        </p>
        
        <form action={signIn} className="flex flex-col gap-4 w-full">
          <input type="hidden" name="provider" value="github" />
          <Button type="submit" className="w-full text-lg border-2">
            Continue with GitHub
          </Button>
        </form>

        <form action={signIn} className="flex flex-col gap-4 w-full">
          <input type="hidden" name="provider" value="google" />
          <Button type="submit" className="w-full text-lg border-2 bg-white text-black hover:bg-slate-50">
            Continue with Google
          </Button>
        </form>
      </Card>
    </div>
  );
}
