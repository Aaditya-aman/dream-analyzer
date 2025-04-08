'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';
import { Loader2, Book, Calendar, Trash } from 'lucide-react';

type Dream = Database['public']['Tables']['dreams']['Row'];

export default function Dashboard() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUser(session.user);
        fetchDreams(session.user.id);
      } catch (error) {
        console.error('Error checking user session:', error);
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);

  const fetchDreams = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDreams(data || []);
    } catch (error: any) {
      console.error('Error fetching dreams:', error);
      setError(error.message || 'Failed to fetch dreams');
    } finally {
      setLoading(false);
    }
  };

  const deleteDream = async (dreamId: string) => {
    if (!confirm('Are you sure you want to delete this dream?')) return;
    
    try {
      const { error } = await supabase
        .from('dreams')
        .delete()
        .eq('id', dreamId);

      if (error) throw error;
      
      // Refresh dreams list
      setDreams(dreams.filter(dream => dream.id !== dreamId));
    } catch (error: any) {
      console.error('Error deleting dream:', error);
      alert('Failed to delete dream: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to clean analysis text
  const cleanAnalysisText = (text: string): string => {
    return text.replace(/"/g, '') // Remove quotes
      .replace(/\*\*/g, '')       // Remove double asterisks
      .replace(/\*/g, '')         // Remove single asterisks
      .replace(/\d+\. /g, '')     // Remove numbered lists
      .trim();
  };

  return (
    <main className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <div className="text-center space-y-2 sm:space-y-4">
          <h1 className="text-4xl font-bold text-primary">My Dream Journal</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View and manage your recorded dreams
          </p>
          <Button onClick={() => router.push('/analyze')} className="mt-2">
            <Book className="mr-2 h-4 w-4" />
            Record New Dream
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card className="p-4 text-center text-destructive">
            {error}
          </Card>
        ) : dreams.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <p>You haven't recorded any dreams yet.</p>
            <Button onClick={() => router.push('/analyze')} className="mt-4">
              Record Your First Dream
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {dreams.map((dream) => (
              <Card key={dream.id} className="p-4 sm:p-6 overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(dream.created_at)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDream(dream.id)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Dream:</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {dream.dream_content}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Emotions:</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {dream.emotions.map((emotion) => (
                      <span
                        key={emotion}
                        className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
                
                {dream.analysis && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Analysis:</h3>
                    <div className="text-sm text-muted-foreground">
                      {cleanAnalysisText(dream.analysis).split('\n').map((paragraph, i) => {
                        // Skip empty paragraphs
                        if (!paragraph.trim()) return null;
                        
                        // Split into sentences for better formatting
                        const sentences = paragraph.split(/\.(?!\d)/).filter(s => s.trim());
                        
                        return (
                          <div key={i} className="mb-3 last:mb-0">
                            {sentences.map((sentence, j) => (
                              <span key={j}>
                                {sentence.trim()}{j < sentences.length - 1 ? '.' : ''}
                                {j < sentences.length - 1 ? ' ' : ''}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
