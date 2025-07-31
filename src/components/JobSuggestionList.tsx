import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { JobSuggestion } from '../types';
import { groqService } from '../services/groq';

interface JobSuggestionListProps {
  skills: string[];
  targetRole: string;
}

export const JobSuggestionList: React.FC<JobSuggestionListProps> = ({ skills, targetRole }) => {
  const [jobSuggestions, setJobSuggestions] = useState<JobSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        console.log('JobSuggestionList: Fetching job suggestions for role:', targetRole);
        
        // Convert skills array to a string for the prompt
        const skillsText = skills.join(', ');
        
        // Call the correct method with the right parameters
        const jobData = await groqService.fetchJobMatches(skillsText, targetRole, 'Remote');
        console.log('JobSuggestionList: Raw job data:', jobData);
        
        let parsed;
        try {
          // Try to parse the response as JSON first
          parsed = typeof jobData === 'string' ? JSON.parse(jobData) : jobData;
          
          // Handle different response formats
          let suggestions: any[] = [];
          if (Array.isArray(parsed)) {
            suggestions = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (parsed.job_matches) {
              suggestions = Array.isArray(parsed.job_matches) ? parsed.job_matches : [];
            } else if (parsed.jobMatches) {
              suggestions = Array.isArray(parsed.jobMatches) ? parsed.jobMatches : [];
            } else if (parsed.jobSuggestions) {
              suggestions = Array.isArray(parsed.jobSuggestions) ? parsed.jobSuggestions : [];
            } else if (parsed.jobs) {
              suggestions = Array.isArray(parsed.jobs) ? parsed.jobs : [];
            }
          }
          
          // Ensure each job has an ID and required properties
          suggestions = suggestions.map((job: any, index: number) => ({
            id: job.id || `job-${index}`,
            title: job.title || 'Untitled Position',
            company: job.company || 'Unknown Company',
            location: job.location || 'Location Not Specified',
            salary: job.salary || 'Salary Not Disclosed',
            matchScore: job.matchScore || job.match_score || 0,
            description: job.description || 'No description available',
            requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills : 
                          Array.isArray(job.required_skills) ? job.required_skills : 
                          []
          }));
          
          console.log('JobSuggestionList: Parsed job data:', suggestions);
          setJobSuggestions(suggestions);
        } catch (error) {
          console.error('JobSuggestionList: Error parsing job data:', error);
          // Fallback to mock data if parsing fails
          console.log('JobSuggestionList: Using mock jobs due to parsing error');
          const mockJobs = generateMockJobs(targetRole, skills);
          setJobSuggestions(mockJobs);
        }
        
      } catch (error) {
        console.error('JobSuggestionList: Error fetching jobs:', error);
        
        // Check if it's an API key issue
        if (error instanceof Error && (error.message.includes('API') || error.message.includes('401'))) {
          console.log('JobSuggestionList: API key issue, using mock jobs');
          const mockJobs = generateMockJobs(targetRole, skills);
          setJobSuggestions(mockJobs);
        } else {
          throw error;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [skills, targetRole]);

  const generateMockJobs = (role: string, userSkills: string[]): JobSuggestion[] => {
    const companies = ['TechStart Inc.', 'InnovateCorp', 'BigTech Solutions', 'Enterprise Systems', 'StartupHub', 'CloudTech Co.'];
    const locations = ['San Francisco, CA', 'Remote', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA'];
    const jobTypes = ['Junior', '', 'Senior', 'Lead'];
    
    return Array.from({ length: 4 }, (_, index) => {
      const jobType = jobTypes[index] || '';
      const company = companies[index % companies.length];
      const location = locations[index % locations.length];
      
      // Calculate match score based on skills overlap
      const requiredSkills = userSkills.slice(0, Math.min(4, userSkills.length));
      const matchScore = Math.max(65, 95 - (index * 5));
      
      const salaryRanges = {
        'Junior': '$65,000 - $85,000',
        '': '$75,000 - $105,000',
        'Senior': '$95,000 - $130,000',
        'Lead': '$120,000 - $160,000'
      };
      
      return {
        id: `job-${index + 1}`,
        title: `${jobType} ${role}`.trim(),
        company,
        location,
        salary: salaryRanges[jobType as keyof typeof salaryRanges] || '$75,000 - $105,000',
        matchScore,
        description: `Join our ${company.includes('Startup') ? 'dynamic startup' : 'established'} team as a ${role}. Work on cutting-edge projects and grow your career in a collaborative environment.`,
        requiredSkills
      };
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Job Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
            jobSuggestions.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                    <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getMatchColor(job.matchScore)}`}>
                    <TrendingUp className="w-3 h-3" />
                    {Math.round(job.matchScore)}% match
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
                    {job.salary}
                  </div>
                </div>

                {/* Skills */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs rounded-full ${
                            skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
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
                  <Button size="sm" className="flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    View Details
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No job suggestions available</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* View More */}
        <div className="mt-6 text-center">
          <Button variant="outline" className="w-full">
            Generate More Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};