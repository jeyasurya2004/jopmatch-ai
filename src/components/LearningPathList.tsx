import React from 'react';
import { BookOpen, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LearningPath } from '../types';

interface LearningPathListProps {
  learningPaths: LearningPath[];
}

export const LearningPathList: React.FC<LearningPathListProps> = ({ learningPaths }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
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
            {learningPaths.map((path, _) => (
              <div key={path.skill} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{path.skill}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 ${getPriorityColor(path.priority)}`}>
                      {getPriorityIcon(path.priority)}
                      {path.priority} priority
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {path.timeEstimate}
                  </div>
                </div>

                {/* Courses */}
                <div className="space-y-2">
                  {path.courses.map((course, _) => (
                    <div key={course.title || course.suggestion || course.area || Math.random().toString()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{String(course.title || course.suggestion || course.area || 'Untitled Course')}</span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            {String(course.difficulty || course.priority || 'Beginner')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{course.provider || 'Unknown Provider'}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.duration || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => course.url !== '#' && window.open(course.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Progress Indicator */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Progress: Not started</span>
                    <span>{path.courses.length} course{path.courses.length > 1 ? 's' : ''} recommended</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                    <div className="bg-green-600 h-1 rounded-full" style={{ width: '0%' }}></div>
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