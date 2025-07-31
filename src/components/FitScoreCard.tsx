import React from 'react';
import { TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface FitScoreCardProps {
  score?: number;
  justification?: string;
  strengths?: string[];
  improvements?: string[];
}

export const FitScoreCard: React.FC<FitScoreCardProps> = ({
  score = 0,
  justification = 'No analysis available',
  strengths = [],
  improvements = []
}) => {
  // Safety check for undefined improvements and ensure they are strings
  const safeImprovements = (improvements || []).map(item => 
    typeof item === 'string' ? item : JSON.stringify(item)
  );
  
  const safeStrengths = (strengths || []).map(item => 
    typeof item === 'string' ? item : JSON.stringify(item)
  );
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'from-green-50 to-green-100 border-green-200';
    if (score >= 60) return 'from-yellow-50 to-yellow-100 border-yellow-200';
    return 'from-red-50 to-red-100 border-red-200';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Role Fit Score
        </CardTitle>
        <CardDescription>
          AI analysis of your match with the selected role
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className={`p-6 rounded-lg bg-gradient-to-br border ${getScoreBackground(score)}`}>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(score)} mb-2`}>
              {score}%
            </div>
            <p className="text-sm text-gray-600">Match Score</p>
          </div>
          <Progress value={score} className="mt-4" />
        </div>

        {/* Justification */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{justification}</p>
        </div>

        {/* Strengths */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Your Strengths
          </h4>
          {safeStrengths.length > 0 ? (
            <ul className="space-y-2">
              {safeStrengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No strengths identified</p>
          )}
        </div>

        {/* Areas for Improvement */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            Areas for Growth
          </h4>
          {safeImprovements.length > 0 ? (
            <ul className="space-y-2">
              {safeImprovements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No areas for improvement identified</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};