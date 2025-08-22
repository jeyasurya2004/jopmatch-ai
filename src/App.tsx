import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { ResumeUpload } from './components/ResumeUpload';
import { RoleSelection } from './components/RoleSelection';
import { Dashboard } from './components/Dashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ResumeData, JobRole } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<'upload' | 'role' | 'dashboard'>('upload');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);

  const handleResumeProcessed = (data: ResumeData) => {
    setResumeData(data);
    setCurrentStep('role');
  };

  const handleRoleSelected = (role: JobRole) => {
    setSelectedRole(role);
    setCurrentStep('dashboard');
  };

  const resetToStart = () => {
    setCurrentStep('upload');
    setResumeData(null);
    setSelectedRole(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary absolute top-0 left-0"></div>
          </div>
          <motion.p 
            className="text-muted-foreground font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading your experience...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <Header currentStep={currentStep} onReset={resetToStart} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div 
              key="upload"
              className="space-y-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
                >
                  <h2 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
                    Get AI-Powered Career Insights
                  </h2>
                </motion.div>
                <motion.p 
                  className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  Upload your resume and discover your perfect job match with personalized recommendations, 
                  skill gap analysis, and learning paths powered by advanced AI.
                </motion.p>
                <motion.div
                  className="flex flex-wrap justify-center gap-6 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  {[
                    { icon: "🤖", text: "AI-Powered Analysis" },
                    { icon: "📊", text: "Skill Gap Insights" },
                    { icon: "🎯", text: "Career Matching" },
                    { icon: "📚", text: "Learning Paths" }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.text}
                      className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full border border-white/20 dark:border-gray-700/50"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                    >
                      <span className="text-lg">{feature.icon}</span>
                      <span className="text-sm font-medium text-foreground/80">{feature.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <ResumeUpload onResumeProcessed={handleResumeProcessed} />
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'role' && resumeData && (
            <motion.div 
              key="role"
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-center">
                <motion.div 
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-700 dark:text-green-300 px-6 py-3 rounded-full mb-6 backdrop-blur-sm"
                  initial={{ opacity: 0, scale: 0.8, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.span 
                    className="w-3 h-3 bg-green-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="font-medium">Resume processed successfully for {resumeData.name}</span>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <RoleSelection onRoleSelected={handleRoleSelected} selectedRole={selectedRole || undefined} />
              </motion.div>
            </motion.div>
          )}

          {currentStep === 'dashboard' && resumeData && selectedRole && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Dashboard resumeData={resumeData} selectedRole={selectedRole} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Powered by advanced AI agents using Groq API and LLaMA models
              </p>
              <p className="text-muted-foreground">
                Helping students find their perfect career match through intelligent analysis
              </p>
              <div className="flex justify-center items-center gap-2 mt-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;