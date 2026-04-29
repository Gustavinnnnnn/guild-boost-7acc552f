import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, Users, BarChart3, Target, Zap, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/DiscordIcon";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span>ServerBoost</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-smooth">Como funciona</a>
            <a href="#beneficios" className="hover:text-foreground transition-smooth">Benefícios</a>
            <a href="#provas" className="hover:text-foreground transition-smooth">Resultados</a>
          </nav>
          <Link to="/auth">
            <Button variant="discord" size="sm" className="gap-2">
              <DiscordIcon className="h-4 w-4" />
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-gradient-hero">
        <div className="container py-24 md:py-36 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 text-sm text-muted-foreground mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Rede inteligente de crescimento para Discord
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.05]"
          >
            Cresça seu servidor do Discord com{" "}
            <span className="text-gradient">membros reais</span> e interessados
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Sem complicação. Sem spam. Apenas crescimento inteligente, com métricas reais e segmentação por nicho.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/auth">
              <Button variant="discord" size="xl" className="gap-2 animate-pulse-glow">
                <DiscordIcon className="h-5 w-5" />
                Começar com Discord
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button variant="outline" size="xl" className="gap-2">
                Ver como funciona <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </motion.div>

          {/* Floating mock dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-sidebar">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <div className="h-3 w-3 rounded-full bg-warning" />
                <div className="h-3 w-3 rounded-full bg-success" />
                <span className="ml-3 text-xs text-muted-foreground">serverboost.app/dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-4 p-6">
                {[
                  { label: "Membros", value: "+12.480", icon: Users },
                  { label: "Cliques", value: "94.2k", icon: Target },
                  { label: "Conversão", value: "18.7%", icon: BarChart3 },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-secondary/50 border border-border p-5 text-left">
                    <s.icon className="h-5 w-5 text-primary mb-3" />
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="h-32 rounded-xl bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent border border-border grid place-items-center text-sm text-muted-foreground">
                  📈 Gráfico de crescimento em tempo real
                </div>
              </div>
            </div>
            <div className="absolute -inset-x-10 -bottom-10 h-40 bg-primary/20 blur-3xl -z-10 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">Como funciona</h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Em 3 passos seu servidor já está recebendo membros qualificados.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", title: "Conecte seu Discord", desc: "Login rápido com OAuth2. Selecione o servidor que quer impulsionar.", icon: DiscordIcon },
            { n: "02", title: "Crie sua campanha", desc: "Defina nicho, público alvo e orçamento. Personalize tudo em segundos.", icon: Target },
            { n: "03", title: "Receba novos membros", desc: "Nosso bot distribui sua campanha para usuários certos. Acompanhe ao vivo.", icon: Users },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl bg-card border border-border p-8 hover:border-primary/50 transition-smooth group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="text-4xl font-bold text-muted-foreground/30">{step.n}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">Tudo o que você precisa para crescer</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Target, title: "Tráfego qualificado", desc: "Apenas usuários interessados no seu nicho." },
            { icon: BarChart3, title: "Métricas reais", desc: "Painel ao vivo com cliques, entradas e conversão." },
            { icon: Zap, title: "Segmentação inteligente", desc: "IA distribui sua campanha para o público certo." },
            { icon: ShieldCheck, title: "Sem spam, sem bots", desc: "Rede curada. Crescimento orgânico e seguro." },
          ].map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl bg-card border border-border p-6 hover:bg-secondary/50 transition-smooth"
            >
              <b.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Prova social */}
      <section id="provas" className="container py-24">
        <div className="rounded-3xl bg-gradient-primary p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
          <div className="relative grid md:grid-cols-3 gap-8 text-primary-foreground">
            <div>
              <div className="text-5xl font-extrabold">10.000+</div>
              <div className="opacity-90 mt-2">Membros entregues</div>
            </div>
            <div>
              <div className="text-5xl font-extrabold">800+</div>
              <div className="opacity-90 mt-2">Servidores crescendo</div>
            </div>
            <div>
              <div className="text-5xl font-extrabold">98%</div>
              <div className="opacity-90 mt-2">Donos satisfeitos</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Pronto para <span className="text-gradient">explodir</span> seu servidor?
          </h2>
          <p className="text-muted-foreground mt-5 max-w-xl mx-auto text-lg">
            Comece gratuitamente. Pague só pelo que usar. Sem mensalidade.
          </p>
          <Link to="/auth" className="inline-block mt-8">
            <Button variant="discord" size="xl" className="gap-2 animate-pulse-glow">
              <Rocket className="h-5 w-5" />
              Começar agora
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
        © 2026 ServerBoost — Crescimento inteligente para Discord.
      </footer>
    </div>
  );
};

export default Landing;
