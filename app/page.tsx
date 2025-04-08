'use client';

import { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AuroraText } from '@/components/magicui/aurora-text';
import { TextAnimate } from '@/components/magicui/text-animate';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Brain, Moon, Star, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { SparklesText } from '@/components/magicui/sparkles-text';
import { RainbowButton } from '@/components/magicui/rainbow-button';

// Memoized header component to prevent re-rendering
const AppHeader = memo(() => {
  return (
    <div className="text-center space-y-2 sm:space-y-4">
      <div className="flex items-center justify-center">
        <h1 className="text-6xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary">
          <span className="mr-2 text-7xl">Dream</span>
          <SparklesText text="Analyzer" />
        </h1>
      </div>
      
      <TextAnimate animation="blurInUp" by="character" once className="text-sm md:text-base text-muted-foreground">
        Uncover the hidden meanings of your dreams
      </TextAnimate>
    </div>
  );
});
const AppMainHeader = memo(() => {
  return (
    <div className="text-center space-y-2 sm:space-y-4">
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary">Dream <AuroraText>Analyzer</AuroraText></h1>
      </div>
      
      <TextAnimate animation="blurInUp" by="character" once className="text-sm md:text-base text-muted-foreground">
        Share your dream and emotions to receive an insightful analysis
      </TextAnimate>
    </div>
  );
});

// Feature card component
const FeatureCard = ({ icon: Icon, title, description }: { 
  icon: any, 
  title: string, 
  description: string 
}) => (
  <div className="bg-background/50 backdrop-blur-sm border rounded-xl p-4 md:p-6 flex flex-col items-center text-center">
    <div className="p-3 bg-primary/10 rounded-full mb-4">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-base sm:text-lg font-medium mb-2">{title}</h3>
    <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const router = useRouter();

  useEffect(() => {
    // Check current auth status
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUser();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-background p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-10 md:space-y-12 relative z-10">
        <div className="flex justify-end">
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">My Dreams</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        <AppHeader />


        <div className="text-center space-y-4 sm:space-y-6 mt-6">
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Our advanced AI analyzes your dreams and reveals the hidden patterns, emotions, and meanings behind your subconscious mind.
          </p>
          
          <div className="pt-4">
            <Link href="/analyze">
            <RainbowButton>Start Analyzing Your Dreams</RainbowButton>
              
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-8 sm:mt-12">
          <FeatureCard 
            icon={Brain} 
            title="AI-Powered Analysis" 
            description="Our sophisticated AI analyzes the emotional content and symbolism in your dreams" 
          />
          <FeatureCard 
            icon={Moon} 
            title="Emotional Insights" 
            description="Understand the emotional patterns and hidden meanings behind your dreams" 
          />
          <FeatureCard 
            icon={Star} 
            title="Personal Dream Journal" 
            description="Save your dreams and analyses to track patterns over time" 
          />
        </div>

        <div className="text-center mt-12 pt-6 border-t text-xs sm:text-sm text-muted-foreground">
          <p>Dream Analyzer © {new Date().getFullYear()} | Privacy-focused dream analysis</p>
        </div>
      </div>
    </main>
  );
}