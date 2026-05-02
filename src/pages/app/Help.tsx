import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  HelpCircle, Bot, Megaphone, MessageCircle, Server, Zap, ShieldCheck,
  KeyRound, Sparkles, ArrowRight, AlertTriangle,
} from "lucide-react";

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-8">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-widest font-black mb-3">
            <Sparkles className="h-3 w-3" /> Central de ajuda
          </div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <HelpCircle className="h-7 w-7 text-primary" /> Como funciona o CoinsDM
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Tudo que você precisa pra divulgar seu servidor: comprar DMs, conectar seu bot e disparar.
          </p>
        </div>
      </div>

      {/* O QUE É */}
      <Card className="p-6">
        <h2 className="text-lg font-black flex items-center gap-2 mb-3">
          <MessageCircle className="h-5 w-5 text-primary" /> O que é "DM" e como funciona?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          DM é uma <strong>mensagem direta no Discord</strong>. Você compra um pacote de DMs,
          escolhe um público (jogos FPS, lojas, anime, etc.) e a gente dispara seu anúncio
          direto no privado das pessoas certas. Cada DM entregue conta como uma do seu saldo.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <Step n={1} title="Compre DMs" desc="3 planos a partir de R$ 9,90 — pague PIX e o saldo cai na hora." />
          <Step n={2} title="Crie a campanha" desc="Escolha o público, escreva a mensagem, capriche no botão." />
          <Step n={3} title="Dispare" desc="A gente entrega no privado dos membros e mostra métricas." />
        </div>
      </Card>

      {/* MEU BOT */}
      <Card className="p-6">
        <h2 className="text-lg font-black flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-primary" /> "Meu Bot" — divulgação no SEU servidor
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Diferente dos planos de DM (que mandam pro nosso público), o <strong>"Meu Bot"</strong> é
          quando você quer divulgar <strong>dentro do seu próprio servidor</strong>: você conecta o
          token do <strong>seu</strong> bot Discord, escolhe SEU servidor e ele manda DM pra todos os
          membros que estão lá. Pagamento único de R$ 10 (vitalício).
        </p>

        <div className="rounded-xl border border-border bg-background/40 p-4 mt-4 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Como pegar o token do seu bot
          </h3>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Acesse <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-primary underline">discord.com/developers/applications</a></li>
            <li>Crie uma aplicação → menu <strong>Bot</strong> → clique em <strong>Reset Token</strong> e copie</li>
            <li>Em <strong>Privileged Gateway Intents</strong>, ative <strong className="text-warning">SERVER MEMBERS INTENT</strong></li>
            <li>Convide o bot pro seu servidor com permissão de enviar mensagens</li>
            <li>Cole o token na página <Link to="/app/meu-bot" className="text-primary font-semibold underline">Meu Bot</Link></li>
          </ol>
        </div>

        <Link to="/app/meu-bot" className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-primary hover:underline">
          Ir pra Meu Bot <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      {/* CAMPANHAS */}
      <Card className="p-6">
        <h2 className="text-lg font-black flex items-center gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-primary" /> Como funciona uma campanha de DM
        </h2>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
          <li><strong>Escolha o público</strong> (jogos, lojas, comunidades…) — quanto mais nichado, melhor a conversão.</li>
          <li><strong>Escreva a mensagem</strong> curta e direta. Coloque imagem se quiser chamar atenção.</li>
          <li><strong>Adicione um botão</strong> com link pro seu servidor (use o convite do Discord).</li>
          <li><strong>Confira o custo</strong>: cada DM entregue vale 1 do seu saldo.</li>
          <li><strong>Dispare</strong> — a gente entrega aos poucos pra não cair em rate limit.</li>
          <li><strong>Acompanhe</strong> entregas, cliques e taxa de conversão na dashboard.</li>
        </ol>
        <Link to="/app/campanhas/nova" className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-primary hover:underline">
          Criar campanha <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      {/* COMPRAR DMs */}
      <Card className="p-6">
        <h2 className="text-lg font-black flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-primary" /> Pacotes de DMs
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Pack name="Básico" price="R$ 9,90" dms="100 DMs" />
          <Pack name="PRO" price="R$ 29,90" dms="350 DMs" highlight />
          <Pack name="Elite" price="R$ 49,90" dms="700 DMs" />
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Pagamento via PIX. Saldo cai na hora após confirmação. DMs não expiram.
        </p>
        <Link to="/app/creditos" className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-primary hover:underline">
          Ver planos <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      {/* AVISOS */}
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Boas práticas</AlertTitle>
        <AlertDescription className="text-sm space-y-1.5 mt-2">
          <p>• Mensagens curtas + imagem chamativa = mais cliques.</p>
          <p>• Use convite permanente do Discord (Server Settings → Invites).</p>
          <p>• Teste com o público nichado antes de gastar tudo num só plano.</p>
        </AlertDescription>
      </Alert>

      <Alert variant="destructive" className="border-destructive/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Não dê seu token de bot pra ninguém</AlertTitle>
        <AlertDescription className="text-sm">
          O token salvo em <strong>Meu Bot</strong> fica criptografado e só é usado pelo seu próprio bot.
          NUNCA mande seu token em chat, fórum ou DM pra outras pessoas.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground grid place-items-center text-sm font-black mb-2">
        {n}
      </div>
      <div className="font-bold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
    </div>
  );
}

function Pack({ name, price, dms, highlight }: { name: string; price: string; dms: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-primary bg-primary/10" : "border-border bg-background/40"}`}>
      <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{name}</div>
      <div className={`text-xl font-black mt-1 ${highlight ? "text-primary" : ""}`}>{price}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{dms}</div>
    </div>
  );
}
