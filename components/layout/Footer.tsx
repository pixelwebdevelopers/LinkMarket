"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap, Send, ArrowUpRight, Globe, Shield, Clock } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Why LinkMarket", href: "/#features" },
      { label: "Link Types", href: "/#link-types" },
      { label: "Reviews", href: "/#testimonials" },
    ],
  },
  {
    title: "Publishers",
    links: [
      { label: "List Your Site", href: "/register?role=publisher" },
      { label: "Submit a Site", href: "/publisher/new" },
      { label: "My Sites", href: "/publisher" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", href: "/login" },
      { label: "Create Account", href: "/register" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "My Orders", href: "/orders" },
    ],
  },
];

// Brand glyphs (lucide dropped brand icons in this version) — clean inline SVGs
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12Z" />
    </svg>
  );
}

const socials = [
  { label: "X (Twitter)", href: "https://twitter.com", Icon: XIcon },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedInIcon },
  { label: "GitHub", href: "https://github.com", Icon: GitHubIcon },
];

const trustItems = [
  { icon: Shield, text: "12-month guarantee" },
  { icon: Clock, text: "24hr avg. delivery" },
  { icon: Globe, text: "10,000+ vetted sites" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3500);
  }

  return (
    <footer className="relative border-t border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* gradient top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      {/* ambient glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top: brand + columns + newsletter */}
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 py-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-indigo-500 blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 transition-transform group-hover:scale-110">
                  <Zap className="h-5 w-5 text-white" fill="currentColor" />
                </div>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                Link<span className="text-indigo-400">Market</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 mt-4 leading-relaxed max-w-xs">
              The #1 marketplace to buy guest posts and niche edits from 10,000+ real,
              vetted publishers. Fast, transparent, guaranteed.
            </p>

            {/* socials */}
            <div className="flex items-center gap-2.5 mt-6">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-9 w-9 grid place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Stay in the loop</h3>
            <p className="text-sm text-zinc-500 mb-3">Get new high-DR listings and SEO tips. No spam.</p>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pl-3.5 pr-12 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-indigo-500/30"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-emerald-400 mt-2 animate-fade-in">Thanks — you&apos;re subscribed! 🎉</p>
            )}
          </div>
        </div>

        {/* trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6 border-t border-zinc-800/80">
          {trustItems.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-2 text-xs text-zinc-500">
              <Icon className="h-4 w-4 text-indigo-400" /> {text}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-zinc-800/80">
          <p className="text-zinc-600 text-sm order-2 sm:order-1">
            © {new Date().getFullYear()} LinkMarket. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-zinc-500 order-1 sm:order-2">
            <Link href="/#features" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/#features" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
