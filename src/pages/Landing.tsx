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
  Target,
  ShieldCheck,
  MessageSquare,
  Users,
  Plus,
  Send,
  MousePointerClick,
  WalletCards,
  Flame,
  Crown,
  BarChart3,
  Megaphone,
  Sparkles,
} from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const plans = [
  {
    name: "Start",
    price: 30,
    dms: 150,
    hook: "teste sem arriscar alto",
    features: ["150 DMs segmentadas", "PIX com liberação automática", "Painel de campanha", "Suporte no Discord"],
  },
  {
    name: "Scale",
    price: 50,
    dms: 275,
    hook: "mais volume no primeiro disparo",
    badge: "+25 DMs bônus",
    features: ["250 DMs + 25 bônus", "Segmentação por nicho", "Métricas no painel", "Suporte no Discord"],
  },
  {
    name: "Dominação",
    price: 150,
    dms: 900,
    hook: "o plano que mais compensa",
    badge: "+150 DMs bônus",
    highlight: true,
    features: ["750 DMs + 150 bônus", "Campanhas maiores", "Métricas em tempo real", "Suporte prioritário"],
  },
  {
    name: "Autoridade",
    price: 250,
    dms: 1700,
    hook: "para lançar pesado",
    badge: "+450 DMs bônus",
    features: ["1.250 DMs + 450 bônus", "Segmentação avançada", "Mais alcance por compra", "Suporte VIP"],
  },
];

const proofStats = [
  { value: "R$30", label: "entrada mínima" },
  { value: "150", label: "DMs no start" },
  { value: "PIX", label: "crédito rápido" },
  { value: "0", label: "mensalidade" },
];

const objections = [
  "Post no Instagram passa batido.",
  "Servidor vazio quebra confiança.",
  "Tráfego pago fica caro rápido.",
  "Divulgação genérica atrai curioso, não comprador.",
];

const outcomes = [
  {
    icon: Target,
    title: "A pessoa certa recebe o convite",
    text: "Você mira por nicho e interesse para não queimar crédito com público aleatório.",
  },
  {
    icon: MessageSquare,
    title: "A oferta chega direto na DM",
    text: "Nada de esperar algoritmo ajudar. Sua chamada vai para uma conversa privada.",
  },
  {
    icon: BarChart3,
    title: "Você acompanha o que importa",
    text: "Créditos, campanhas e entrega ficam visíveis no painel depois do login.",
  },
];

const faqs = [
  {
    q: "Preciso pagar mensalidade?",
    a: "Não. Você compra créditos, usa quando quiser e volta só quando quiser mais volume.",
  },
  {
    q: "O mínimo continua quanto?",
    a: "O plano de entrada é R$30 com 150 DMs. Os planos maiores têm bônus de volume.",
  },
  {
    q: "Quando os créditos caem?",
    a: "Depois da confirmação do PIX, os créditos entram automaticamente para você criar a campanha.",
  },
  {
    q: "Serve só para servidor Discord?",
    a: "Funciona muito bem para servidor, comunidade, grupo VIP, loja, lançamento e link de oferta.",
  },
];

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

  useEffect(() => {
    const id = setInterval(() => {
      setLiveCount((count) => count + Math.floor(Math.random() * 4) + 1);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const loginWithDiscord = () => {
    if (user) return navigate("/app");
    if (!clientId) return toast.error("Configuração do Discord não carregada");
    setBusy(true);
    const state = btoa(JSON.stringify({ origin: window.location.origin, nonce: crypto.randomUUID() }));
    const redirectUri = encodeURIComponent(`${SUPABASE_URL}/functions/v1/discord-oauth-callback`);
    const scope = encodeURIComponent("identify email guilds");
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&prompt=consent`;
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <a href="#" className="flex min-w-0 items-center gap-3" aria-label="ServerBoost">
            <img src={logo} alt="ServerBoost" className="h-10 w-10 rounded-md object-cover ring-1 ring-border" width={40} height={40} />
            <div className="leading-none">
              <span className="block text-base font-black">ServerBoost</span>
              <span className="mt-1 hidden text-[10px] font-black uppercase text-muted-foreground sm:block">DM segmentada para Discord</span>
            </div>
          </a>

          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {[
              { id: "planos", label: "Planos" },
              { id: "prova", label: "Prova" },
              { id: "faq", label: "Dúvidas" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="rounded-md px-4 py-2 font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            onClick={loginWithDiscord}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-primary-foreground shadow-glow transition-all hover:bg-primary-glow disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <DiscordIcon className="h-4 w-4" />}
            <span>{user ? "Painel" : "Entrar"}</span>
          </button>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden border-b border-border bg-landing-stage">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:py-12">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-black uppercase text-muted-foreground shadow-card">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                {liveCount.toLocaleString("pt-BR")} DMs entregues
              </div>

              <h1 className="font-display text-[clamp(3rem,9vw,7.4rem)] font-black leading-[0.84]">
                Seu Discord não pode parecer vazio.
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-semibold leading-relaxed text-muted-foreground md:text-xl">
                Compre créditos, crie uma campanha e coloque seu convite na DM de gente com interesse real no seu nicho.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={loginWithDiscord}
                  disabled={busy}
                  className="group inline-flex h-14 items-center justify-center gap-3 rounded-md bg-primary px-7 text-base font-black text-primary-foreground shadow-glow transition-all hover:bg-primary-glow disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5" />}
                  Comprar créditos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => scrollTo("planos")}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-md border border-border bg-card px-7 text-base font-black text-foreground transition-colors hover:border-primary hover:bg-secondary"
                >
                  Ver planos
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {proofStats.map((item) => (
                  <div key={item.label} className="border-l border-border pl-3">
                    <div className="font-display text-3xl font-black leading-none">{item.value}</div>
                    <div className="mt-2 text-[10px] font-black uppercase text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[560px] lg:mr-0">
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs font-black uppercase">
                <div className="rounded-md border border-border bg-card p-3 text-muted-foreground">campanha</div>
                <div className="rounded-md border border-primary bg-primary p-3 text-primary-foreground">entrega</div>
                <div className="rounded-md border border-border bg-card p-3 text-muted-foreground">resultado</div>
              </div>

              <div className="overflow-hidden rounded-md border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black">Campanha rodando</div>
                      <div className="text-xs text-muted-foreground">Games • Brasil • convite direto</div>
                    </div>
                  </div>
                  <span className="rounded-md bg-success px-2 py-1 text-[10px] font-black uppercase text-success-foreground">ativa</span>
                </div>

                <div className="grid gap-0 md:grid-cols-[1fr_0.82fr]">
                  <div className="border-b border-border p-4 md:border-b-0 md:border-r">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-muted-foreground">
                      <Send className="h-4 w-4 text-primary" /> prévia da DM
                    </div>
                    <div className="rounded-md bg-background p-4 text-sm font-semibold leading-relaxed text-foreground">
                      Vi que você curte comunidade de games. Abrimos um Discord BR com eventos, call ativa e sorteios semanais.
                      <div className="mt-4 rounded-md border border-primary bg-primary/10 px-3 py-2 font-black text-primary">discord.gg/seulink</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px bg-border md:grid-cols-1">
                    {[
                      { icon: Send, value: "900", label: "DMs" },
                      { icon: MousePointerClick, value: "137", label: "cliques" },
                      { icon: Users, value: "62", label: "entradas" },
                    ].map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div key={metric.label} className="bg-card p-4">
                          <Icon className="mb-3 h-4 w-4 text-primary" />
                          <div className="font-display text-3xl font-black leading-none">{metric.value}</div>
                          <div className="mt-2 text-[10px] font-black uppercase text-muted-foreground">{metric.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border bg-card p-4">
                  <Sparkles className="mb-3 h-5 w-5 text-warning" />
                  <div className="font-black">Sem mensalidade</div>
                  <div className="mt-1 text-xs text-muted-foreground">comprou, usou</div>
                </div>
                <div className="rounded-md border border-border bg-card p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-success" />
                  <div className="font-black">Painel próprio</div>
                  <div className="mt-1 text-xs text-muted-foreground">tudo no login</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/35">
          <div className="mx-auto grid max-w-7xl gap-px bg-border px-0 md:grid-cols-4">
            {objections.map((point) => (
              <div key={point} className="flex items-start gap-3 bg-background p-5 md:p-6">
                <Flame className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <p className="text-sm font-black leading-relaxed text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="planos" className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <div className="mb-3 text-xs font-black uppercase text-primary">Planos sem mensalidade</div>
                <h2 className="font-display text-4xl font-black leading-tight md:text-6xl">Preço simples. Volume que faz sentido.</h2>
              </div>
              <p className="max-w-2xl text-lg font-semibold leading-relaxed text-muted-foreground lg:ml-auto lg:text-right">
                O plano barato valida. Os planos maiores dão bônus para quem quer volume de verdade.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative rounded-md p-5 transition-all hover:-translate-y-1 ${
                    plan.highlight ? "bg-primary text-primary-foreground shadow-glow" : "border border-border bg-card hover:border-primary"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-md bg-foreground px-3 py-1 text-[10px] font-black uppercase text-background">
                      <Crown className="h-3 w-3" /> Mais forte
                    </div>
                  )}
                  <div className={`text-xs font-black uppercase ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{plan.hook}</div>
                  <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="font-display text-5xl font-black leading-none">R${plan.price}</span>
                    <span className={`pb-1 text-xs font-black ${plan.highlight ? "text-primary-foreground/75" : "text-muted-foreground"}`}>PIX</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-black">{plan.dms.toLocaleString("pt-BR")} DMs</span>
                    {plan.badge && (
                      <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${plan.highlight ? "bg-foreground text-background" : "bg-success text-success-foreground"}`}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className={`mt-2 text-xs font-bold ${plan.highlight ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                    ≈ R$ {(plan.price / plan.dms).toFixed(3).replace(".", ",")} por DM
                  </div>

                  <div className={`my-5 h-px ${plan.highlight ? "bg-primary-foreground/20" : "bg-border"}`} />
                  <ul className="space-y-3 text-sm font-semibold">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={loginWithDiscord}
                    disabled={busy}
                    className={`mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-black transition-colors disabled:opacity-60 ${
                      plan.highlight ? "bg-foreground text-background hover:bg-background hover:text-foreground" : "bg-primary text-primary-foreground hover:bg-primary-glow"
                    }`}
                  >
                    <WalletCards className="h-4 w-4" /> Comprar esse
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="prova" className="border-b border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <div className="mb-3 text-xs font-black uppercase text-primary">Por que isso vende melhor</div>
                <h2 className="font-display text-4xl font-black leading-tight md:text-6xl">A oferta não fica esperando o algoritmo.</h2>
                <button
                  onClick={loginWithDiscord}
                  disabled={busy}
                  className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-black text-primary-foreground transition-colors hover:bg-primary-glow disabled:opacity-60"
                >
                  Entrar e criar campanha <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {outcomes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="rounded-md border border-border bg-card p-5">
                      <div className="mb-5 grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-black leading-tight">{item.title}</h3>
                      <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">{item.text}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="afiliado" className="border-b border-border bg-gradient-primary text-primary-foreground">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-3 text-xs font-black uppercase text-primary-foreground/75">Afiliados</div>
              <h2 className="font-display text-4xl font-black leading-tight md:text-6xl">Indique e ganhe 20% por compra.</h2>
              <p className="mt-5 max-w-2xl text-lg font-semibold leading-relaxed text-primary-foreground/85">
                Seu link vira comissão recorrente. Saque via PIX a partir de R$50.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "20%", label: "comissão" },
                { value: "R$50", label: "saque" },
                { value: "PIX", label: "pagamento" },
                { value: "link", label: "próprio" },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur">
                  <div className="font-display text-3xl font-black">{item.value}</div>
                  <div className="mt-2 text-xs font-black uppercase text-primary-foreground/70">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-14 md:px-8 md:py-20">
            <div className="mb-8 text-center">
              <div className="mb-3 text-xs font-black uppercase text-primary">Dúvidas rápidas</div>
              <h2 className="font-display text-4xl font-black md:text-5xl">Antes de comprar</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((item) => (
                <details key={item.q} className="group rounded-md border border-border bg-card transition-colors hover:border-primary [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                    <span className="text-base font-black md:text-lg">{item.q}</span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary transition-transform group-open:rotate-45">
                      <Plus className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="px-5 pb-5 font-semibold leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-card">
          <div className="mx-auto max-w-7xl px-4 py-14 text-center md:px-8 md:py-20">
            <h2 className="mx-auto max-w-4xl font-display text-4xl font-black leading-tight md:text-6xl">
              Coloca seu link na rua hoje.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-semibold leading-relaxed text-muted-foreground">
              Entra com Discord, escolhe o plano e transforma crédito em campanha.
            </p>
            <button
              onClick={loginWithDiscord}
              disabled={busy}
              className="mt-8 inline-flex h-14 items-center justify-center gap-3 rounded-md bg-primary px-8 text-base font-black text-primary-foreground shadow-glow transition-colors hover:bg-primary-glow disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <DiscordIcon className="h-5 w-5" />}
              Comprar créditos agora
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm md:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ServerBoost" className="h-8 w-8 rounded-md object-cover" width={32} height={32} />
            <span className="font-black">ServerBoost</span>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs font-black uppercase text-muted-foreground">
            <button onClick={() => scrollTo("planos")} className="hover:text-foreground">Planos</button>
            <button onClick={() => scrollTo("prova")} className="hover:text-foreground">Prova</button>
            <button onClick={() => scrollTo("faq")} className="hover:text-foreground">Dúvidas</button>
          </div>
        </div>
      </footer>

      <SupportFab />
    </div>
  );
};

export default Landing;
