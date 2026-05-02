import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring, animate, type Variants } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { DiscordIcon } from "@/components/DiscordIcon";
import { SupportFab } from "@/components/SupportFab";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Rocket,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  MousePointerClick,
  ShieldCheck,
  Target,
  CheckCircle2,
  Crosshair,
  Megaphone,
  Flame,
  Lock,
  XCircle,
  Sparkles,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/* ---------- Reusable animated bits ---------- */

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE as any, delay: i * 0.08 },
  }),
};

const Reveal = ({
  children,
  delay = 0,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "h2" | "p" | "span";
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const Comp: any = motion[as];
  return (
    <Comp
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={fadeUp}
      custom={delay}
      className={className}
    >
      {children}
    </Comp>
  );
};

const AnimatedNumber = ({ value, duration = 1.6, format = (n: number) => Math.round(n).toLocaleString("pt-BR") }: { value: number; duration?: number; format?: (n: number) => string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, { duration, ease: EASE as any });
    const unsub = mv.on("change", (v) => setDisplay(format(v)));
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, value, duration, format, mv]);

  return <span ref={ref}>{display}</span>;
};

/* ---------- Page ---------- */

const Landing = () => {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Parallax for hero blobs
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);

  // Mouse-follow glow
  const mx = useMotionValue(50);
  const my = useMotionValue(20);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    supabase.functions
      .invoke("discord-config")
      .then(({ data }) => {
        if (data?.client_id) setClientId(data.client_id);
      })
      .catch(() => {});
  }, []);

  const connectDiscord = () => {
    if (!clientId) {
      toast.error("Carregando configuração... tenta de novo em 2s");
      return;
    }
    setBusy(true);
    const state = btoa(
      JSON.stringify({ origin: window.location.origin, redirect: "/app", nonce: crypto.randomUUID() }),
    );
    const redirectUri = encodeURIComponent(`${SUPABASE_URL}/functions/v1/discord-oauth-callback`);
    const scope = encodeURIComponent("identify email guilds");
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">
      {/* HEADER */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60"
      >
        <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.div
              whileHover={{ rotate: -8, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center shrink-0 shadow-lg shadow-primary/30"
            >
              <Rocket className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </motion.div>
            <span className="font-display font-black text-base md:text-lg tracking-normal truncate">
              SERVER<span className="text-primary">BOOST</span>
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={connectDiscord}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 h-9 px-3 md:px-5 rounded-lg bg-primary text-primary-foreground font-black text-[11px] md:text-sm uppercase tracking-normal hover:bg-primary/90 disabled:opacity-50 shrink-0 shadow-lg shadow-primary/30"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            <span className="hidden sm:inline">Entrar agora</span>
            <span className="sm:hidden">Entrar</span>
          </motion.button>
        </div>
      </motion.header>

      <main>
        {/* HERO */}
        <section
          ref={heroRef}
          onMouseMove={handleMouseMove}
          className="relative border-b border-border bg-background overflow-hidden"
        >
          {/* Animated background */}
          <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 pointer-events-none">
            {/* Grid */}
            <div
              className="absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
              }}
            />
            {/* Mouse glow */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: useTransform(
                  [sx, sy],
                  ([x, y]: any) =>
                    `radial-gradient(600px circle at ${x}% ${y}%, hsl(var(--primary) / 0.18), transparent 40%)`,
                ),
              }}
            />
            {/* Floating blobs */}
            <motion.div
              style={{ y: blobY1 }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/30 blur-[120px]"
            />
            <motion.div
              style={{ y: blobY2 }}
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-40 -right-24 h-[380px] w-[380px] rounded-full bg-success/20 blur-[120px]"
            />
          </motion.div>

          {/* Linha de luz no topo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-[80%] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-[60%] bg-gradient-to-b from-primary/15 to-transparent blur-2xl pointer-events-none" />

          <div className="container mx-auto px-4 py-14 md:py-28 relative">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 backdrop-blur px-3 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-wider text-primary mb-6"
              >
                <motion.span
                  animate={{ rotate: [0, 14, -8, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Flame className="h-3.5 w-3.5" />
                </motion.span>
                A primeira plataforma de ads pra Discord
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              </motion.div>

              <motion.h1
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                }}
                className="font-display text-[2.6rem] sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.9] tracking-tight mb-6"
              >
                <motion.span variants={fadeUp} className="block">
                  Se o Facebook tem Ads,
                </motion.span>
                <motion.span variants={fadeUp} className="block">
                  o{" "}
                  <span className="relative inline-block">
                    <span className="text-primary">Discord</span>
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.9, ease: EASE as any }}
                      className="absolute left-0 -bottom-1 h-[6px] md:h-[10px] w-full bg-primary/30 origin-left rounded-full"
                    />
                  </span>{" "}
                  agora também.
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="text-base md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed"
              >
                Pare de torrar grana em tráfego que ninguém vê.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-base md:text-xl text-foreground/90 max-w-3xl mx-auto mb-10 leading-relaxed font-semibold"
              >
                A gente coloca seu servidor na <span className="text-primary">DM de gente real</span>, com campanha,
                métrica e controle de saldo — igualzinho Facebook Ads, só que dentro do Discord.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.85 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={connectDiscord}
                  disabled={busy}
                  className="relative w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 md:h-16 px-6 md:px-10 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-black text-sm md:text-base uppercase tracking-wider hover:brightness-110 disabled:opacity-50 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.7)] overflow-hidden group"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" strokeWidth={2.5} />}
                  Lançar minha primeira campanha
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-muted-foreground"
              >
                {["Sem cartão no cadastro", "Saldo liberado na hora", "Cancela quando quiser"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>

              {/* Prova social — avatares + estrelas + contador ao vivo */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.15 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {[
                      "from-primary to-primary-glow",
                      "from-success to-primary",
                      "from-warning to-primary",
                      "from-primary-glow to-success",
                      "from-primary to-warning",
                    ].map((g, i) => (
                      <div
                        key={i}
                        className={`h-8 w-8 rounded-full bg-gradient-to-br ${g} border-2 border-background grid place-items-center text-[10px] font-black text-white shadow-lg`}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-0.5 text-warning">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M10 1.5l2.7 5.5 6.1.9-4.4 4.3 1 6.1L10 15.4l-5.4 2.9 1-6.1L1.2 7.9l6.1-.9L10 1.5z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-[11px] md:text-xs text-muted-foreground font-semibold">
                      <span className="text-foreground font-black">+1.200 donos</span> já usam
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block h-8 w-px bg-border" />

                {/* Ticker DMs ao vivo */}
                <div className="flex items-center gap-2 rounded-full bg-card/70 backdrop-blur border border-border px-3 py-1.5 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  <span className="text-[11px] md:text-xs font-bold tabular-nums">
                    <AnimatedNumber value={47832} duration={2.4} />{" "}
                    <span className="text-muted-foreground font-semibold">DMs entregues hoje</span>
                  </span>
                </div>
              </motion.div>
            </div>

            {/* PAINEL DEMO */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: EASE as any }}
              className="mt-14 md:mt-20 max-w-4xl mx-auto relative"
            >
              {/* Glow under panel */}
              <div className="absolute inset-x-10 -bottom-6 h-20 bg-primary/40 blur-3xl rounded-full" />
              <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-4 md:p-6 shadow-2xl">
                {/* Floating chips */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="hidden md:flex absolute -top-4 -left-4 items-center gap-2 rounded-full bg-card border border-success/40 px-3 py-1.5 text-[10px] font-black uppercase text-success shadow-xl"
                >
                  <Sparkles className="h-3 w-3" /> +12 entradas / min
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="hidden md:flex absolute -top-4 -right-4 items-center gap-2 rounded-full bg-card border border-primary/40 px-3 py-1.5 text-[10px] font-black uppercase text-primary shadow-xl"
                >
                  <Zap className="h-3 w-3" /> DM enviada
                </motion.div>

                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">
                      Campanha ao vivo
                    </p>
                    <p className="text-sm md:text-base font-bold">Boost — Servidor de Trade</p>
                  </div>
                  <span className="rounded-full bg-success/10 text-success border border-success/30 px-3 py-1 text-[10px] font-black uppercase flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                    </span>
                    rodando
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { icon: Users, label: "Saldo", value: 1250, sub: "DMs", subClass: "text-success" },
                    { icon: MousePointerClick, label: "Enviadas", value: 812, sub: "hoje", subClass: "text-muted-foreground" },
                    { icon: TrendingUp, label: "Entradas", value: 184, sub: "no servidor", subClass: "text-muted-foreground", prefix: "+", color: "text-success" },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                      className="rounded-xl border border-border bg-background p-3 md:p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] uppercase text-muted-foreground font-black tracking-wider mb-2">
                        <m.icon className="h-3 w-3 text-primary" /> {m.label}
                      </div>
                      <div className={`font-display text-2xl md:text-4xl font-black ${m.color || (m.label === "Saldo" ? "text-primary" : "")}`}>
                        {m.prefix}<AnimatedNumber value={m.value} />
                      </div>
                      <div className={`text-[10px] mt-1 font-semibold ${m.subClass}`}>{m.sub}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-[10px] uppercase text-muted-foreground font-black tracking-wider">
                      Progresso
                    </span>
                    <span className="text-[10px] text-primary font-black">65%</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "65%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.6, ease: EASE as any, delay: 0.4 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow relative overflow-hidden"
                    >
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* scroll cue */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-muted-foreground font-black"
          >
            ↓ rolar
          </motion.div>
        </section>

        {/* DOR */}
        <section className="py-16 md:py-24 border-b border-border bg-card/40 relative">
          <div className="container mx-auto px-4 max-w-5xl">
            <Reveal className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-wider text-destructive font-black mb-3">A real</div>
              <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
                Você já tentou de tudo.
                <br className="hidden sm:block" /> E nada move o servidor.
              </h2>
            </Reveal>
            <div className="grid sm:grid-cols-3 gap-3 md:gap-4">
              {[
                "Pagou bot de divulgação e ninguém entrou.",
                "Trocou divulgação em grupo e só apareceu fake.",
                "Rodou anúncio fora do Discord e o público não converte.",
              ].map((p, i) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5 transition-colors hover:border-destructive/40"
                >
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base text-foreground/90 leading-relaxed">{p}</p>
                </motion.div>
              ))}
            </div>
            <Reveal delay={3} className="text-center mt-10 text-base md:text-xl text-muted-foreground max-w-3xl mx-auto">
              O problema não é seu servidor. <span className="text-foreground font-bold">É o canal.</span> Sua audiência
              tá no Discord — e até hoje ninguém montou um sistema sério pra falar com ela.
            </Reveal>
          </div>
        </section>

        {/* SOLUÇÃO */}
        <section className="py-16 md:py-24 border-b border-border relative overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl pointer-events-none"
          />
          <div className="container mx-auto px-4 max-w-6xl relative">
            <Reveal className="text-center mb-12 md:mb-16">
              <div className="text-xs uppercase tracking-wider text-primary font-black mb-3">A virada</div>
              <h2 className="font-display text-3xl md:text-6xl font-black leading-[0.95] max-w-4xl mx-auto">
                Tráfego pago. Mas dentro do <span className="text-primary">Discord</span>.
              </h2>
              <p className="mt-5 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Único sistema do mercado que entrega mensagem direta pra usuário real, com controle igual gerenciador
                de anúncios.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-4 md:gap-5">
              {[
                {
                  icon: Crosshair,
                  title: "Mira certa",
                  desc: "Sua mensagem chega no privado de quem realmente usa Discord — não em fake, não em bot.",
                },
                {
                  icon: Megaphone,
                  title: "Volume de verdade",
                  desc: "Dispare centenas ou milhares de DMs por campanha. Você define o tamanho do tiro.",
                },
                {
                  icon: BarChart3,
                  title: "Métrica no painel",
                  desc: "Saldo, enviadas, progresso e resultado. Igual gerenciador de Ads, sem planilha.",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.12 }}
                  whileHover={{ y: -6 }}
                  className="group rounded-2xl border border-border bg-card p-6 md:p-7 hover:border-primary/50 transition-colors relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <motion.div
                    whileHover={{ rotate: -8, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 260 }}
                    className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center mb-5 shadow-lg shadow-primary/30"
                  >
                    <f.icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                  <h3 className="font-display text-xl md:text-2xl font-black mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARATIVO */}
        <section className="py-16 md:py-24 border-b border-border bg-card/40">
          <div className="container mx-auto px-4 max-w-5xl">
            <Reveal className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-wider text-primary font-black mb-3">Compara aí</div>
              <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
                Mesmo poder do Facebook Ads.
                <br className="hidden sm:block" /> Outro território.
              </h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6 }}
                className="rounded-2xl border border-border bg-background p-6 md:p-7"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-black mb-3">
                  Facebook Ads
                </div>
                <div className="font-display text-2xl font-black mb-5">Anuncia no feed</div>
                <ul className="space-y-3 text-sm md:text-base">
                  {[
                    "Campanha por gerenciador",
                    "Segmentação de público",
                    "Métricas em tempo real",
                    "Saldo gerenciado por conta",
                  ].map((i) => (
                    <li key={i} className="flex items-center gap-2 text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="rounded-2xl border-2 border-primary bg-primary/5 p-6 md:p-7 relative shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.4)]"
              >
                <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/40">
                  ServerBoost
                </span>
                <div className="text-[10px] uppercase tracking-wider text-primary font-black mb-3">Discord Ads</div>
                <div className="font-display text-2xl font-black mb-5">Entrega na DM</div>
                <ul className="space-y-3 text-sm md:text-base">
                  {[
                    "Campanha por painel próprio",
                    "Mensagem direta em quem importa",
                    "Saldo, envios e cliques no dashboard",
                    "Recarga instantânea no plano",
                  ].map((i, idx) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.3 + idx * 0.08 }}
                      className="flex items-center gap-2 text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />{" "}
                      <span className="font-semibold">{i}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="py-16 md:py-24 border-b border-border">
          <div className="container mx-auto px-4 max-w-5xl">
            <Reveal className="text-center mb-10 md:mb-14">
              <div className="text-xs uppercase tracking-wider text-primary font-black mb-3">Como funciona</div>
              <h2 className="font-display text-3xl md:text-5xl font-black">3 passos. Tudo pelo painel.</h2>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-4 md:gap-5 relative">
              {/* connector line */}
              <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              {[
                { icon: DiscordIcon, title: "Conecta", desc: "Login com Discord, escolhe o servidor que vai receber tráfego." },
                { icon: Zap, title: "Carrega o saldo", desc: "Compra um plano, suas DMs caem na conta na hora." },
                { icon: Target, title: "Dispara a campanha", desc: "Escreve a mensagem, define quantidade e acompanha o resultado." },
              ].map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="relative rounded-2xl border border-border bg-card p-6 md:p-7 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <motion.div
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/30 grid place-items-center"
                    >
                      <s.icon className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div className="text-[10px] uppercase text-muted-foreground font-black tracking-wider">
                      Passo 0{i + 1}
                    </div>
                  </div>
                  <h3 className="font-display text-xl font-black mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* RAREZA */}
        <section className="py-16 md:py-24 border-b border-border bg-card/40">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Reveal>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block"
              >
                <Lock className="h-10 w-10 text-primary mx-auto mb-5" />
              </motion.div>
              <h2 className="font-display text-3xl md:text-5xl font-black leading-tight mb-5">
                Esse sistema não existe em mais lugar nenhum.
              </h2>
              <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
                Discord Ads é raro. Quem entra agora pega o canal limpo, audiência fria e custo baixo — antes do
                mercado descobrir.
              </p>
            </Reveal>

            <div className="grid sm:grid-cols-3 gap-3 mt-10">
              {[
                { icon: Zap, label: "Plataforma 24h no ar" },
                { icon: ShieldCheck, label: "Saldo separado por conta" },
                { icon: Flame, label: "Único no mercado" },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -3, borderColor: "hsl(var(--primary))" }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-4"
                >
                  <c.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground/80 text-left">{c.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-16 md:py-28 relative overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none"
          />
          <div className="container mx-auto px-4 max-w-4xl text-center relative">
            <Reveal>
              <h2 className="font-display text-3xl md:text-6xl font-black leading-[0.95] mb-5">
                Enquanto você lê, alguém tá lançando ads pra{" "}
                <span className="text-primary">sua audiência</span>.
              </h2>
              <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Conecta o Discord, escolhe o plano e dispara a primeira campanha em minutos.
              </p>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={connectDiscord}
                disabled={busy}
                className="relative w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 md:h-16 px-6 md:px-10 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-black text-sm md:text-base uppercase tracking-wider hover:brightness-110 disabled:opacity-50 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.7)] overflow-hidden group"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <DiscordIcon className="h-6 w-6" />}
                Quero meu Discord Ads
                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                  <ArrowRight className="h-6 w-6" />
                </motion.span>
              </motion.button>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center md:text-left">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="font-display font-black tracking-normal">
              SERVER<span className="text-primary">BOOST</span>
            </span>
          </div>
          <span>© {new Date().getFullYear()} ServerBoost — Discord Ads. Todos os direitos reservados.</span>
        </div>
      </footer>

      <SupportFab />
    </div>
  );
};

export default Landing;
