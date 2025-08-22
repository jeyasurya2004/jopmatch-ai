import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, RefreshCw, Brain, MessageSquare } from 'lucide-react';
import { FitScoreCard } from './FitScoreCard';
import { SkillGapView } from './SkillGapView';
import { PersonalityChart } from './PersonalityChart';
import { LearningPathList } from './LearningPathList';
import { JobSuggestionList } from './JobSuggestionList';
import { ResumeData, JobRole, RoleFitResult, SkillGap, PersonalityProfile, LearningPath, JobSuggestion } from '../types';
import { Progress } from './ui/progress';

import { skillAnalyzerAgent } from '../services/agents/SkillAnalyzerAgent';
import { careerFitAgent } from '../services/agents/CareerFitAgent';
import { personalityAgent } from '../services/agents/PersonalityAgent';
import { recommendationAgent } from '../services/agents/Recommendation-agent';
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
  const [jobSuggestions, setJobSuggestions] = useState<JobSuggestion[]>([]);
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
      setPersonalityProfile(personalityResult);
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
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Card className="w-full shadow-strong bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-gray-700/50 py-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="flex items-center justify-center gap-3 text-3xl text-primary mb-2">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  <Brain className="w-8 h-8" />
                </motion.div>
                AI Analysis in Progress
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Our 7 AI agents are analyzing your resume and generating personalized insights
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex justify-between text-lg font-medium text-muted-foreground">
                <span>Step {currentStep} of {totalSteps}</span>
                <motion.span 
                  className="font-bold text-primary"
                  key={currentStep}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {Math.round((currentStep / totalSteps) * 100)}%
                </motion.span>
              </div>
              <div className="relative">
                <Progress value={(currentStep / totalSteps) * 100} className="h-3 enhanced-progress" />
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-primary px-6 py-3 rounded-full backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-5 h-5" />
                </motion.div>
                <span className="font-semibold text-lg">{getStepName(currentStep)}</span>
              </div>
            </motion.div>
            
            {/* AI Agents Visualization */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {[
                { name: 'Data', icon: '📄', active: currentStep >= 1 },
                { name: 'Skills', icon: '🎯', active: currentStep >= 2 },
                { name: 'Career', icon: '💼', active: currentStep >= 3 },
                { name: 'Personality', icon: '🧠', active: currentStep >= 4 },
                { name: 'Learning', icon: '📚', active: currentStep >= 5 },
                { name: 'Jobs', icon: '🔍', active: currentStep >= 6 },
                { name: 'Feedback', icon: '💬', active: currentStep >= 7 }
              ].map((agent, index) => (
                <motion.div
                  key={agent.name}
                  className={`text-center p-3 rounded-xl transition-all duration-500 ${
                    agent.active 
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-primary' 
                      : 'bg-gray-100 dark:bg-gray-700 text-muted-foreground'
                  }`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl mb-1">{agent.icon}</div>
                  <div className="text-xs font-medium">{agent.name}</div>
                  {agent.active && (
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-12"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            ✨ AI Analysis Complete!
          </h2>
          <motion.div
            className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full font-medium"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Analysis complete for {resumeData.name}
          </motion.div>
        </motion.div>
        <motion.p 
          className="text-xl text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Comprehensive insights for <span className="font-semibold text-primary">{selectedRole.title}</span> role
        </motion.p>
      </div>

      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
              delayChildren: 0.2
            }
          }
        }}
      >
        <motion.div variants={{ hidden: { y: 30, opacity: 0, scale: 0.8 }, visible: { y: 0, opacity: 1, scale: 1 } }}>
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-strong h-full hover-lift group">
            <CardContent className="p-6 text-center space-y-3">
              <motion.div 
                className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                {roleFitResult?.score || 0}%
              </motion.div>
              <p className="text-sm font-medium text-muted-foreground">Role Fit Score</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${roleFitResult?.score || 0}%` }}
                  transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{ hidden: { y: 30, opacity: 0, scale: 0.8 }, visible: { y: 0, opacity: 1, scale: 1 } }}>
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-strong h-full hover-lift group">
            <CardContent className="p-6 text-center space-y-3">
              <motion.div 
                className="text-4xl font-bold text-orange-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                {skillGaps.length}
              </motion.div>
              <p className="text-sm font-medium text-muted-foreground">Skill Gaps</p>
              <div className="flex justify-center">
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
                  Areas to improve
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{ hidden: { y: 30, opacity: 0, scale: 0.8 }, visible: { y: 0, opacity: 1, scale: 1 } }}>
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-strong h-full hover-lift group">
            <CardContent className="p-6 text-center space-y-3">
              <motion.div 
                className="text-4xl font-bold text-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                {learningPaths.length}
              </motion.div>
              <p className="text-sm font-medium text-muted-foreground">Learning Paths</p>
              <div className="flex justify-center">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                  Recommended courses
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{ hidden: { y: 30, opacity: 0, scale: 0.8 }, visible: { y: 0, opacity: 1, scale: 1 } }}>
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-strong h-full hover-lift group">
            <CardContent className="p-6 text-center space-y-3">
              <motion.div 
                className="text-4xl font-bold text-purple-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                {jobSuggestions.length}
              </motion.div>
              <p className="text-sm font-medium text-muted-foreground">Job Matches</p>
              <div className="flex justify-center">
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                  Perfect matches
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <Tabs defaultValue="overview" className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 p-1 rounded-xl shadow-medium">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {roleFitResult && <FitScoreCard score={roleFitResult.score} justification={roleFitResult.justification} strengths={roleFitResult.strengths} improvements={roleFitResult.improvements}/>}
              {skillGaps.length > 0 && <SkillGapView skillGaps={skillGaps.slice(0, 5)} />}
            </div>
          </TabsContent>
          <TabsContent value="skills" className="space-y-8"><SkillGapView skillGaps={skillGaps} /></TabsContent>
          <TabsContent value="personality" className="space-y-8">{personalityProfile && <PersonalityChart profile={personalityProfile} />}</TabsContent>
          <TabsContent value="learning" className="space-y-8"><LearningPathList learningPaths={learningPaths} /></TabsContent>
          <TabsContent value="jobs" className="space-y-8">
            <JobSuggestionList jobSuggestions={jobSuggestions} />
          </TabsContent>
          <TabsContent value="feedback" className="space-y-8">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-strong">
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <motion.div
                    className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    <MessageSquare className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Comprehensive Feedback Report
                  </span>
                </CardTitle>
                <CardDescription className="text-base">AI-generated insights and career guidance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                {finalFeedback ? (
                  <>
                    <motion.div 
                      className="text-center p-8 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl border border-primary/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div 
                        className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                      >
                        {finalFeedback.overallReadinessScore !== undefined ? finalFeedback.overallReadinessScore : 0}/100
                      </motion.div>
                      <p className="text-lg font-medium text-muted-foreground">Overall Readiness Score</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                        <motion.div
                          className="bg-gradient-to-r from-primary to-purple-500 h-3 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${finalFeedback.overallReadinessScore || 0}%` }}
                          transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <h4 className="font-bold text-foreground mb-4 text-xl flex items-center gap-2">
                        📋 Summary
                      </h4>
                      <p className="text-foreground/80 leading-relaxed text-lg bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                        {finalFeedback.summary || 'No summary available'}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-bold text-foreground mb-4 text-lg flex items-center gap-2">
                          💪 Strengths
                        </h4>
                        {finalFeedback.strengths && finalFeedback.strengths.length > 0 ? (
                          <ul className="space-y-3">
                            {finalFeedback.strengths.map((strength: any, index: number) => (
                              <motion.li 
                                key={index} 
                                className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.3 }}
                              >
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-foreground/80 font-medium">{typeof strength === 'string' ? strength : (strength.area || strength.suggestion || 'Strength')}</span>
                              </motion.li>
                            ))}
                          </ul>
                        ) : (<p className="text-muted-foreground">No strengths identified</p>)}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-4 text-lg flex items-center gap-2">
                          🎯 Areas for Improvement
                        </h4>
                        {finalFeedback.areasForImprovement && finalFeedback.areasForImprovement.length > 0 ? (
                          <ul className="space-y-3">
                            {finalFeedback.areasForImprovement.map((area: any, index: number) => (
                              <motion.li 
                                key={index} 
                                className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index, duration: 0.3 }}
                              >
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-foreground/80 font-medium">{typeof area === 'string' ? area : (area.area || area.suggestion || 'Area for improvement')}</span>
                              </motion.li>
                            ))}
                          </ul>
                        ) : (<p className="text-muted-foreground">No areas for improvement identified</p>)}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-4 text-xl flex items-center gap-2">
                        🚀 Key Recommendations
                      </h4>
                      {finalFeedback.keyRecommendations && finalFeedback.keyRecommendations.length > 0 ? (
                        <div className="space-y-4">
                          {finalFeedback.keyRecommendations.map((rec: any, index: number) => (
                            <motion.div 
                              key={index} 
                              className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index, duration: 0.4 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <p className="text-foreground/80 font-medium leading-relaxed">{renderRecommendation(rec) || 'No recommendation provided'}</p>
                            </motion.div>
                          ))}
                        </div>
                      ) : (<p className="text-muted-foreground">No specific recommendations available</p>)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-4 text-xl flex items-center gap-2">
                        📝 Next Steps
                      </h4>
                      {finalFeedback.nextSteps && finalFeedback.nextSteps.length > 0 ? (
                        <ol className="space-y-4">
                          {finalFeedback.nextSteps.map((step: any, index: number) => (
                            <motion.li 
                              key={index} 
                              className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index, duration: 0.4 }}
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <span className="text-foreground/80 font-medium leading-relaxed">{typeof step === 'string' ? step : (step.recommendation || step.suggestion || 'Next step')}</span>
                            </motion.li>
                          ))}
                        </ol>
                      ) : (<p className="text-muted-foreground">No next steps provided</p>)}
                    </div>
                    <motion.div 
                      className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl text-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <p className="text-green-600 dark:text-green-400 font-semibold text-lg">
                        🌟 {finalFeedback.encouragement || 'Keep working on your career development!'}
                      </p>
                    </motion.div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Feedback analysis in progress</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      <motion.div 
        className="flex flex-col sm:flex-row justify-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            onClick={runAgentPipeline} 
            className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-300"
          >
            <RefreshCw className="w-5 h-5" />
            Re-analyze Resume
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            variant="outline" 
            className="flex items-center gap-3 px-8 py-3 border-2 border-primary/20 hover:border-primary/40 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            Download Report
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};