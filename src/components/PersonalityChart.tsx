import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Brain, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PersonalityProfile } from '../types';

interface PersonalityChartProps {
  profile: PersonalityProfile;
}

export const PersonalityChart: React.FC<PersonalityChartProps> = ({ profile }) => {
  const chartData = [
    { trait: 'Openness', value: profile.openness * 100, fullName: 'Openness to Experience' },
    { trait: 'Conscientiousness', value: profile.conscientiousness * 100, fullName: 'Conscientiousness' },
    { trait: 'Extraversion', value: profile.extraversion * 100, fullName: 'Extraversion' },
    { trait: 'Agreeableness', value: profile.agreeableness * 100, fullName: 'Agreeableness' },
    { trait: 'Neuroticism', value: (1 - profile.neuroticism) * 100, fullName: 'Emotional Stability' }, // Inverted for better visualization
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

    return value >= 60 ? descriptions[trait]?.high : descriptions[trait]?.low;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          Personality Profile
        </CardTitle>
        <CardDescription>
          Big Five personality traits inferred from your resume
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Radar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="trait" fontSize={12} />
              <PolarRadiusAxis 
                angle={0} 
                domain={[0, 100]} 
                tick={false}
              />
              <Radar
                name="Personality"
                dataKey="value"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-900">Personality Summary</span>
          </div>
          <p className="text-sm text-purple-800 leading-relaxed">{profile.summary}</p>
        </div>

        {/* Trait Details */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Trait Breakdown</h4>
          {chartData.map((item, index) => (
            <div key={item.trait} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{item.fullName}</span>
                <span className="text-sm text-gray-600">{Math.round(item.value)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">
                {getTraitDescription(item.trait, item.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};