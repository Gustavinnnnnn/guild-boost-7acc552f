import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ImageIcon, Loader2, Send, Save, X, Users, Coins, ExternalLink, Target } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, dmsToCoins } from "@/lib/ads";

const COLORS = ["#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#9B59B6"];

const NewCampaign = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();

  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonLabel, setButtonLabel] = useState("Acessar agora");
  const [buttonUrl, setButtonUrl] = useState("");
  const [color, setColor] = useState("#5865F2");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [targetCount, setTargetCount] = useState(500);
  const [maxReach, setMaxReach] = useState(0);

  // Calcula alcance disponível pra categoria selecionada
  useEffect(() => {
    let q = supabase.from("discord_servers").select("member_count, category").eq("bot_in_server", true);
    q.then(({ data }) => {
      const filtered = (data ?? []).filter((s: any) => category === "all" || s.category === category);
      const total = filtered.reduce((s, x: any) => s + (x.member_count || 0), 0);
      setMaxReach(total);
      setTargetCount((c) => Math.min(c, Math.max(10, total)));
    });
  }, [category]);

  const cost = useMemo(() => dmsToCoins(targetCount), [targetCount]);
  const myCoins = profile?.credits ?? 0;
  const maxByCoins = myCoins * 10;
  const sliderMax = Math.max(10, Math.min(maxReach || 10000, maxByCoins || 10000, 100000));

  const uploadImage = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("campaign-images").upload(path, file, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data: pub } = supabase.storage.from("campaign-images").getPublicUrl(path);
    setImageUrl(pub.publicUrl);
    setUploading(false);
    toast.success("Imagem enviada!");
  };

  const validateUrl = (url: string) => { try { new URL(url); return true; } catch { return false; } };

  const save = async (sendNow: boolean) => {
    if (!user || !profile) return;
    if (!name.trim()) return toast.error("Dê um nome interno à campanha");
    if (!title.trim()) return toast.error("Coloque um título");
    if (!message.trim()) return toast.error("Escreva a mensagem");
    if (buttonUrl && !validateUrl(buttonUrl)) return toast.error("URL do botão inválida");
    if (sendNow && myCoins < cost) return toast.error(`Você precisa de ${cost} coins, tem apenas ${myCoins}`);

    setBusy(true);
    const { data, error } = await supabase.from("campaigns").insert({
      user_id: user.id, name, title, message,
      image_url: imageUrl || null, embed_color: color,
      button_label: buttonUrl ? buttonLabel : null,
      button_url: buttonUrl || null,
      target_count: targetCount,
      target_category: category,
      status: "draft",
    }).select().single();

    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Erro"); }

    if (sendNow) {
      const { data: sd, error: se } = await supabase.functions.invoke("send-campaign", { body: { campaign_id: data.id } });
      if (se || sd?.error) { setBusy(false); toast.error("Falha: " + (sd?.error || se?.message)); return; }
      toast.success(`Campanha disparada! Entregue para ${sd.delivered} pessoas.`);
      refreshProfile();
    } else {
      toast.success("Campanha salva como rascunho");
    }
    navigate("/app/campanhas");
  };

  const previewName = profile?.discord_username || "Anúncio";
  const previewAvatar = profile?.avatar_url;
  const cat = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];

  return (
    <div className="grid lg:grid-cols-2 gap-6 max-w-7xl">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save(false); }}>
        {/* PÚBLICO + ORÇAMENTO — coração do Meta Ads */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold"><Target className="h-4 w-4 text-primary" /> Público & orçamento</div>

          <div>
            <Label>Categoria de servidores</Label>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              {CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                  className={`px-2 py-2 rounded-lg text-[11px] font-semibold border transition flex flex-col items-center gap-0.5 ${
                    category === c.value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  }`}>
                  <span className="text-base leading-none">{c.emoji}</span>
                  <span className="leading-tight text-center">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Quantas pessoas alcançar</Label>
              <span className="text-[10px] text-muted-foreground">Disponível: {maxReach.toLocaleString("pt-BR")}</span>
            </div>
            <Input
              type="number" min={10} max={sliderMax} step={10}
              value={targetCount}
              onChange={(e) => setTargetCount(Math.max(10, Math.min(sliderMax, parseInt(e.target.value) || 10)))}
              className="text-2xl font-bold h-14 text-center"
            />
            <Slider min={10} max={sliderMax} step={10} value={[targetCount]} onValueChange={([v]) => setTargetCount(v)} className="mt-3" />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            <div><div className="text-[10px] text-muted-foreground uppercase">Custo</div><div className="font-bold flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-primary" />{cost}</div></div>
            <div><div className="text-[10px] text-muted-foreground uppercase">Saldo</div><div className={`font-bold ${myCoins >= cost ? "" : "text-destructive"}`}>{myCoins}</div></div>
            <div><div className="text-[10px] text-muted-foreground uppercase">Saldo após</div><div className="font-bold">{Math.max(0, myCoins - cost)}</div></div>
          </div>
          <p className="text-[11px] text-muted-foreground">💡 1 coin = 10 DMs. Você só paga pelas DMs efetivamente entregues.</p>
        </div>

        {/* CRIATIVO */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4">
          <div className="text-sm font-bold">Criativo do anúncio</div>
          <div>
            <Label htmlFor="name">Nome interno</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promo de inverno" className="mt-2" maxLength={100} />
          </div>
          <div>
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="🎉 Confira nossa loja!" className="mt-2" maxLength={120} />
          </div>
          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Suporta **negrito**, *itálico*, emojis 🎉" className="mt-2 min-h-[120px]" maxLength={2000} />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/2000</p>
          </div>
          <div>
            <Label>Imagem (opcional)</Label>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {uploading ? "Enviando..." : "Escolher imagem"}
                </div>
              </label>
              {imageUrl && <Button type="button" size="sm" variant="ghost" onClick={() => setImageUrl("")} className="gap-1"><X className="h-3 w-3" /> Remover</Button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bl">Texto do botão</Label>
              <Input id="bl" value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} placeholder="Acessar" className="mt-2" maxLength={80} />
            </div>
            <div>
              <Label htmlFor="bu">URL do botão</Label>
              <Input id="bu" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://..." className="mt-2" />
            </div>
          </div>
          <div>
            <Label>Cor da borda</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-lg border-2 transition ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="secondary" disabled={busy} className="flex-1 gap-2"><Save className="h-4 w-4" /> Rascunho</Button>
          <Button type="button" variant="discord" disabled={busy} onClick={() => save(true)} className="flex-1 gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Disparar agora
          </Button>
        </div>
      </form>

      {/* PREVIEW */}
      <div className="lg:sticky lg:top-8 self-start space-y-3">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 border border-primary/20 p-3 flex items-center justify-around text-center">
          <div><div className="text-[10px] text-muted-foreground uppercase">Público</div><div className="font-bold text-sm flex items-center gap-1">{cat.emoji} {cat.label}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Alvo</div><div className="font-bold text-sm flex items-center gap-1"><Users className="h-3 w-3" />{targetCount.toLocaleString("pt-BR")}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Custo</div><div className="font-bold text-sm flex items-center gap-1"><Coins className="h-3 w-3 text-primary" />{cost}</div></div>
        </div>

        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview da DM no Discord</div>
        <div className="rounded-xl bg-[#313338] border border-[#1e1f22] p-4 shadow-2xl">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#3f4147]">
            <span className="text-[#80848e] text-xs uppercase tracking-wider">Mensagem direta</span>
          </div>
          <div className="flex gap-3">
            {previewAvatar ? (
              <img src={previewAvatar} className="h-10 w-10 rounded-full shrink-0" alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-white font-bold text-sm shrink-0">B</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-white font-semibold text-[15px]">{previewName}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-white text-[10px] font-bold leading-none">APP</span>
                <span className="text-[#949ba4] text-xs">hoje</span>
              </div>
              <div className="mt-1.5 flex">
                <div className="w-1 rounded-l" style={{ backgroundColor: color }} />
                <div className="bg-[#2b2d31] rounded-r p-3 max-w-[440px] flex-1">
                  {title && <div className="text-white font-bold text-base mb-1.5">{title}</div>}
                  <div className="text-[#dbdee1] text-sm whitespace-pre-wrap break-words">
                    {message || <span className="text-[#80848e] italic">Sua mensagem aparecerá aqui...</span>}
                  </div>
                  {imageUrl && <img src={imageUrl} className="mt-2 rounded max-w-full max-h-72 object-contain" alt="" />}
                  {buttonUrl && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#4e5058] hover:bg-[#6d6f78] text-white text-sm font-medium cursor-pointer">
                        <ExternalLink className="h-3.5 w-3.5" /> {buttonLabel || "Acessar"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCampaign;
