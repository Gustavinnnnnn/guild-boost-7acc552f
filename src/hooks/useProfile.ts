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
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setProfile(null); setIsAdmin(false); setLoading(false); return; }
    const [{ data }, { data: roles }] = await Promise.all([
      supabase.from("profiles")
        .select("id, username, avatar_url, discord_id, discord_username, discord_access_token, credits")
        .eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    setProfile(data as Profile | null);
    setIsAdmin((roles ?? []).some((r: any) => r.role === "admin"));
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { profile, loading, refresh, isAdmin, isDiscordConnected: !!profile?.discord_id };
};
