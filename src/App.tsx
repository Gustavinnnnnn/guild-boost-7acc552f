import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import AdminLogin from "./pages/AdminLogin";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/app/Dashboard";
import Campaigns from "./pages/app/Campaigns";
import NewCampaign from "./pages/app/NewCampaign";
import Credits from "./pages/app/Credits";
import Affiliate from "./pages/app/Affiliate";
import MyServers from "./pages/app/MyServers";
import MyBot from "./pages/app/MyBot";
import MyAccount from "./pages/app/MyAccount";
import HowToGetToken from "./pages/app/HowToGetToken";
import Help from "./pages/app/Help";
import Admin from "./pages/app/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminOnly from "./components/AdminOnly";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="campanhas" element={<Campaigns />} />
            <Route path="campanhas/nova" element={<NewCampaign />} />
            <Route path="campanhas/:id/editar" element={<NewCampaign />} />
            <Route path="creditos" element={<Credits />} />
            <Route path="servidores" element={<MyServers />} />
            <Route path="meu-bot" element={<MyBot />} />
            <Route path="minha-conta" element={<MyAccount />} />
            <Route path="minha-conta/como-pegar-token" element={<HowToGetToken />} />
            <Route path="afiliados" element={<Affiliate />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
