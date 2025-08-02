import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
// **FIXED HERE**: Removed unused icons
import { Download, RefreshCw, Brain, MessageSquare } from 'lucide-react';
import { FitScoreCard } from './FitScoreCard';
import { SkillGapView } from './SkillGapView';
import { PersonalityChart } from './PersonalityChart';
import { LearningPathList } from './LearningPathList';
import { JobSuggestionList } from './JobSuggestionList';
import { ResumeData, JobRole, RoleFitResult, SkillGap, PersonalityProfile, LearningPath } from '../types';

// Import all agents
import { skillAnalyzerAgent } from '../services/agents/SkillAnalyzerAgent';
import { careerFitAgent } from '../services/agents/CareerFitAgent';
import { personalityAgent } from '../services/agents/PersonalityAgent';
import { recommendationAgent } from '../services/agents/RecommendationAgent';
import { jobFetcherAgent } from '../services/agents/JobFetcherAgent';
import { feedbackAgent } from '../services/agents/FeedbackAgent';

interface DashboardProps {
  resumeData: ResumeData;
  selectedRole: JobRole;
}

export const Dashboard: React.FC<DashboardProps> = ({ resumeData, selectedRole }) => {
  const renderRecommendation = (rec: any) => {
    if (!rec) return 'No details available';
    if (typeof rec === 'string') return rec;
    if (typeof rec === 'object' && Object.keys(rec).length === 0) return 'No details available';
    const recommendationText = rec.recommendation || rec.suggestion || rec.advice || rec.title || rec.description || rec.content || '';
    if (recommendationText) return recommendationText;
    const stringified = JSON.stringify(rec);
    return stringified !== '{}' ? stringified : 'No details available';
  };
  
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(7);
  
  const [roleFitResult, setRoleFitResult] = useState<RoleFitResult | null>(null);
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [jobSuggestions, setJobSuggestions] = useState<any[]>([]);
  const [finalFeedback, setFinalFeedback] = useState<any>(null);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);

  useEffect(() => {
    runAgentPipeline();
  }, [resumeData, selectedRole]);

  const runAgentPipeline = async () => {
    setLoading(true);
    setCurrentStep(1);

    try {
      setCurrentStep(2);

      const skillResult = await skillAnalyzerAgent.analyzeSkills(resumeData);
      const gapResult = await skillAnalyzerAgent.analyzeSkillGaps(resumeData.skills, selectedRole.title, selectedRole.requiredSkills);
      const processedGaps: SkillGap[] = (gapResult.skillGaps || []).map((gap: any) => ({
        skill: gap.skill, importance: gap.importance || 70, currentLevel: gap.currentLevel || 0, requiredLevel: gap.requiredLevel || 80, gap: gap.gap || Math.max(0, (gap.requiredLevel || 80) - (gap.currentLevel || 0))
      }));
      setSkillGaps(processedGaps);
      setCurrentStep(3);

      const fitResult = await careerFitAgent.calculateRoleFit(resumeData, selectedRole.title);
      setRoleFitResult(fitResult);
      setCurrentStep(4);

      const personalityResult = await personalityAgent.analyzePersonality(resumeData);
      setPersonalityProfile({
        openness: personalityResult.openness || 0.5, conscientiousness: personalityResult.conscientiousness || 0.5, extraversion: personalityResult.extraversion || 0.5, agreeableness: personalityResult.agreeableness || 0.5, neuroticism: personalityResult.neuroticism || 0.5, summary: personalityResult.summary || 'Personality analysis based on resume content'
      });
      setCurrentStep(5);

      const missingSkills = processedGaps.slice(0, 5).map(gap => gap.skill);
      const recommendationResult = await recommendationAgent.generateRecommendations(resumeData, selectedRole.title, missingSkills);
      
      const validLearningPaths: LearningPath[] = Array.isArray(recommendationResult.learningPaths) ? recommendationResult.learningPaths : [];
      setLearningPaths(validLearningPaths);
      setCurrentStep(6);

      const jobResult = await jobFetcherAgent.fetchJobs(resumeData, selectedRole.title);
      setJobSuggestions(jobResult.jobSuggestions || []);
      setCurrentStep(7);

      const allAgentOutputs = { resumeData, selectedRole, skillAnalysis: skillResult, roleFit: fitResult, personality: personalityResult, recommendations: recommendationResult, jobs: jobResult, skillGaps: processedGaps };
      const feedbackResult = await feedbackAgent.generateFeedback(allAgentOutputs);
      setFinalFeedback(feedbackResult);

    } catch (error) {
      console.error('Error in agent pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepName = (step: number): string => {
    const steps = [ 'Data Extraction', 'Skill Analysis', 'Career Fit Analysis', 'Personality Analysis', 'Learning Recommendations', 'Job Matching', 'Feedback Generation' ];
    return steps[step - 1] || 'Processing';
  };

    if (loading) {
    return (
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="w-full shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
              AI Analysis in Progress
            </CardTitle>
            <CardDescription>
              Our 7 AI agents are analyzing your resume and generating personalized insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep} of {totalSteps}</span>
                <span className="font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {getStepName(currentStep)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <motion.h2 
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          AI Analysis Complete for {resumeData.name}
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Comprehensive insights for {selectedRole.title} role
        </motion.p>
      </div>

      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{roleFitResult?.score || 0}%</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Role Fit Score</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{skillGaps.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Skill Gaps</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{learningPaths.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Learning Paths</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{jobSuggestions.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Job Matches</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roleFitResult && <FitScoreCard score={roleFitResult.score} justification={roleFitResult.justification} strengths={roleFitResult.strengths} improvements={roleFitResult.improvements}/>}
              {skillGaps.length > 0 && <SkillGapView skillGaps={skillGaps.slice(0, 5)} />}
            </div>
          </TabsContent>
          <TabsContent value="skills" className="space-y-6"><SkillGapView skillGaps={skillGaps} /></TabsContent>
          <TabsContent value="personality" className="space-y-6">{personalityProfile && <PersonalityChart profile={personalityProfile} />}</TabsContent>
          <TabsContent value="learning" className="space-y-6"><LearningPathList learningPaths={learningPaths} /></TabsContent>
          <TabsContent value="jobs" className="space-y-6"><JobSuggestionList skills={resumeData.skills} targetRole={selectedRole.title} /></TabsContent>
          <TabsContent value="feedback" className="space-y-6">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="w-6 h-6 text-blue-600" />Comprehensive Feedback Report</CardTitle>
                <CardDescription>AI-generated insights and career guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {finalFeedback ? (
                  <>
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{finalFeedback.overallReadinessScore !== undefined ? finalFeedback.overallReadinessScore : 0}/100</div>
                      <p className="text-gray-600 dark:text-gray-400">Overall Readiness Score</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{finalFeedback.summary || 'No summary available'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Strengths</h4>
                        {finalFeedback.strengths && finalFeedback.strengths.length > 0 ? (
                          <ul className="space-y-2">
                            {finalFeedback.strengths.map((strength: any, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                                <span className="text-gray-700 dark:text-gray-300">{typeof strength === 'string' ? strength : (strength.area || strength.suggestion || 'Strength')}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (<p className="text-gray-500">No strengths identified</p>)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Areas for Improvement</h4>
                        {finalFeedback.areasForImprovement && finalFeedback.areasForImprovement.length > 0 ? (
                          <ul className="space-y-2">
                            {finalFeedback.areasForImprovement.map((area: any, index: number) => (
                              <li key={index} className="flex flex-col gap-1">
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">{typeof area === 'string' ? area : (area.area || area.suggestion || 'Area for improvement')}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (<p className="text-gray-500">No areas for improvement identified</p>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Key Recommendations</h4>
                      {finalFeedback.keyRecommendations && finalFeedback.keyRecommendations.length > 0 ? (
                        <div className="space-y-3">
                          {finalFeedback.keyRecommendations.map((rec: any, index: number) => (
                            <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-gray-700 dark:text-gray-300 text-sm">{renderRecommendation(rec) || 'No recommendation provided'}</p>
                            </div>
                          ))}
                        </div>
                      ) : (<p className="text-gray-500">No specific recommendations available</p>)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Next Steps</h4>
                      {finalFeedback.nextSteps && finalFeedback.nextSteps.length > 0 ? (
                        <ol className="space-y-2">
                          {finalFeedback.nextSteps.map((step: any, index: number) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">{index + 1}</div>
                              <span className="text-gray-700 dark:text-gray-300">{typeof step === 'string' ? step : (step.recommendation || step.suggestion || 'Next step')}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (<p className="text-gray-500">No next steps provided</p>)}
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-green-800 dark:text-green-300 font-medium">{finalFeedback.encouragement || 'Keep working on your career development!'}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Feedback analysis in progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      <motion.div 
        className="flex flex-col sm:flex-row justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Button onClick={runAgentPipeline} className="flex items-center gap-2"><RefreshCw className="w-4 h-4" />Re-analyze</Button>
        <Button variant="outline" className="flex items-center gap-2"><Download className="w-4 h-4" />Download Report</Button>
      </motion.div>
    </motion.div>
  );
};
