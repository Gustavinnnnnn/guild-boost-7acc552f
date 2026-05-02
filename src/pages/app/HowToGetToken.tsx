import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check, AlertTriangle, Monitor, KeyRound } from "lucide-react";

const SCRIPT = `(()=>{try{const mod=webpackChunkdiscord_app.push([[Symbol()],{},e=>e]).c["213919"];const token=mod?.exports?.getToken?.();if(!token||typeof token!=="string")return alert("❌ Token não encontrado.");const html=\`<html><body><p style='font-size:20px;font-weight:bold;'>Seu token está abaixo:</p><div style='padding:10px;background:#f0f0f0;border:1px solid #666;border-radius:5px;'>Token: <span style='color:red;font-weight:bold;font-size:18px;'>\${token}</span></div></body></html>\`;const popup=window.open("","_blank");popup.document.write(html);popup.document.close();}catch(e){alert("Erro ao capturar o token.");}})();`;

export default function HowToGetToken() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SCRIPT);
      setCopied(true);
      toast.success("Script copiado!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não consegui copiar. Selecione e copie manualmente.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/app/admin/selfbot" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          <KeyRound className="h-7 w-7 text-primary" /> Como pegar seu token Discord
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tutorial passo a passo. Leva uns 2 minutos.
        </p>
      </div>

      <Alert variant="destructive" className="border-destructive/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Avisos importantes</AlertTitle>
        <AlertDescription className="space-y-1.5 mt-2">
          <p>• <strong>NUNCA</strong> dê seu token pra outra pessoa, site ou bot. Quem tiver o token tem acesso TOTAL à sua conta.</p>
          <p>• Use sempre uma <strong>conta descartável</strong>, nunca a sua principal — disparar DM em massa pode banir a conta.</p>
          <p>• Se desconfiar que vazou, troque a senha da conta na hora (isso invalida o token).</p>
        </AlertDescription>
      </Alert>

      <Alert>
        <Monitor className="h-4 w-4" />
        <AlertTitle>Precisa de um computador</AlertTitle>
        <AlertDescription>
          Pegar o token só funciona no <strong>navegador desktop</strong> (Chrome, Edge, Firefox, Brave). 
          Pelo celular não dá — Discord não expõe o token no app nem no navegador mobile. 
          Faça uma vez no PC, depois é só colar aqui no painel e usar normalmente do celular.
        </AlertDescription>
      </Alert>

      <Card className="p-6 space-y-5">
        <Step n={1} title="Abra o Discord no navegador">
          Acesse <a href="https://discord.com/app" target="_blank" rel="noreferrer" className="text-primary underline">discord.com/app</a> e faça login com a conta descartável (não com a sua principal!).
        </Step>

        <Step n={2} title="Abra o Console do navegador">
          Aperte <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">F12</kbd> (ou <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Ctrl+Shift+I</kbd>). 
          Vai abrir uma janela. Clique na aba <strong>Console</strong>.
        </Step>

        <Step n={3} title="Libere o Console (Discord bloqueia colar)">
          Discord mostra um aviso vermelho enorme dizendo "STOP!". É proteção contra golpe. 
          Pra liberar, digite <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">allow pasting</code> no Console e aperte Enter. 
          Depois pode colar normalmente.
        </Step>

        <Step n={4} title="Cole o script abaixo e aperte Enter">
          <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
            <pre className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-40">
              {SCRIPT}
            </pre>
          </div>
          <Button onClick={copy} size="sm" className="mt-3" variant={copied ? "secondary" : "discord"}>
            {copied ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar script</>}
          </Button>
        </Step>

        <Step n={5} title="Vai abrir uma aba com seu token">
          O script abre uma janelinha mostrando o token em vermelho. 
          <strong> Copie esse texto inteiro</strong> (geralmente começa com <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">MTI...</code> ou <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono">OD...</code>).
          <br />
          <span className="text-xs text-muted-foreground">
            Bloqueador de pop-up pode atrapalhar — se não abrir nada, libere pop-up pro discord.com e rode de novo.
          </span>
        </Step>

        <Step n={6} title="Volte aqui e cole o token">
          Volte na aba <strong>Minha Conta</strong> e cole o token no campo de conexão. Pronto!
        </Step>
      </Card>

      <div className="flex gap-3">
        <Button asChild variant="premium" size="lg" className="flex-1">
          <Link to="/app/admin/selfbot">Já tenho o token, conectar agora</Link>
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Não deu certo?</AlertTitle>
        <AlertDescription className="text-sm">
          Discord muda o número interno do módulo às vezes (o <code className="px-1 rounded bg-muted text-xs">"213919"</code> do script). 
          Se aparecer "Token não encontrado", aguarde alguns dias até atualizarmos o script, ou procure tutorial atualizado no YouTube buscando por "como pegar token discord 2026".
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center font-black text-sm">
        {n}
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
