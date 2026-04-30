import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DiscordIcon } from "@/components/DiscordIcon";
import { SupportFab } from "@/components/SupportFab";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Check,
  Zap,
  Target,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Users,
  Plus,
  Activity,
  Cpu,
  Radio,
  Sparkles,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [clientId, setClientId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [liveCount, setLiveCount] = useState(2_184_337);

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      try {
        localStorage.setItem("aff_ref", ref);
        fetch(`${SUPABASE_URL}/functions/v1/track-referral`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: ref, action: "click" }),
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }, [params]);

  useEffect(() => {
    supabase.functions
      .invoke("discord-config")
      .then(({ data }) => {
        if (data?.client_id) setClientId(data.client_id);
      })
      .catch(() => {});
  }, []);

  // Counter animado — sensação de "live"
  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount((c) => c + Math.floor(Math.random() * 4) + 1);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const loginWithDiscord = () => {
    if (user) return navigate("/app");
    if (!clientId) return toast.error("Configuração do Discord não carregada");
    setBusy(true);
    const state = btoa(
      JSON.stringify({ origin: window.location.origin, nonce: crypto.randomUUID() }),
    );
    const redirectUri = encodeURIComponent(`${SUPABASE_URL}/functions/v1/discord-oauth-callback`);
    const scope = encodeURIComponent("identify email guilds");
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      {/* Top status strip — vibe tech */}
      <div className="hidden md:flex items-center justify-center gap-6 h-8 text-[11px] font-mono bg-[#0a0a0c] border-b border-border/40 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-success">SYSTEM ONLINE</span>
        </span>
        <span className="opacity-40">·</span>
        <span>uptime <span className="text-foreground">99.97%</span></span>
        <span className="opacity-40">·</span>
        <span>latency <span className="text-foreground">42ms</span></span>
        <span className="opacity-40">·</span>
        <span>queue <span className="text-foreground tabular-nums">{(liveCount % 9000 + 1000).toLocaleString("pt-BR")}</span></span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-lg group-hover:bg-primary/60 transition-all" />
              <img
                src={logo}
                alt="ServerBoost"
                className="relative h-9 w-9 rounded-xl object-cover ring-1 ring-primary/30"
                width={36}
                height={36}
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight">ServerBoost</span>
              <span className="text-[9px] font-mono text-muted-foreground tracking-[0.2em] uppercase mt-0.5">
                v2.0 · live
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {[
              { id: "como", label: "Como funciona" },
              { id: "preco", label: "Preço" },
              { id: "afiliado", label: "Afiliados" },
              { id: "faq", label: "FAQ" },
            ].map((n) => (
              <button
                key={n.id}
                onClick={() => scrollTo(n.id)}
                className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <button
            onClick={loginWithDiscord}
            disabled={busy}
            className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-glow text-primary-foreground px-4 md:px-5 h-10 rounded-full text-sm font-semibold transition-all disabled:opacity-60 shadow-glow hover:scale-[1.03]"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <DiscordIcon className="h-4 w-4" />
                <span>{user ? "Entrar no painel" : "Entrar"}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Backgrounds tech */}
        <div className="absolute inset-0 -z-10 bg-background" />
        <div className="absolute -z-10 top-[-15%] left-1/2 -translate-x-1/2 h-[700px] w-[1100px] rounded-full bg-primary/30 blur-[140px]" />
        <div className="absolute -z-10 top-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#9b6bff]/25 blur-[120px]" />
        <div className="absolute -z-10 bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#5865F2]/20 blur-[120px]" />
        {/* Grid */}
        <div className="absolute inset-0 -z-10 opacity-[0.06] pointer-events-none [background-image:linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        {/* Scanline */}
        <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.03] [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,hsl(var(--foreground))_2px,hsl(var(--foreground))_3px)]" />

        <div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-24 pb-20 md:pb-28">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
            {/* LEFT: copy */}
            <div className="text-center lg:text-left">
              {/* Badge live */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur text-xs font-medium mb-7">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span className="font-mono text-foreground tabular-nums">{liveCount.toLocaleString("pt-BR")}</span>
                <span className="text-muted-foreground">DMs entregues</span>
              </div>

              <h1 className="font-display font-bold tracking-tight leading-[1.02] text-[clamp(2.4rem,6vw,4.8rem)]">
                Seu servidor tá vazio porque{" "}
                <span className="relative inline-block">
                  <span className="text-gradient">ninguém sabe</span>
                  <svg className="absolute left-0 -bottom-2 w-full" height="14" viewBox="0 0 300 14" fill="none" preserveAspectRatio="none">
                    <path d="M2 9C60 3 140 3 200 7C240 9.5 270 10 298 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                que ele existe.
              </h1>

              <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A gente coloca o link do seu servidor, loja ou projeto na DM de pessoas reais
                do Discord — dentro do seu nicho. A partir de{" "}
                <span className="text-foreground font-semibold">R$ 0,05 por DM</span>.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-center lg:items-stretch justify-center lg:justify-start gap-3">
                <button
                  onClick={loginWithDiscord}
                  disabled={busy}
                  className="group relative inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-glow text-primary-foreground h-14 px-7 rounded-full font-semibold text-base transition-all disabled:opacity-60 shadow-glow hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5" />}
                  Começar com Discord
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => scrollTo("como")}
                  className="inline-flex items-center justify-center gap-2 h-14 px-6 rounded-full font-semibold text-base text-foreground border border-border hover:bg-card hover:border-primary/40 transition-all"
                >
                  Ver como funciona
                </button>
              </div>

              {/* Trust + métricas inline */}
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                {[
                  { v: "2.1M+", l: "DMs entregues" },
                  { v: "14.7%", l: "CTR médio" },
                  { v: "1.2k+", l: "donos ativos" },
                ].map((s) => (
                  <div key={s.l} className="text-center lg:text-left">
                    <div className="font-display font-bold text-2xl md:text-3xl tracking-tight text-gradient tabular-nums">
                      {s.v}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs text-muted-foreground font-mono">
                ⚡ login em 5s · sem cartão · mínimo R$ 30
              </p>
            </div>

            {/* RIGHT: Terminal/Console mockup */}
            <div className="relative max-w-md mx-auto lg:max-w-none w-full">
              {/* floating stat top */}
              <div className="hidden md:flex absolute -top-4 -left-6 z-10 items-center gap-2.5 rounded-2xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-card animate-fade-in">
                <div className="h-9 w-9 rounded-xl bg-success/15 grid place-items-center">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">novos membros</div>
                  <div className="text-sm font-bold tabular-nums">+847 hoje</div>
                </div>
              </div>

              {/* floating stat bottom */}
              <div className="hidden md:flex absolute -bottom-4 -right-4 z-10 items-center gap-2.5 rounded-2xl border border-border bg-card/95 backdrop-blur px-4 py-3 shadow-card">
                <div className="h-9 w-9 rounded-xl bg-primary/15 grid place-items-center">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">CTR</div>
                  <div className="text-sm font-bold tabular-nums">14,7%</div>
                </div>
              </div>

              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 via-transparent to-[#9b6bff]/40 blur-2xl -z-10" />

              {/* Terminal */}
              <div className="relative rounded-2xl border border-border/80 bg-[#0a0a0c] shadow-2xl overflow-hidden font-mono text-[13px]">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-[#15151a]">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 text-center text-[11px] text-muted-foreground tracking-wider">
                    serverboost@campaign:~ · live
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-success">
                    <Radio className="h-3 w-3 animate-pulse" />
                    REC
                  </div>
                </div>

                {/* Terminal content */}
                <div className="p-5 space-y-2.5 bg-[#0a0a0c] min-h-[400px]">
                  <div className="text-zinc-500">
                    <span className="text-success">$</span> serverboost run --campaign trade-br
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-primary">→</span> targeting <span className="text-foreground">nicho:trading</span> · region:BR
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-primary">→</span> message rendered · <span className="text-success">ok</span>
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-primary">→</span> bot pool: <span className="text-foreground">38 active</span> · throttle:safe
                  </div>

                  <div className="border-t border-border/30 my-3" />

                  <div className="text-[#9b6bff]">
                    [12:34:01] dispatching batch <span className="text-foreground">#1284</span>
                  </div>
                  <div className="text-zinc-300 pl-4">
                    <span className="text-success">✓</span> @user_4827 · DM delivered <span className="text-zinc-500">(89ms)</span>
                  </div>
                  <div className="text-zinc-300 pl-4">
                    <span className="text-success">✓</span> @luna_trades · DM delivered <span className="text-zinc-500">(112ms)</span>
                  </div>
                  <div className="text-zinc-300 pl-4">
                    <span className="text-success">✓</span> @rafa_pump · DM delivered <span className="text-zinc-500">(67ms)</span>
                  </div>
                  <div className="text-zinc-300 pl-4">
                    <span className="text-warning">!</span> @ghost_acct · skipped <span className="text-zinc-500">(inactive)</span>
                  </div>
                  <div className="text-zinc-300 pl-4">
                    <span className="text-success">✓</span> @cryptobr_99 · DM delivered <span className="text-zinc-500">(94ms)</span>
                  </div>
                  <div className="text-zinc-300 pl-4">
                    <span className="text-success">✓</span> @anon_pepe · DM delivered <span className="text-zinc-500">(71ms)</span>
                    <span className="ml-2 text-primary">↗ clicked</span>
                  </div>

                  <div className="border-t border-border/30 my-3" />

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="rounded-lg bg-success/10 border border-success/30 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-success">delivered</div>
                      <div className="text-base font-bold text-foreground tabular-nums mt-0.5">847</div>
                    </div>
                    <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-primary">clicks</div>
                      <div className="text-base font-bold text-foreground tabular-nums mt-0.5">124</div>
                    </div>
                    <div className="rounded-lg bg-[#9b6bff]/10 border border-[#9b6bff]/30 p-2.5">
                      <div className="text-[9px] uppercase tracking-wider text-[#9b6bff]">joined</div>
                      <div className="text-base font-bold text-foreground tabular-nums mt-0.5">61</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-success pt-2">
                    <span>$</span>
                    <span className="inline-block w-2 h-4 bg-success animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOR / problemas — agora com vibe tech, números e terminal-style errors */}
      <section className="relative border-t border-border overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none [background-image:linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-destructive">
                error_log.txt
              </span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
              Você já passou por isso?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Se você marcou pelo menos 2 dessas, a gente resolve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                code: "ERR_001",
                t: "Servidor fantasma",
                d: "Você abriu, montou os canais, configurou tudo. E só você e dois bots aparecem online.",
                metric: "0 online",
              },
              {
                code: "ERR_002",
                t: "Loja sem cliente",
                d: "Produto pronto, link no story, mensagem nos amigos. Mas zero venda no fim do mês.",
                metric: "R$ 0/mês",
              },
              {
                code: "ERR_003",
                t: "Live com 0 viewer",
                d: "Você abre live, nada de chat. Posta clip, ninguém vê. Aí desanima e some por semanas.",
                metric: "0 views",
              },
              {
                code: "ERR_004",
                t: "Grupo VIP vazio",
                d: "Sinais bons, planilha redondinha. Mas só entra parente — e nenhum vira pagante.",
                metric: "0 pagantes",
              },
              {
                code: "ERR_005",
                t: "Conteúdo sem alcance",
                d: "Edita 4h um vídeo, posta. 12 views, 1 like (seu). Sente que tá empurrando água morro acima.",
                metric: "12 views",
              },
              {
                code: "ERR_006",
                t: "Pagou ads e queimou",
                d: "Gastou R$ 300 em Meta Ads pra trazer 3 cadastros. CAC absurdo, retorno zero.",
                metric: "CAC R$ 100",
              },
            ].map((p) => (
              <div
                key={p.code}
                className="group relative rounded-2xl border border-border bg-card p-6 hover:border-destructive/40 hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest bg-destructive/10 text-destructive rounded-bl-lg">
                  {p.code}
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5 rotate-45" />
                </div>
                <h3 className="font-semibold text-lg mb-1.5">{p.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.d}</p>
                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">last:</span>
                  <span className="text-xs font-mono font-bold text-destructive">{p.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA — diagrama animado de pipeline */}
      <section id="como" className="border-t border-border bg-card/30 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 [background-image:radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:32px_32px] opacity-50" />

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                pipeline
              </span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
              Do zero à primeira campanha em <span className="text-gradient">5 minutos</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sem código. Sem bot setup. Sem dor de cabeça.
            </p>
          </div>

          {/* Pipeline visual */}
          <div className="relative">
            {/* linha conectora horizontal — só desktop */}
            <div className="hidden lg:block absolute top-[68px] left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="hidden lg:block absolute top-[68px] left-[8%] right-[8%] h-px bg-gradient-to-r from-primary via-primary-glow to-primary [background-size:200%_100%] animate-[shimmer_3s_linear_infinite]" style={{
              maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
            }} />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
              {[
                {
                  n: "01",
                  icon: DiscordIcon,
                  t: "Conecta",
                  d: "Login com Discord. Sem formulário. 5 segundos.",
                  tag: "auth",
                },
                {
                  n: "02",
                  icon: Target,
                  t: "Define alvo",
                  d: "Nicho, região, tamanho de servidor. A gente já mapeou.",
                  tag: "targeting",
                },
                {
                  n: "03",
                  icon: MessageSquare,
                  t: "Escreve copy",
                  d: "Sua mensagem, seu link. Discord, loja, vídeo, qualquer coisa.",
                  tag: "payload",
                },
                {
                  n: "04",
                  icon: Zap,
                  t: "Dispara",
                  d: "Paga via PIX, créditos caem na hora, bot começa a entregar.",
                  tag: "deploy",
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="relative rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-glow transition-all group"
                >
                  {/* node circle no topo (alinha com a linha) */}
                  <div className="hidden lg:flex absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-primary border-4 border-background items-center justify-center shadow-glow">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.d}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-success" />
                    {s.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas em tempo real depois do pipeline */}
          <div className="mt-12 rounded-2xl border border-border bg-[#0a0a0c] p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Setup
                </div>
                <div className="font-display font-bold text-3xl tracking-tight">5 min</div>
                <div className="text-xs text-muted-foreground mt-1">do login à primeira DM</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  <Activity className="h-3 w-3 text-success" />
                  Entrega
                </div>
                <div className="font-display font-bold text-3xl tracking-tight">98.4%</div>
                <div className="text-xs text-muted-foreground mt-1">taxa de delivery</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  <Target className="h-3 w-3 text-[#9b6bff]" />
                  CTR médio
                </div>
                <div className="font-display font-bold text-3xl tracking-tight">14,7%</div>
                <div className="text-xs text-muted-foreground mt-1">vs 0,9% Meta Ads</div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">
                  <Users className="h-3 w-3 text-warning" />
                  Reais
                </div>
                <div className="font-display font-bold text-3xl tracking-tight">100%</div>
                <div className="text-xs text-muted-foreground mt-1">contas humanas, sem bot</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section id="preco" className="border-t border-border relative overflow-hidden">
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] rounded-full bg-primary/15 blur-[120px]" />

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-5">
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                pricing
              </span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
              <span className="text-gradient">R$ 0,05</span> por DM. Sem mensalidade.
            </h2>
            <p className="mt-5 text-muted-foreground text-base md:text-lg">
              Escolhe o plano, paga via PIX e os créditos caem na hora. Quanto maior, mais bônus.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: 30,
                dms: 600,
                bonus: null,
                sub: "Pra testar",
                features: ["600 DMs entregues", "Dashboard completo", "Suporte via Discord"],
              },
              {
                name: "Plus",
                price: 50,
                dms: 1100,
                bonus: "+100 bônus",
                sub: "Bom custo-benefício",
                features: ["1.000 DMs + 100 bônus", "Segmentação por nicho", "Dashboard completo", "Suporte via Discord"],
              },
              {
                name: "Pro",
                price: 150,
                dms: 3500,
                bonus: "+500 bônus",
                sub: "Mais escolhido",
                highlight: true,
                features: [
                  "3.000 DMs + 500 bônus",
                  "Segmentação por nicho",
                  "Métricas em tempo real",
                  "Suporte prioritário",
                ],
              },
              {
                name: "Business",
                price: 250,
                dms: 6000,
                bonus: "+1.000 bônus",
                sub: "Pra escalar",
                features: [
                  "5.000 DMs + 1.000 bônus",
                  "Segmentação avançada",
                  "Métricas em tempo real",
                  "Suporte VIP no Discord",
                ],
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 md:p-7 transition-all hover:-translate-y-1 ${
                  p.highlight
                    ? "bg-gradient-primary text-primary-foreground shadow-glow lg:scale-[1.04]"
                    : "bg-card border border-border hover:border-primary/40"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                    Mais escolhido
                  </span>
                )}
                <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${p.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {p.sub}
                </div>
                <h3 className="font-display font-bold text-xl">{p.name}</h3>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-4xl tracking-tight">R${p.price}</span>
                  <span className={`text-xs ${p.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    PIX
                  </span>
                </div>

                <div className={`mt-2 text-sm font-semibold flex flex-wrap items-center gap-x-2 gap-y-1 ${p.highlight ? "" : "text-foreground"}`}>
                  <span>{p.dms.toLocaleString("pt-BR")} DMs</span>
                  {p.bonus && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${p.highlight ? "bg-foreground text-background" : "bg-success/15 text-success"}`}>
                      {p.bonus}
                    </span>
                  )}
                </div>
                <div className={`text-[11px] mt-1 ${p.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  ≈ R$ {(p.price / p.dms).toFixed(3).replace(".", ",")} por DM
                </div>

                <div className={`mt-5 h-px ${p.highlight ? "bg-primary-foreground/20" : "bg-border"}`} />

                <ul className="mt-5 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "" : "text-primary"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={loginWithDiscord}
                  disabled={busy}
                  className={`mt-6 w-full h-11 rounded-full font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 ${
                    p.highlight
                      ? "bg-foreground text-background hover:bg-background hover:text-foreground"
                      : "bg-primary text-primary-foreground hover:bg-primary-glow"
                  }`}
                >
                  <DiscordIcon className="h-4 w-4" /> Escolher
                </button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Mínimo R$ 30. Pode comprar qualquer valor acima — sempre R$ 0,05 por DM.
          </p>
        </div>
      </section>

      {/* AFILIADOS */}
      <section
        id="afiliado"
        className="border-t border-border relative overflow-hidden bg-gradient-primary"
      >
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(hsl(var(--primary-foreground))_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28 text-primary-foreground">
          <div className="grid md:grid-cols-12 gap-8 items-center mb-14">
            <div className="md:col-span-7">
              <div className="text-xs font-mono uppercase tracking-widest text-primary-foreground/80 mb-4">
                Programa de afiliados
              </div>
              <h2 className="font-display font-bold text-4xl md:text-5xl leading-tight tracking-tight">
                Indica e ganha 20% pra sempre.
              </h2>
              <p className="mt-5 text-lg text-primary-foreground/90 max-w-xl leading-relaxed">
                Compartilha teu link. Cada pessoa que entrar e comprar, você fica com 20% da grana —
                em todas as compras dela, pelo resto da vida. Saca via PIX a partir de R$ 50.
              </p>
              <button
                onClick={loginWithDiscord}
                className="mt-7 inline-flex items-center gap-2 bg-foreground text-background hover:bg-background hover:text-foreground transition-colors px-6 h-12 rounded-full text-sm font-semibold"
              >
                <DiscordIcon className="h-4 w-4" /> Virar afiliado
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="md:col-span-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: "20%", l: "Comissão" },
                  { v: "Vitalício", l: "Pra sempre" },
                  { v: "R$ 50", l: "Saque mínimo" },
                  { v: "PIX", l: "Pagamento" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="rounded-2xl bg-primary-foreground/10 backdrop-blur border border-primary-foreground/20 p-5"
                  >
                    <div className="font-display font-bold text-3xl tracking-tight">{s.v}</div>
                    <div className="text-xs font-mono uppercase tracking-widest text-primary-foreground/70 mt-1.5">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center mb-12">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-4">
              FAQ
            </div>
            <h2 className="font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Isso aqui é spam?",
                a: "Não. As DMs vão pra contas reais, em volume controlado, com a mensagem que você escreve. Nada de bot fake mandando em massa — por isso a entrega tem qualidade.",
              },
              {
                q: "Quanto custa exatamente cada DM?",
                a: "R$ 0,05 por DM. Plano Starter: R$ 30 = 600 DMs. Plus: R$ 50 = 1.100 DMs (com bônus). Pro: R$ 150 = 3.500 DMs (com bônus). Business: R$ 250 = 6.000 DMs (com bônus). Quanto maior o plano, mais bônus.",
              },
              {
                q: "Em quanto tempo a campanha começa?",
                a: "Assim que o PIX é confirmado, sua campanha entra na fila. Geralmente começa a entregar em poucos minutos.",
              },
              {
                q: "Posso divulgar loja, vídeo, qualquer link?",
                a: "Pode. Discord, loja, infoproduto, vídeo do YouTube, lançamento, grupo de trade. Qualquer link válido. Você escreve a copy do jeito que quiser.",
              },
              {
                q: "Tem mensalidade ou plano fixo?",
                a: "Não. Você compra créditos quando quer e usa quando quer. Sem assinatura, sem renovação automática.",
              },
              {
                q: "E se sobrar crédito?",
                a: "Créditos não usados ficam na sua conta pra sempre. Pra qualquer dúvida, fala direto com o suporte pelo Discord.",
              },
            ].map((f, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border bg-card hover:border-primary/40 transition-colors [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none p-5">
                  <span className="font-semibold text-base md:text-lg pr-4">{f.q}</span>
                  <span className="h-8 w-8 rounded-full bg-secondary text-foreground grid place-items-center shrink-0 group-open:rotate-45 transition-transform">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm md:text-base text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-20 md:py-28 text-center">
          <div className="rounded-3xl bg-gradient-primary p-10 md:p-16 shadow-glow relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,hsl(var(--primary-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary-foreground))_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative">
              <ShieldCheck className="h-12 w-12 text-primary-foreground mx-auto mb-6" />
              <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight text-primary-foreground leading-tight">
                Para de gritar pro vazio.
              </h2>
              <p className="mt-5 text-base md:text-lg text-primary-foreground/90 max-w-xl mx-auto">
                Em 5 minutos, sua primeira campanha tá no ar e gente real começa a chegar no teu link.
              </p>
              <button
                onClick={loginWithDiscord}
                disabled={busy}
                className="group mt-8 inline-flex items-center gap-3 bg-foreground text-background hover:bg-background hover:text-foreground h-14 px-8 rounded-full font-semibold text-base transition-colors disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <DiscordIcon className="h-5 w-5" />
                )}
                Começar agora com Discord
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="mt-4 text-xs text-primary-foreground/70">
                Login em 5s · Sem cartão · Mínimo R$ 30
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="ServerBoost" className="h-8 w-8 rounded-lg object-cover" width={32} height={32} />
            <span className="font-bold">ServerBoost</span>
            <span className="text-muted-foreground font-mono text-xs ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-muted-foreground text-xs uppercase tracking-widest font-mono">
            <button onClick={() => scrollTo("como")} className="hover:text-foreground">
              Como funciona
            </button>
            <button onClick={() => scrollTo("preco")} className="hover:text-foreground">
              Preço
            </button>
            <button onClick={() => scrollTo("afiliado")} className="hover:text-foreground">
              Afiliados
            </button>
            <button onClick={() => scrollTo("faq")} className="hover:text-foreground">
              FAQ
            </button>
          </div>
        </div>
      </footer>
      <SupportFab />
    </div>
  );
};

export default Landing;
