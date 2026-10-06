import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { Compass, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff dashboard — OdysseyBite" },
      {
        name: "description",
        content: "OdysseyBite venue staff area: live orders, menu management and sales summary.",
      },
      { property: "og:title", content: "Staff dashboard — OdysseyBite" },
      { property: "og:description", content: "Manage OdysseyBite orders and the menu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [session]);

  if (!ready) {
    return <CenteredNote title="Loading…" body="Checking your staff session." />;
  }

  if (!session) return <AdminLogin />;

  if (isAdmin === false) {
    return (
      <CenteredNote
        title="No staff access"
         body="This account is signed in but is not an OdysseyBite admin. Ask the venue owner to grant access, or sign out and use the admin account."
        action={
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            Sign out
          </Button>
        }
      />
    );
  }

  if (isAdmin === null) {
    return <CenteredNote title="Loading…" body="Checking your permissions." />;
  }

  return (
     <div className="min-h-screen bg-background">
       <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
           <span className="flex size-9 items-center justify-center rounded-full border border-primary/60 text-primary">
             <Compass className="size-5" />
          </span>
          <div className="mr-4">
             <p className="font-display text-lg font-bold uppercase leading-none text-primary">OdysseyBite</p>
            <p className="text-xs text-muted-foreground">Staff dashboard</p>
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <AdminTab to="/admin" label="Orders" exact />
            <AdminTab to="/admin/menu" label="Menu" />
            <AdminTab to="/admin/summary" label="Sales" />
          </nav>
          <Button
            variant="ghost"
            className="ml-auto gap-2"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out");
            }}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function AdminTab({
  to,
  label,
  exact = false,
}: {
  to: "/admin" | "/admin/menu" | "/admin/summary";
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "rounded-lg px-3 py-2 bg-secondary text-foreground" }}
      activeOptions={{ exact }}
    >
      {label}
    </Link>
  );
}

function CenteredNote({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        {action}
      </div>
    </div>
  );
}

const STAFF_DOMAIN = "quickbite.staff";

function AdminLogin() {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const id = staffId.trim();
    const email = id.includes("@") ? id : `${id}@${STAFF_DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error("Wrong staff ID or password");
    else toast.success("Welcome back");
    setBusy(false);
  };

  return (
     <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={submit}
         className="voyage-panel w-full max-w-sm rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
         <span className="mb-4 flex size-11 items-center justify-center rounded-full border border-primary/60 text-primary">
          <ShieldCheck className="size-5" />
        </span>
        <h1 className="text-2xl font-extrabold">Staff login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with your staff ID to manage orders and the menu.
        </p>

        <div className="mt-5 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="staffId">Staff ID</Label>
            <Input
              id="staffId"
              inputMode="text"
              autoComplete="username"
              placeholder="8637205752"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
        </div>

        <Button type="submit" className="mt-5 w-full" size="lg" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <Link to="/" className="mt-4 block text-center text-sm text-muted-foreground underline">
          Back to menu
        </Link>
      </form>
    </div>
  );
}
