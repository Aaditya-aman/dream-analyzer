'use client';

import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Brain, Loader2, Moon } from 'lucide-react';
import { AuroraText } from '@/components/magicui/aurora-text';
import { TextAnimate } from '@/components/magicui/text-animate';

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

  const toggleEmotion = useCallback((emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  }, []);

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
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to analyze dream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
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
          </div>
        </Card>

        {analysis && (
          <Card className="p-3 sm:p-4 md:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 md:mb-4">Dream Analysis</h2>
            <div className="prose prose-sm max-w-full">
              {analysis.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 sm:mb-3 md:mb-4 last:mb-0 text-xs sm:text-sm md:text-base text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}