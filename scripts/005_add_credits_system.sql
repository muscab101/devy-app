-- Add credits column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1000;

-- Create function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(user_id UUID, amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.users
  WHERE id = user_id;
  
  -- Check if user has enough credits
  IF current_credits < amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.users
  SET credits = credits - amount
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_credits TO authenticated;
