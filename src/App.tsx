import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Servers from "./pages/app/Servers";
import CreateCampaign from "./pages/app/CreateCampaign";
import Campaigns from "./pages/app/Campaigns";
import Analytics from "./pages/app/Analytics";
import Wallet from "./pages/app/Wallet";
import Settings from "./pages/app/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="servidores" element={<Servers />} />
            <Route path="criar-campanha" element={<CreateCampaign />} />
            <Route path="campanhas" element={<Campaigns />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="carteira" element={<Wallet />} />
            <Route path="configuracoes" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
