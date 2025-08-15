import React from 'react';
import { Briefcase, MapPin, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { JobSuggestion } from '../types';

interface JobSuggestionListProps {
  jobSuggestions: JobSuggestion[];
}

export const JobSuggestionList: React.FC<JobSuggestionListProps> = ({ jobSuggestions }) => {

  const getMatchColor = (score: number = 0) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-600" />
          Job Suggestions
        </CardTitle>
        <CardDescription>
          AI-curated job openings matching your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobSuggestions && jobSuggestions.length > 0 ? (
            jobSuggestions.map((job, index) => (
              <div key={job.id || `job-${index}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                    <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getMatchColor(job.matchScore)}`}>
                    <TrendingUp className="w-3 h-3" />
                    {job.matchScore ? `${Math.round(job.matchScore)}% match` : 'N/A'}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-3">{job.description}</p>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign className="w-4 h-4" />
                    {job.salary || 'Salary Not Disclosed'}
                  </div>
                </div>

                {/* Skills */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills.map((skill: string, skillIndex: number) => (
                        <span
                          key={skillIndex}
                          className='px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600'
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    AI-generated suggestion
                  </span>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      View Details
                    </Button>
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No job suggestions available.</p>
              <p className="text-sm text-gray-400 mt-1">The AI agent could not find relevant jobs based on the search criteria.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
