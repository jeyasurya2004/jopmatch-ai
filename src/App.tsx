import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header currentStep={currentStep} onReset={resetToStart} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentStep === 'upload' && (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <motion.h2 
                className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Get AI-Powered Career Insights
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Upload your resume and discover your perfect job match with personalized recommendations, 
                skill gap analysis, and learning paths powered by advanced AI.
              </motion.p>
            </div>
            <ResumeUpload onResumeProcessed={handleResumeProcessed} />
          </motion.div>
        )}

        {currentStep === 'role' && resumeData && (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <motion.div 
                className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-full mb-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Resume processed successfully for {resumeData.name}
              </motion.div>
            </div>
            <RoleSelection onRoleSelected={handleRoleSelected} selectedRole={selectedRole || undefined} />
          </motion.div>
        )}

        {currentStep === 'dashboard' && resumeData && selectedRole && (
          <Dashboard resumeData={resumeData} selectedRole={selectedRole} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Powered by advanced AI agents using Groq API and LLaMA models
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Helping students find their perfect career match through intelligent analysis
            </p>
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