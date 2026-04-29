import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockUser, walletHistory } from "@/lib/mock-data";
import { toast } from "sonner";

const Wallet = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-2xl bg-gradient-primary p-8 text-primary-foreground shadow-glow relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
        <div className="relative">
          <p className="text-sm opacity-90">Saldo disponível</p>
          <div className="text-5xl font-extrabold mt-2">R$ {mockUser.balance.toFixed(2)}</div>
          <Button
            variant="secondary"
            className="mt-6 gap-2 bg-white text-primary hover:bg-white/90"
            onClick={() => toast.success("Recarga iniciada (simulação)")}
          >
            <Plus className="h-4 w-4" /> Adicionar saldo
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold">Histórico de pagamentos</h2>
        </div>
        <div className="divide-y divide-border">
          {walletHistory.map((t) => (
            <div key={t.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full grid place-items-center ${
                  t.type === "in" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}>
                  {t.type === "in" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.description}</div>
                  <div className="text-xs text-muted-foreground">{t.date}</div>
                </div>
              </div>
              <div className={`font-bold ${t.type === "in" ? "text-success" : "text-destructive"}`}>
                {t.type === "in" ? "+" : ""}R$ {Math.abs(t.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
