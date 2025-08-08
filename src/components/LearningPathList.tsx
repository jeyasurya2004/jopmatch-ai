import React from 'react';
import { BookOpen, ExternalLink, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LearningPath } from '../types';

interface LearningPathListProps {
  learningPaths: LearningPath[];
}

export const LearningPathList: React.FC<LearningPathListProps> = ({ learningPaths }) => {

  // Helper function to validate URL
  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <Card className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-green-600" />
          Learning Paths
        </CardTitle>
        <CardDescription>
          Personalized recommendations to bridge your skill gaps
        </CardDescription>
      </CardHeader>
      <CardContent>
        {learningPaths.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No learning paths needed!</p>
            <p className="text-sm text-gray-400 mt-1">Your skills are well-aligned with the role</p>
          </div>
        ) : (
          <div className="space-y-4">
            {learningPaths.map((path, index) => (
              // Add a unique key here using the path's link and index
              <div key={path.link + index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50/50 dark:bg-gray-900/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{path.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{path.description}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-2 w-full sm:w-auto"
                    onClick={() => window.open(path.link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Resource
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-blue-500" />
                    <span>Skill: {path.skillCovered}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isValidUrl(path.link) ? (
                      <img src={`https://www.google.com/s2/favicons?domain=${new URL(path.link).hostname}`} alt={`${path.provider} favicon`} className="w-3 h-3" />
                    ) : (
                      <BookOpen className="w-3 h-3 text-gray-500" /> // Using a generic icon as a fallback
                    )}
                    <span>Provider: {path.provider}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
