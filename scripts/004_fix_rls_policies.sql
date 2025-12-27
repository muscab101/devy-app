-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;

-- Create a security definer function to check if user is admin
-- This breaks the infinite recursion by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- Recreate admin policies using the security definer function
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin() = true);

CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  USING (public.is_admin() = true);

-- Also allow admins to delete any project
CREATE POLICY "Admins can delete any project"
  ON public.projects FOR DELETE
  USING (public.is_admin() = true);
