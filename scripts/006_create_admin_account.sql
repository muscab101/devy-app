-- Create admin user in Supabase Auth and set admin flag
-- This uses Supabase's auth.users table to create the account

-- First, insert into auth.users (Supabase's internal auth table)
-- Note: You'll need to run this with elevated privileges or use Supabase dashboard
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'muscabmusa27@gmail.com',
  crypt('Haa123', gen_salt('bf')), -- Password: Haa123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  ''
)
ON CONFLICT (email) 
DO UPDATE SET
  encrypted_password = crypt('Haa123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW();

-- Then set admin flag in our custom users table
INSERT INTO public.users (id, email, is_admin, credits, created_at)
SELECT 
  id,
  'muscabmusa27@gmail.com',
  true,
  1000,
  NOW()
FROM auth.users 
WHERE email = 'muscabmusa27@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
  is_admin = true,
  email = 'muscabmusa27@gmail.com';
