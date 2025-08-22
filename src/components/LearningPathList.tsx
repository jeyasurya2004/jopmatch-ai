import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Link, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LearningPath } from '../types';

interface LearningPathListProps {
  learningPaths: LearningPath[];
}

export const LearningPathList: React.FC<LearningPathListProps> = ({ learningPaths }) => {
  if (learningPaths.length === 0) {
    return (
      <Card className="bg-card text-card-foreground border-border shadow-lg">
        <CardContent className="text-center py-8">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No learning paths needed! Your skills are well-aligned with the role.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground border-border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Learning Paths
        </CardTitle>
        <CardDescription>
          Personalized recommendations to bridge your skill gaps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {learningPaths.map((path, index) => (
            <motion.div
              key={index}
              className="p-4 border border-border rounded-lg hover:shadow-xl transition-shadow bg-background/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{path.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-semibold text-foreground">Provider:</span> {path.provider} | <span className="font-semibold text-foreground">Skill:</span> {path.skillCovered}
                  </p>
                  <p className="text-sm text-foreground/80 mt-2">{path.description}</p>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                  <a href={path.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                    Start Learning
                    <Link className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};