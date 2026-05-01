import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_access_token: string | null;
  credits: number;
};

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authLoading) { setLoading(true); return; }
    if (!user) { setProfile(null); setIsAdmin(false); setLoading(false); return; }
    setLoading(true);
    const [{ data }, { data: adminRole }] = await Promise.all([
      supabase.from("profiles")
        .select("id, username, avatar_url, discord_id, discord_username, discord_access_token, credits")
        .eq("id", user.id).maybeSingle(),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
    ]);
    setProfile(data as Profile | null);
    setIsAdmin(adminRole === true);
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { profile, loading, refresh, isAdmin, isDiscordConnected: !!profile?.discord_id };
};
