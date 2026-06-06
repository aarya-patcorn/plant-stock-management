import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import newLogo from "@/assets/new_logo.png";
import { AUTH_STORAGE_KEY } from "@/lib/auth";
import { loginUser } from "@/lib/api";
import LoginLoader from "../ui/LoginLoader";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasAuthenticatedUser = (response: unknown) => {
    const record = typeof response === "object" && response !== null ? (response as Record<string, unknown>) : {};
    const data = record.data;

    if (Array.isArray(data)) {
      return data.length > 0;
    }

    if (typeof data === "boolean") {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      return true;
    }

    if (typeof data === "string") {
      return data.trim().length > 0 && !/not found|invalid|does not exist/i.test(data);
    }

    return record.success === true;
  };

  const getAuthenticatedUserName = (response: unknown) => {
    const record = typeof response === "object" && response !== null ? (response as Record<string, unknown>) : {};
    const data = typeof record.data === "object" && record.data !== null
      ? record.data as Record<string, unknown>
      : {};
    const userName = data.userName;

    return typeof userName === "string" && userName.trim() ? userName : formData.userId;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await loginUser(formData);

      if (!hasAuthenticatedUser(response)) {
        throw new Error("User not found. Please check your credentials.");
      }

      window.localStorage.setItem(AUTH_STORAGE_KEY, formData.userId);
      window.localStorage.setItem("userName", getAuthenticatedUserName(response));

      toast.success("Login successful.");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,_#f8fafc_0%,_#edf7f6_48%,_#fff7ed_100%)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <section className="w-full max-w-5xl">
          <Card className="overflow-hidden border-white/70 bg-white/88 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="grid lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.05fr)]">
              <div className="hidden border-r border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9)_0%,_rgba(248,250,252,0.92)_100%)] p-8 lg:flex lg:flex-col lg:justify-between">
                <div>
                  <div className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <img alt="Kamdhenu Adhesive" className="h-16 w-auto object-contain" src={newLogo} />
                  </div>
                  <div className="mt-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Inventory Workspace
                    </p>
                    <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-foreground">
                      Sign in to manage stock movement with clarity.
                    </h1>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
                      Access purchase, production, and dispatch workflows from one focused control panel.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    "Purchase tracking",
                    "Production visibility",
                    "Dispatch readiness",
                  ].map((item) => (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-7 lg:p-9">
                <div className="mb-6 flex justify-center lg:hidden">
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <img alt="Kamdhenu Adhesive" className="h-14 w-auto object-contain" src={newLogo} />
                  </div>
                </div>

                <CardHeader className="p-0">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                    <LockKeyhole className="size-5" />
                  </div>
                  <CardTitle className="text-3xl tracking-[-0.03em]">Welcome back</CardTitle>
                  <CardDescription className="max-w-md text-sm leading-6">
                    Enter your credentials to continue to the inventory workspace.
                  </CardDescription>
                </CardHeader>

                <CardContent className="mt-8 p-0">
                  <form className="grid gap-5" onSubmit={handleSubmit}>
                    <div>
                      <Label className="text-sm font-semibold text-foreground" htmlFor="username">User ID</Label>
                      <div className="mt-2">
                        <Input
                          className="h-12 rounded-xl border-slate-200 bg-white px-4 shadow-sm"
                          id="username"
                          autoComplete="username"
                          placeholder="Enter user ID"
                          type="text"
                          value={formData.userId}
                          onChange={(event) =>
                            setFormData((current) => ({ ...current, userId: event.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-sm font-semibold text-foreground" htmlFor="password">Password</Label>
                      </div>
                      <div className="relative mt-2">
                        <Input
                          className="h-12 rounded-xl border-slate-200 bg-white px-4 pr-11 shadow-sm"
                          id="password"
                          autoComplete="current-password"
                          placeholder="Enter password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(event) =>
                            setFormData((current) => ({ ...current, password: event.target.value }))
                          }
                        />
                        <Button
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-1 top-1 h-10 w-10 rounded-xl"
                          onClick={() => setShowPassword((value) => !value)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="h-12 w-full rounded-xl"
                      size="lg"
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: isSubmitting ? "#e8e8e8" : "",
                        color: isSubmitting ? "#333" : "",
                      }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <LoginLoader />
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        <>
                          <LogIn />
                          Sign in
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-muted/30 px-4 py-4 text-sm leading-6 text-muted-foreground">
                    Use authorized inventory credentials for purchase, manufacturing, and departure entries.
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
