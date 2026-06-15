import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";
import { Footer } from "@/components/layout/Footer";
import { SpotlightCard } from "@/components/landing/SpotlightCard";
import { Magnetic } from "@/components/landing/Magnetic";
import { cn } from "@/lib/utils";
import {
  Zap, Shield, Clock, TrendingUp, Star, Users,
  ArrowRight, CheckCircle, Globe, BarChart3, Lock, ArrowUpRight, Sparkles,
} from "lucide-react";

const stats = [
  { label: "Curated Sites", value: 10000, suffix: "+", icon: Globe },
  { label: "Countries", value: 90, suffix: "+", icon: TrendingUp },
  { label: "Avg. Delivery", value: 24, suffix: "hrs", icon: Clock },
  { label: "Active Buyers", value: 1000, suffix: "+", icon: Users },
];

const features = [
  { icon: Zap, title: "Lightning Fast", desc: "Most orders go live within 24 hours — not weeks. Real-time status from order to publish." },
  { icon: BarChart3, title: "Real Metrics", desc: "DR, DA, traffic & referring domains, refreshed weekly by our team." },
  { icon: Shield, title: "12-Month Guarantee", desc: "Link removed? We replace it within 7 days. Guaranteed." },
  { icon: Star, title: "Vetted Publishers", desc: "Every site manually reviewed. Zero PBNs, zero spam." },
  { icon: Users, title: "All Niches", desc: "SaaS, finance, iGaming, health, crypto — every niche covered." },
  { icon: Lock, title: "No Subscriptions", desc: "One-time payment per placement. No lock-in, ever." },
];

const listingTypes = [
  {
    name: "Guest Post",
    desc: "Your article published on a real niche site with a permanent do-follow backlink.",
    icon: "✍️",
    color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
  },
  {
    name: "Niche Edit",
    desc: "Contextual link inserted into an existing article already ranking on Google.",
    icon: "🔗",
    color: "from-emerald-500/10 to-green-500/10 border-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  },
];

const testimonials = [
  { name: "Alex R.", role: "SEO Agency Owner", text: "Best link marketplace I've used. Fast, reliable, and the quality is consistently high.", rating: 5, accent: "from-indigo-500 to-blue-500" },
  { name: "Sarah M.", role: "E-commerce Brand", text: "Our rankings improved significantly after 3 months. The turnaround time is insane.", rating: 5, accent: "from-purple-500 to-pink-500" },
  { name: "James K.", role: "Affiliate Marketer", text: "Finally a platform that doesn't oversell and underdeliver. Exactly what I needed.", rating: 5, accent: "from-emerald-500 to-teal-500" },
  { name: "Priya N.", role: "SaaS Founder", text: "We 3x'd our organic traffic in two quarters. The metrics are accurate and the support is stellar.", rating: 5, accent: "from-amber-500 to-orange-500" },
  { name: "Marco D.", role: "Link Builder", text: "The vetting is real — no PBNs, no junk. Every placement has been a genuine, ranking site.", rating: 5, accent: "from-rose-500 to-red-500" },
  { name: "Lena V.", role: "Growth Lead", text: "Transparent pricing and a 12-month guarantee actually delivered on. This is how it should work.", rating: 5, accent: "from-cyan-500 to-blue-500" },
];

// Bento layout config for the feature grid
const featureLayout = [
  { span: "md:col-span-2 lg:col-span-2", big: true },
  { span: "lg:col-span-2", big: true },
  { span: "", big: false },
  { span: "", big: false },
  { span: "", big: false },
  { span: "", big: false },
];

const niches = [
  "SaaS", "Finance", "Health", "iGaming", "Crypto", "Technology", "Travel",
  "Marketing", "E-commerce", "Real Estate", "Legal", "Fashion", "Sports", "Education",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">

      {/* Hero */}
      <section className="relative">
        {/* Animated backdrop */}
        <div className="absolute inset-0 hero-mesh pointer-events-none" />
        <div className="absolute inset-0 bg-grid pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[760px] h-[520px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute top-24 left-[8%] w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-44 right-[8%] w-64 h-64 bg-pink-600/15 rounded-full blur-3xl animate-float" />
          <div className="absolute top-[60%] left-[20%] w-56 h-56 bg-blue-600/10 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* LEFT — copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 animate-fade-in-up backdrop-blur-sm">
                <span className="relative flex h-2 w-2 text-emerald-700 dark:text-emerald-400">
                  <span className="ping-soft absolute inset-0" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                10,000+ live listings · updated weekly
              </div>

              <h1 className="text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-5 animate-fade-in-up delay-100">
                Build Links That
                <br />
                <span className="gradient-text">Actually Rank</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-fade-in-up delay-200">
                Buy guest posts and niche edits from 10,000+ real, vetted publishers.
                Fast delivery. Guaranteed quality. Transparent pricing.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-8 animate-fade-in-up delay-300">
                <Link href="/marketplace" className="w-full sm:w-auto">
                  <Button size="lg" className="text-base px-8 h-12 w-full shine">
                    Browse Marketplace <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register?role=publisher" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="text-base px-8 h-12 w-full">
                    List Your Site
                  </Button>
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4 animate-fade-in-up delay-400">
                <div className="flex -space-x-2.5">
                  {[
                    "from-indigo-500 to-blue-500",
                    "from-purple-500 to-pink-500",
                    "from-emerald-500 to-teal-500",
                    "from-amber-500 to-orange-500",
                    "from-rose-500 to-red-500",
                  ].map((g, i) => (
                    <div
                      key={i}
                      className={`h-8 w-8 rounded-full bg-gradient-to-br ${g} ring-2 ring-white dark:ring-zinc-950 grid place-items-center text-[10px] font-bold text-white`}
                    >
                      {["A", "S", "J", "M", "R"][i]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-700 dark:text-amber-400" />)}
                  </div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold text-zinc-900 dark:text-white">4.9/5</span> from 1,000+ SEOs
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT — Floating dashboard preview */}
            <div className="relative w-full max-w-xl mx-auto lg:max-w-none animate-fade-in-up delay-500">
            {/* conic glow */}
            <div className="absolute -inset-10 rounded-[2rem] conic-glow blur-2xl opacity-50 pointer-events-none" />
            <div className="relative float-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/60 overflow-hidden">
              {/* window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <div className="ml-3 flex-1 h-6 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 flex items-center px-3">
                  <Globe className="h-3 w-3 text-zinc-500 mr-2" />
                  <span className="text-[11px] text-zinc-500">app.rankistic.com/marketplace</span>
                </div>
              </div>
              {/* sample listing rows */}
              <div className="p-4 sm:p-5 space-y-3 text-left">
                {[
                  { domain: "techcrunch-style.com", niche: "Technology", dr: 78, traffic: "1.2M", price: "$420", tag: "Guest Post", tagClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
                  { domain: "financehub.io", niche: "Finance", dr: 65, traffic: "540K", price: "$310", tag: "Niche Edit", tagClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
                  { domain: "healthdaily.co", niche: "Health", dr: 52, traffic: "210K", price: "$180", tag: "Guest Post", tagClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
                ].map((row, i) => (
                  <div
                    key={row.domain}
                    className="flex items-center gap-3 sm:gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 px-3 sm:px-4 py-3 hover:border-indigo-500/30 transition-colors"
                    style={{ animationDelay: `${600 + i * 120}ms` }}
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-zinc-300 dark:from-zinc-700 to-zinc-200 dark:to-zinc-800 grid place-items-center shrink-0">
                      <Globe className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{row.domain}</span>
                        <span className={`hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${row.tagClass}`}>{row.tag}</span>
                      </div>
                      <span className="text-xs text-zinc-500">{row.niche}</span>
                    </div>
                    <div className="hidden sm:block text-center shrink-0">
                      <p className="text-xs text-zinc-500">DR</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{row.dr}</p>
                    </div>
                    <div className="hidden sm:block text-center shrink-0">
                      <p className="text-xs text-zinc-500">Traffic</p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">{row.traffic}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold gradient-text">{row.price}</p>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-0.5 justify-end">Order <ArrowUpRight className="h-2.5 w-2.5" /></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* floating mini stat badges */}
            <div className="hidden sm:flex absolute -left-6 top-1/3 items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur px-3 py-2 shadow-xl animate-float">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 grid place-items-center"><TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div>
              <div><p className="text-[10px] text-zinc-500 leading-none mb-0.5">Avg. rank lift</p><p className="text-xs font-bold text-zinc-900 dark:text-white">+18 spots</p></div>
            </div>
            <div className="hidden sm:flex absolute -right-6 bottom-10 items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur px-3 py-2 shadow-xl animate-float-slow">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/15 grid place-items-center"><Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /></div>
              <div><p className="text-[10px] text-zinc-500 leading-none mb-0.5">Avg. delivery</p><p className="text-xs font-bold text-zinc-900 dark:text-white">24 hours</p></div>
            </div>
            </div>
          </div>

          {/* scroll indicator */}
          <div className="hidden sm:flex flex-col items-center gap-2 mt-14 animate-fade-in delay-700">
            <span className="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Scroll</span>
            <div className="h-9 w-5 rounded-full border border-zinc-300 dark:border-zinc-700 grid justify-center pt-1.5">
              <span className="h-1.5 w-1 rounded-full bg-zinc-500 animate-bob" />
            </div>
          </div>
        </div>

        {/* Niche marquee */}
        <div className="relative max-w-full overflow-hidden py-7 border-y border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-100/30 dark:bg-zinc-900/30">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em] mb-5">Every niche covered</p>
          <div className="space-y-3 [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
            <div className="marquee gap-3">
              {[...niches, ...niches].map((n, i) => (
                <span
                  key={`${n}-${i}`}
                  className="group shrink-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap hover:border-indigo-500/40 hover:text-zinc-900 dark:hover:text-white hover:bg-indigo-500/10 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-indigo-400 transition-colors" />
                  {n}
                </span>
              ))}
            </div>
            <div className="marquee-reverse gap-3">
              {[...[...niches].reverse(), ...[...niches].reverse()].map((n, i) => (
                <span
                  key={`r-${n}-${i}`}
                  className="group shrink-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap hover:border-indigo-500/40 hover:text-zinc-900 dark:hover:text-white hover:bg-indigo-500/10 transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-indigo-400 transition-colors" />
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Reveal>
            <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/40 dot-texture overflow-hidden">
              {/* ambient glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-200/60 dark:bg-zinc-800/60 [&>*]:bg-zinc-100/40 dark:[&>*]:bg-zinc-900/40 [&>*]:py-10 md:[&>*]:py-12">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <Reveal key={s.label} delay={i * 100} className="group text-center px-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-1 gradient-text">
                        <CountUp value={s.value} suffix={s.suffix} />
                      </div>
                      <div className="text-sm text-zinc-500">{s.label}</div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Link Types */}
      <section id="link-types" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Reveal className="text-center mb-14">
          <span className="eyebrow mb-5">How it works</span>
          <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mt-5 mb-4 tracking-tight">Two Ways to Build Links</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl mx-auto">Pick the right type for your SEO strategy and budget</p>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {listingTypes.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} className="h-full">
              <SpotlightCard tilt maxTilt={7} className="h-full">
                <div className={`group relative rounded-2xl border bg-gradient-to-br p-7 h-full overflow-hidden ${t.color}`}>
                  {/* big ghost number */}
                  <span className="absolute -top-4 right-3 text-[7rem] font-black leading-none text-zinc-900/[0.07] dark:text-white/[0.04] select-none">
                    {i + 1}
                  </span>
                  <div className="text-5xl mb-5 inline-block transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 drop-shadow-lg">{t.icon}</div>
                  <div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${t.badge}`}>{t.name}</span>
                    <p className="text-zinc-700 dark:text-zinc-300 mt-4 text-sm leading-relaxed">{t.desc}</p>
                  </div>
                  <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-zinc-700/80 dark:text-white/70 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    Learn more
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-zinc-100/40 dark:bg-zinc-900/40 border-y border-zinc-200 dark:border-zinc-800 relative">
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <Reveal className="text-center mb-14">
            <span className="eyebrow mb-5">Why Rankistic</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mt-5 mb-4 tracking-tight">
              Everything you need to <span className="gradient-text">rank faster</span>
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">Built for SEOs who demand speed, quality, and transparency</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-fr">
            {features.map((f, i) => {
              const Icon = f.icon;
              const layout = featureLayout[i];
              return (
                <Reveal key={f.title} delay={(i % 4) * 80} className={cn("h-full", layout.span)}>
                  <SpotlightCard className="h-full">
                    <div className="group relative h-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors duration-300">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                          <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {i === 0 && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="ping-soft absolute inset-0" />
                              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </span>
                            LIVE
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white mb-2 text-lg">{f.title}</h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">{f.desc}</p>

                      {/* Big-tile extras */}
                      {i === 0 && (
                        <div className="mt-6 flex items-center gap-3">
                          {["Ordered", "Writing", "Published"].map((step, s) => (
                            <div key={step} className="flex items-center gap-2">
                              <span className={cn(
                                "h-2 w-2 rounded-full",
                                s < 2 ? "bg-indigo-500" : "bg-zinc-400 dark:bg-zinc-600 group-hover:bg-indigo-500 transition-colors duration-500"
                              )} />
                              <span className="text-xs text-zinc-500">{step}</span>
                              {s < 2 && <span className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {i === 1 && (
                        <div className="mt-6 flex items-end gap-1.5 h-16">
                          {[40, 65, 50, 80, 60, 95, 72].map((h, b) => (
                            <span
                              key={b}
                              className="flex-1 rounded-t bg-gradient-to-t from-indigo-500/30 to-indigo-400/80 transition-all duration-500 group-hover:from-indigo-500/50 group-hover:to-purple-400"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-20 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="eyebrow mb-5">Loved by 1,000+ SEOs</span>
            <h2 className="text-3xl sm:text-5xl font-bold text-zinc-900 dark:text-white mt-5 mb-4 tracking-tight">Trusted by SEO Professionals</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-700 dark:text-amber-400" />)}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400"><span className="font-semibold text-zinc-900 dark:text-white">4.9/5</span> from 500+ reviews</p>
            </div>
          </Reveal>
        </div>

        {/* dual auto-scrolling marquees */}
        <div className="space-y-5 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          {[
            { rows: testimonials, cls: "marquee" },
            { rows: [...testimonials].reverse(), cls: "marquee-reverse" },
          ].map((track, ti) => (
            <div key={ti} className={cn(track.cls, "gap-5")}>
              {[...track.rows, ...track.rows].map((t, i) => (
                <div
                  key={`${t.name}-${i}`}
                  className="group shrink-0 w-[340px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/80 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">
                      {[...Array(t.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-700 dark:text-amber-400" />)}
                    </div>
                    <span className="text-4xl leading-none text-zinc-400 dark:text-zinc-700 font-serif group-hover:text-indigo-500/40 transition-colors">&rdquo;</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed mb-5">{t.text}</p>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.accent} flex items-center justify-center text-white font-bold text-sm ring-2 ring-white dark:ring-zinc-950`}>
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white text-sm">{t.name}</p>
                      <p className="text-zinc-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-zinc-200 dark:border-zinc-800 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Reveal className="relative max-w-5xl mx-auto">
          <div className="animated-border shadow-2xl shadow-indigo-500/20 dark:shadow-indigo-950/40">
            <div className="ab-inner relative overflow-hidden px-6 sm:px-12 py-16 sm:py-20 text-center">
              {/* inner ambience */}
              <div className="absolute inset-0 hero-mesh opacity-70 pointer-events-none" />
              <div className="absolute inset-0 dot-texture opacity-40 pointer-events-none" />
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-56 bg-indigo-600/25 rounded-full blur-3xl animate-pulse-glow pointer-events-none" />

              <div className="relative">
                <span className="eyebrow mb-6">
                  <Sparkles className="h-3.5 w-3.5" /> Start in minutes
                </span>
                <h2 className="text-4xl sm:text-6xl font-extrabold text-zinc-900 dark:text-white mt-6 mb-5 tracking-tight">
                  Ready to <span className="gradient-text">Rank Higher?</span>
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300 text-lg max-w-xl mx-auto mb-10">
                  Join 1,000+ SEO professionals already using Rankistic to build better links.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Magnetic className="w-full sm:w-auto">
                    <Link href="/register" className="w-full sm:w-auto block">
                      <Button size="lg" className="text-base px-10 h-12 w-full shine">
                        Start Building Links <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </Magnetic>
                  <Link href="/marketplace" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="text-base px-10 h-12 w-full">
                      Browse Marketplace
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10 text-sm text-zinc-600 dark:text-zinc-400">
                  {["Free to join", "No credit card required", "Cancel anytime"].map((t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
