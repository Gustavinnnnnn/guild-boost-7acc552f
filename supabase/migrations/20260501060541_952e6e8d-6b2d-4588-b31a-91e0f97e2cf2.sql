REVOKE ALL ON FUNCTION public.bootstrap_admin_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_admin_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin_account() TO authenticated;