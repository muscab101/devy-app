-- Insert any auth users that don't have a corresponding public.users record
INSERT INTO public.users (id, email, full_name, is_admin, credits, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', NULL),
  COALESCE((au.raw_user_meta_data->>'is_admin')::boolean, FALSE),
  1000, -- Default starting credits
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;
