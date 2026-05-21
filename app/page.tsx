import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap, Shield, Clock, TrendingUp, Star, Users,
  ArrowRight, CheckCircle, Globe, BarChart3, Lock,
} from "lucide-react";

const stats = [
  { label: "Curated Sites", value: "10,000+", icon: Globe },
  { label: "Countries", value: "90+", icon: TrendingUp },
  { label: "Avg. Delivery", value: "24hrs", icon: Clock },
  { label: "Active Buyers", value: "1,000+", icon: Users },
];

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Most orders go live within 24 hours. No waiting weeks." },
  { icon: Shield, title: "12-Month Guarantee", desc: "Link removed? We'll replace it within 7 days. Guaranteed." },
  { icon: BarChart3, title: "Real Metrics", desc: "DR, DA, traffic, referring domains — updated every week by our team." },
  { icon: Star, title: "Vetted Publishers", desc: "Every site manually reviewed. Zero PBNs, zero spam." },
  { icon: Users, title: "All Niches", desc: "SaaS, finance, iGaming, health, crypto — we cover every niche." },
  { icon: Lock, title: "No Subscriptions", desc: "One-time payment per placement. No lock-in, no monthly fees." },
];

const listingTypes = [
  {
    name: "Guest Post",
    desc: "Your article published on a real niche site with a permanent do-follow backlink.",
    icon: "✍️",
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  {
    name: "Niche Edit",
    desc: "Contextual link inserted into an existing article already ranking on Google.",
    icon: "🔗",
    color: "from-emerald-500/10 to-green-500/10 border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  {
    name: "Tier 2 Link",
    desc: "Amplify your primary backlinks with powerful secondary link signals.",
    icon: "🚀",
    color: "from-purple-500/10 to-violet-500/10 border-purple-500/20",
    badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  },
];

const testimonials = [
  { name: "Alex R.", role: "SEO Agency Owner", text: "Best link marketplace I've used. Fast, reliable, and the quality is consistently high.", rating: 5 },
  { name: "Sarah M.", role: "E-commerce Brand", text: "Our rankings improved significantly after 3 months. The turnaround time is insane.", rating: 5 },
  { name: "James K.", role: "Affiliate Marketer", text: "Finally a platform that doesn't oversell and underdeliver. Exactly what I needed.", rating: 5 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <Zap className="h-3.5 w-3.5" />
            The #1 Link Building Marketplace
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
            Build Links That
            <br />
            <span className="gradient-text">Actually Rank</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Buy guest posts and niche edits from 10,000+ real, vetted publishers.
            Fast delivery. Guaranteed quality. Transparent pricing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/marketplace">
              <Button size="lg" className="text-base px-8 h-12">
                Browse Marketplace <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register?role=publisher">
              <Button size="lg" variant="outline" className="text-base px-8 h-12">
                List Your Site
              </Button>
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            {["✓ No subscription required", "✓ 12-month guarantee", "✓ 24hr avg. delivery", "✓ 10,000+ publishers"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
                  <div className="text-sm text-zinc-500">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Link Types */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Three Ways to Build Links</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">Pick the right type for your SEO strategy and budget</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {listingTypes.map((t) => (
            <div key={t.name} className={`rounded-2xl border bg-gradient-to-br p-6 ${t.color} hover:scale-[1.02] transition-transform duration-200`}>
              <div className="text-3xl mb-4">{t.icon}</div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${t.badge}`}>{t.name}</span>
              <p className="text-zinc-300 mt-4 text-sm leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-zinc-900/40 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why LinkMarket?</h2>
            <p className="text-zinc-400 text-lg">Built for SEOs who demand speed, quality, and transparency</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all duration-200">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Trusted by SEO Professionals</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-zinc-400">4.9/5 average rating from 500+ reviews</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="font-semibold text-white text-sm">{t.name}</p>
                <p className="text-zinc-500 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to Rank Higher?
          </h2>
          <p className="text-zinc-400 text-lg mb-10">
            Join 1,000+ SEO professionals already using LinkMarket to build better links.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-10 h-12">
                Start Building Links <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="text-base px-10 h-12">
                Browse Marketplace
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-zinc-500">
            {["Free to join", "No credit card required", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">Link<span className="text-indigo-400">Market</span></span>
            </Link>
            <div className="flex gap-6 text-sm text-zinc-500">
              <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
              <Link href="/register?role=publisher" className="hover:text-white transition-colors">Sell Links</Link>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            </div>
            <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} LinkMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
