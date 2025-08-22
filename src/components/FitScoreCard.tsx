import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface FitScoreCardProps {
  score: number;
  justification: string;
  strengths: string[];
  improvements: string[];
}

export const FitScoreCard: React.FC<FitScoreCardProps> = ({ score, justification, strengths, improvements }) => {
  const getScoreColor = (s: number) => {
    if (s > 75) return 'text-green-500';
    if (s > 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="bg-card text-card-foreground border-border shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Role Fit Analysis
        </CardTitle>
        <CardDescription>{justification}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`text-6xl font-bold ${getScoreColor(score)}`}
          >
            {score}%
          </motion.div>
          <p className="text-muted-foreground text-sm mt-1">Compatibility Score</p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Key Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {strengths.map((strength, index) => (
                <div key={index} className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-500">
                  {strength}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-yellow-500" />
              Areas for Improvement
            </h4>
            <div className="flex flex-wrap gap-2">
              {improvements.map((improvement, index) => (
                <div key={index} className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-500">
                  {improvement}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};