'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Brain, Loader2, Moon, User, LogOut, Sparkles, Clock, BookOpen, ScrollText } from 'lucide-react';
import { AuroraText } from '@/components/magicui/aurora-text';
import { TextAnimate } from '@/components/magicui/text-animate';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
import Link from 'next/link';

const emotions = [
  'Joy', 'Fear', 'Sadness', 'Anxiety',
  'Peace', 'Confusion', 'Excitement', 'Anger'
];

// Memoized header component to prevent re-rendering
const AppHeader = memo(() => {
  return (
    <div className="text-center space-y-2 sm:space-y-4">
      <div className="flex items-center justify-center gap-2">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-primary">Dream <AuroraText>Analyzer</AuroraText></h1>
      </div>
      
      <TextAnimate animation="blurInUp" by="character" once className="text-sm md:text-base text-muted-foreground">
        Share your dream and emotions to receive an insightful analysis
      </TextAnimate>
    </div>
  );
});

// Memoized emotion button component
const EmotionButton = memo(({ emotion, isSelected, onToggle }: { 
  emotion: string, 
  isSelected: boolean, 
  onToggle: (emotion: string) => void 
}) => {
  return (
    <Button
      key={emotion}
      variant={isSelected ? "default" : "outline"}
      onClick={() => onToggle(emotion)}
      className="transition-colors text-xs sm:text-sm px-2 sm:px-3 py-1 h-auto"
    >
      {emotion}
    </Button>
  );
});

export default function Home() {
  const [dream, setDream] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const router = useRouter();

  useEffect(() => {
    // Check current auth status
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      console.log('Auth status checked:', session?.user ? 'Logged in' : 'Not logged in');
    };

    getUser();

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const toggleEmotion = useCallback((emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const analyzeDream = async () => {
    if (!dream.trim() || selectedEmotions.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream, emotions: selectedEmotions }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze dream');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);

      // Store dream in database if user is logged in
      if (user) {
        console.log('Attempting to save dream to database for user:', user.id);
        await saveDreamToDatabase(data.analysis);
      } else {
        console.log('User not logged in, not saving dream to database');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to analyze dream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveDreamToDatabase = async (analysisText: string) => {
    try {
      console.log('Saving dream with content:', { 
        user_id: user.id,
        dream_length: dream.length,
        emotions: selectedEmotions,
      });
      
      const { data, error: insertError } = await supabase.from('dreams').insert({
        user_id: user.id,
        dream_content: dream,
        emotions: selectedEmotions,
        analysis: analysisText
      }).select();
      
      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw insertError;
      }
      
      console.log('Dream saved successfully:', data);
    } catch (error) {
      console.error('Error saving dream to database:', error);
      // We don't show this error to user to avoid disrupting the experience
      // They'll still get their analysis even if DB save fails
    }
  };

  // Define interface for analysis sections
  interface AnalysisSection {
    title: string;
    content: string;
  }

  // Helper function to format analysis text with sections
  const formatAnalysis = (text: string): AnalysisSection[] => {
    // Clean up the text first - remove any double quotes or unnecessary formatting
    const cleanText = text.replace(/"/g, '')
      .replace(/\*\*/g, '') // Remove double asterisks
      .replace(/\*/g, '')    // Remove single asterisks
      .replace(/\d+\. /g, '') // Remove numbered lists
      .replace(/\n/g, ' ')   // Replace newlines with spaces
      .trim();
    
    // Split by periods to create cleaner sections, but prevent splitting on decimal numbers
    // e.g., don't split "8.5" into separate sentences
    const sentences = cleanText.split(/\.(?!\d)/).filter(s => s.trim().length > 0);
    
    // Group sentences into paragraphs - about 2-3 sentences per paragraph
    const paragraphs = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const combined = sentences.slice(i, i + 2).join('. ') + (i + 2 < sentences.length ? '.' : '');
      if (combined.trim()) paragraphs.push(combined.trim());
    }
    
    // Return one simple section if it's short, or multiple sections for longer analysis
    if (paragraphs.length <= 1) {
      return [{
        title: 'Analysis',
        content: cleanText
      }];
    }

    // Map the paragraphs to sections with simple titles
    const sectionTitles = ['Interpretation', 'Symbolism', 'Reflection'];
    return paragraphs.slice(0, 3).map((paragraph, index) => ({
      title: index < sectionTitles.length ? sectionTitles[index] : `Part ${index + 1}`,
      content: paragraph
    }));
  };

  return (
    <main className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
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

        <Card className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <Textarea
              placeholder="Describe your dream..."
              className="min-h-[120px] sm:min-h-[150px] resize-none"
              value={dream}
              onChange={(e) => setDream(e.target.value)}
            />

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">How did you feel?</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {emotions.map((emotion) => (
                  <EmotionButton
                    key={emotion}
                    emotion={emotion}
                    isSelected={selectedEmotions.includes(emotion)}
                    onToggle={toggleEmotion}
                  />
                ))}
              </div>
            </div>

            <Button
              className="w-full mt-2"
              onClick={analyzeDream}
              disabled={loading || !dream.trim() || selectedEmotions.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Analyze Dream
                </>
              )}
            </Button>

            {error && (
              <p className="text-xs sm:text-sm text-destructive text-center">{error}</p>
            )}

            {!user && dream.trim() && selectedEmotions.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link> or <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link> to save your dreams and build a personal dream journal
              </p>
            )}
          </div>
        </Card>

        {analysis && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-0 space-y-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  Dream Analysis
                </CardTitle>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
              <CardDescription>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedEmotions.map((emotion) => (
                    <span 
                      key={emotion}
                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {formatAnalysis(analysis).map((section, index) => (
                  <div key={index}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{section.title}</h3>
                    <p className="text-sm">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}