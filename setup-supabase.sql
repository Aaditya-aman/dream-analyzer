-- Create Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT
);

-- Create Dreams Table
CREATE TABLE dreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  dream_content TEXT NOT NULL,
  emotions TEXT[] NOT NULL,
  analysis TEXT
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Enable RLS for dreams
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

-- Create policies for dreams
CREATE POLICY "Users can view their own dreams" 
  ON dreams FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dreams" 
  ON dreams FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dreams" 
  ON dreams FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dreams" 
  ON dreams FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a trigger for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
