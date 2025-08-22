import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Brain, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PersonalityProfile } from '../types';
import { motion } from 'framer-motion';

interface PersonalityChartProps {
  profile: PersonalityProfile;
}

export const PersonalityChart: React.FC<PersonalityChartProps> = ({ profile }) => {
  const chartData = [
    { trait: 'Openness', value: profile.openness, fullName: 'Openness to Experience' },
    { trait: 'Conscientiousness', value: profile.conscientiousness, fullName: 'Conscientiousness' },
    { trait: 'Extraversion', value: profile.extraversion, fullName: 'Extraversion' },
    { trait: 'Agreeableness', value: profile.agreeableness, fullName: 'Agreeableness' },
    { trait: 'Neuroticism', value: 1 - profile.neuroticism, fullName: 'Emotional Stability' }, // Inverted for better visualization
  ];

  const getTraitDescription = (trait: string, value: number) => {
    const descriptions: { [key: string]: { high: string; low: string } } = {
      'Openness': {
        high: 'Creative, curious, and open to new experiences',
        low: 'Practical, conventional, and prefer routine'
      },
      'Conscientiousness': {
        high: 'Organized, disciplined, and goal-oriented',
        low: 'Flexible, spontaneous, and adaptable'
      },
      'Extraversion': {
        high: 'Outgoing, energetic, and social',
        low: 'Reserved, thoughtful, and prefer solitude'
      },
      'Agreeableness': {
        high: 'Cooperative, trusting, and empathetic',
        low: 'Competitive, skeptical, and direct'
      },
      'Neuroticism': {
        high: 'Emotionally stable and calm under pressure',
        low: 'Sensitive and responsive to stress'
      }
    };

    return value >= 0.6 ? descriptions[trait]?.high : descriptions[trait]?.low;
  };

  return (
    <Card className="w-full bg-card text-card-foreground border-border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Personality Profile
        </CardTitle>
        <CardDescription>
          Big Five personality traits inferred from your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="trait" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <PolarRadiusAxis 
                angle={0} 
                domain={[0, 1]} 
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Personality"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-primary/10 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-primary" />
            <span className="font-medium text-primary">Personality Summary</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{profile.summary}</p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Trait Breakdown</h4>
          {chartData.map((item) => (
            <motion.div 
              key={item.trait} 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{item.fullName}</span>
                <span className="text-sm text-muted-foreground">{Math.round(item.value * 100)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                ></motion.div>
              </div>
              <p className="text-xs text-muted-foreground">
                {getTraitDescription(item.trait, item.value)}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};