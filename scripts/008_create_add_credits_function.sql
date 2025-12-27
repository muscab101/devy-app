-- Create a function that admins can call to add credits to any user
-- This function handles the case where the user might not exist in public.users yet
CREATE OR REPLACE FUNCTION public.admin_add_credits(target_user_id UUID, credit_amount INTEGER)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  user_email TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin() THEN
    RETURN QUERY SELECT FALSE, 0, 'Unauthorized: Admin access required';
    RETURN;
  END IF;

  -- Check if user exists in public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = target_user_id) INTO user_exists;

  -- If user doesn't exist in public.users, create them from auth.users
  IF NOT user_exists THEN
    -- Get email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = target_user_id;
    
    IF user_email IS NULL THEN
      RETURN QUERY SELECT FALSE, 0, 'User not found in authentication system';
      RETURN;
    END IF;

    -- Insert user into public.users with default credits
    INSERT INTO public.users (id, email, credits, is_admin)
    VALUES (target_user_id, user_email, 1000, FALSE)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Get current credits
  SELECT credits INTO current_credits FROM public.users WHERE id = target_user_id;

  -- Add credits
  UPDATE public.users
  SET credits = credits + credit_amount
  WHERE id = target_user_id;

  -- Get new balance
  SELECT credits INTO current_credits FROM public.users WHERE id = target_user_id;

  RETURN QUERY SELECT TRUE, current_credits, 'Credits added successfully';
END;
$$;

-- Grant execute permission to authenticated users (function checks admin status internally)
GRANT EXECUTE ON FUNCTION public.admin_add_credits TO authenticated;
