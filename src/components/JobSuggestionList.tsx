import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Building, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { JobSuggestion } from '../types';

interface JobSuggestionListProps {
  jobSuggestions: JobSuggestion[];
}

export const JobSuggestionList: React.FC<JobSuggestionListProps> = ({ jobSuggestions }) => {
  if (jobSuggestions.length === 0) {
    return (
      <Card className="bg-card text-card-foreground border-border shadow-lg">
        <CardContent className="text-center py-8">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No job suggestions available at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground border-border shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Job Suggestions
        </CardTitle>
        <CardDescription>
          AI-curated job openings matching your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {jobSuggestions.map((job, index) => (
            <motion.div
              key={index}
              className="p-4 border border-border rounded-lg hover:shadow-xl transition-shadow bg-background/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">{job.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><Building className="w-4 h-4" />{job.company}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>
                  </div>
                </div>
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              <p className="text-sm text-foreground/80 mt-3">{job.description}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};