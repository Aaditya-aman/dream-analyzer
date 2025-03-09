NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_API_KEY=your-gemini-api-key# Supabase Setup Instructions

Follow these steps to set up Supabase for your Dream Analyzer application:

## 1. Create a Supabase Project

1. Go to [https://supabase.com/](https://supabase.com/)
2. Sign up or log in
3. Create a new project
4. Note your project URL and anon/public key

## 2. Create Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GOOGLE_API_KEY=your-gemini-api-key
```

## 3. Set Up Database Tables

In your Supabase dashboard, go to the SQL Editor and run the following SQL queries:

### Create Profiles Table

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT
);
```

### Create Dreams Table

```sql
CREATE TABLE dreams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  dream_content TEXT NOT NULL,
  emotions TEXT[] NOT NULL,
  analysis TEXT
);
```

## 4. Set Up RLS (Row Level Security) Policies

Enable Row Level Security on both tables and add policies:

### For Profiles Table

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### For Dreams Table

```sql
-- Enable RLS
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

-- Create policies
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
```

## 5. Set Up Triggers for User Creation

```sql
-- Create a trigger to create a profile when a new user signs up
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
```

## 6. Configure Authentication

1. In the Supabase dashboard, go to Authentication -> Settings
2. Under Site URL, add your local development URL (e.g., http://localhost:3000)
3. Under Redirect URLs, add your callback URL (e.g., http://localhost:3000/auth/callback)

## 7. Set Up OAuth Providers (Optional)

If you want to enable Google authentication:

1. Go to Authentication -> Providers
2. Enable Google
3. Follow the instructions to set up OAuth with Google Developer Console
4. Add your Client ID and Client Secret
