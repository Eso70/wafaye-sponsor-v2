"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const portalFeatures = [
  "All sponsor links in one place",
  "Built for TikTok profile traffic",
  "Fast access to campaigns and offers",
  "Simple and trusted brand presence",
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Login failed. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ecf1f7] text-slate-900">
      <section className="grid min-h-screen w-full lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden items-center justify-center overflow-hidden bg-[linear-gradient(155deg,#080f38_0%,#0e1d5a_45%,#102b84_100%)] px-8 py-10 sm:px-12 sm:py-14 lg:flex lg:px-16 lg:py-18">
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#0a1f6a]/55" />
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#67f0ec]/15" />

          <div className="relative z-10 mx-auto max-w-xl text-center text-white">
            <Image
              src="/images/Logo.jpg"
              alt="Wafaye Sponsor"
              width={96}
              height={96}
              className="mx-auto h-20 w-20 rounded-full border border-white/15 object-cover"
              priority
            />

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#8ff7f2]">
              Wafaye Sponsor
            </p>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Linktree Bio for Sponsor</h1>

            <ul className="mt-8 space-y-3 text-sm text-[#d8fdfa] sm:text-base">
              {portalFeatures.map((feature) => (
                <li key={feature} className="flex items-center justify-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#7ef7f0]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-center lg:hidden">
              <Image
                src="/images/Logo.jpg"
                alt="Wafaye Sponsor"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full border border-[#1f5ce0]/20 object-cover shadow-md"
                priority
              />
            </div>
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f5ce0]">
                TikTok Sponsor
              </p>
              <h2 className="mt-2 text-4xl tracking-tight text-[#08133f]">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600">
                This is a Linktree bio for sponsor in TikTok.
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
                <input
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  maxLength={64}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition focus:border-[#1b49d0] focus:ring-2 focus:ring-[#c8d6ff]"
                  placeholder="Enter your username"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={256}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLockOn(false)}
                    className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 pr-20 text-slate-900 outline-none transition focus:border-[#1b49d0] focus:ring-2 focus:ring-[#c8d6ff]"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {capsLockOn ? (
                <p className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                  Caps Lock is on.
                </p>
              ) : null}

              {error ? (
                <p className="rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading || !username.trim() || !password}
                className="w-full rounded-full bg-[linear-gradient(90deg,#193fb9_0%,#1f5ce0_60%,#68ede7_100%)] px-5 py-3 text-sm font-semibold tracking-[0.08em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "SIGNING IN..." : "LOGIN"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
