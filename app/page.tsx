'use client';

import { useState } from 'react';
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

export default function Home() {
  const [dream, setDream] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
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
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to analyze dream. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            
            <h1 className="text-8xl font-bold text-primary">Dream <AuroraText>Analyzer</AuroraText></h1>
          </div>
          
            {/* Share your dream and emotions to receive an insightful analysis */}
            <TextAnimate animation="blurInUp" by="character" once className="text-muted-foreground">
            Share your dream and emotions to receive an insightful analysis
            </TextAnimate>
          
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your dream..."
              className="min-h-[150px] resize-none"
              value={dream}
              onChange={(e) => setDream(e.target.value)}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">How did you feel?</label>
              <div className="flex flex-wrap gap-2">
                {emotions.map((emotion) => (
                  <Button
                    key={emotion}
                    variant={selectedEmotions.includes(emotion) ? "default" : "outline"}
                    onClick={() => toggleEmotion(emotion)}
                    className="transition-colors"
                  >
                    {emotion}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={analyzeDream}
              disabled={loading || !dream.trim() || selectedEmotions.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze Dream
                </>
              )}
            </Button>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>
        </Card>

        {analysis && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dream Analysis</h2>
            <div className="prose prose-sm">
              {analysis.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0 text-muted-foreground">
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