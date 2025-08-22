import React, { useState } from 'react';
import { Briefcase, Code, Database, Smartphone, Cloud, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { JobRole } from '../types';

interface RoleSelectionProps {
  onRoleSelected: (role: JobRole) => void;
  selectedRole?: JobRole;
}

const availableRoles: JobRole[] = [
  {
    id: 'frontend-dev',
    title: 'Frontend Developer',
    description: 'Build user interfaces and web applications using modern frameworks',
    requiredSkills: ['JavaScript', 'React', 'CSS', 'HTML', 'TypeScript', 'Responsive Design'],
    experience: '0-2 years',
    salary: '$70,000 - $95,000',
    location: 'Remote / San Francisco'
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer',
    description: 'Develop server-side applications and APIs',
    requiredSkills: ['Node.js', 'Python', 'Database Design', 'API Development', 'Docker', 'AWS'],
    experience: '1-3 years',
    salary: '$75,000 - $105,000',
    location: 'Remote / New York'
  },
  {
    id: 'fullstack-dev',
    title: 'Full Stack Developer',
    description: 'Work on both frontend and backend development',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'System Design', 'Git'],
    experience: '2-4 years',
    salary: '$80,000 - $120,000',
    location: 'Remote / Austin'
  },
  {
    id: 'mobile-dev',
    title: 'Mobile Developer',
    description: 'Create mobile applications for iOS and Android platforms',
    requiredSkills: ['React Native', 'Swift', 'Kotlin', 'Mobile UI/UX', 'App Store Optimization'],
    experience: '1-3 years',
    salary: '$75,000 - $110,000',
    location: 'Remote / Seattle'
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    description: 'Analyze data and build machine learning models',
    requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow', 'Data Visualization'],
    experience: '2-4 years',
    salary: '$85,000 - $130,000',
    location: 'Remote / Boston'
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    description: 'Manage infrastructure and deployment pipelines',
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Infrastructure as Code'],
    experience: '2-5 years',
    salary: '$85,000 - $125,000',
    location: 'Remote / Denver'
  }
];

const roleIcons: { [key: string]: React.ReactNode } = {
  'frontend-dev': <Code className="w-6 h-6" />,
  'backend-dev': <Database className="w-6 h-6" />,
  'fullstack-dev': <Briefcase className="w-6 h-6" />,
  'mobile-dev': <Smartphone className="w-6 h-6" />,
  'data-scientist': <Brain className="w-6 h-6" />,
  'devops-engineer': <Cloud className="w-6 h-6" />
};

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelected, selectedRole }) => {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <motion.h2 
          className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Select Your Target Role
        </motion.h2>
        <motion.p 
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Choose the role you're interested in to get personalized job matching analysis
        </motion.p>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        {availableRoles.map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-500 group relative overflow-hidden ${
                selectedRole?.id === role.id
                  ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-strong border-blue-200 dark:border-blue-700'
                  : 'hover:shadow-strong hover:border-blue-300 dark:hover:border-blue-600 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm'
              }`}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              onClick={() => onRoleSelected(role)}
            >
              {/* Animated background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                selectedRole?.id === role.id ? 'opacity-100' : ''
              }`} />
              
              <CardHeader className="pb-4 relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <motion.div 
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      selectedRole?.id === role.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-medium'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500 group-hover:text-white'
                    }`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {roleIcons[role.id]}
                  </motion.div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {role.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{role.experience}</p>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {role.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 relative z-10">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Key Skills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {role.requiredSkills.slice(0, 4).map((skill, skillIndex) => (
                        <motion.span
                          key={skill}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium transition-all duration-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * skillIndex, duration: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          {skill}
                        </motion.span>
                      ))}
                      {role.requiredSkills.length > 4 && (
                        <motion.span 
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium"
                          whileHover={{ scale: 1.05 }}
                        >
                          +{role.requiredSkills.length - 4} more
                        </motion.span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                      💰 {role.salary}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      📍 {role.location}
                    </span>
                  </div>
                </div>
              </CardContent>
              
              {/* Selection indicator */}
              {selectedRole?.id === role.id && (
                <motion.div
                  className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {selectedRole && (
        <motion.div 
          className="mt-12 p-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm shadow-medium"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-start gap-6">
            <motion.div 
              className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-medium"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 150 }}
            >
              {roleIcons[selectedRole.id]}
            </motion.div>
            <div className="flex-1 space-y-4">
              <div>
                <motion.h3 
                  className="text-2xl font-bold text-foreground"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {selectedRole.title}
                </motion.h3>
                <motion.p 
                  className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Selected for analysis
                </motion.p>
              </div>
              <motion.p 
                className="text-muted-foreground leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {selectedRole.description}
              </motion.p>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    🎯 Experience Level:
                  </span>
                  <p className="text-muted-foreground font-medium">{selectedRole.experience}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    💰 Salary Range:
                  </span>
                  <p className="text-green-600 dark:text-green-400 font-semibold">{selectedRole.salary}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    📍 Location:
                  </span>
                  <p className="text-muted-foreground font-medium">{selectedRole.location}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

              selectedRole?.id === role.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : hoveredRole === role.id
                ? 'shadow-md'
                : ''
            }`}
            onMouseEnter={() => setHoveredRole(role.id)}
            onMouseLeave={() => setHoveredRole(null)}
            onClick={() => onRoleSelected(role)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  selectedRole?.id === role.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {roleIcons[role.id]}
                </div>
                <div>
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                  <p className="text-sm text-gray-500">{role.experience}</p>
                </div>
              </div>
              <CardDescription className="text-sm">
                {role.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Key Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.requiredSkills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {role.requiredSkills.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{role.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-green-600">{role.salary}</span>
                  <span className="text-gray-500">{role.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRole && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              {roleIcons[selectedRole.id]}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{selectedRole.title}</h3>
              <p className="text-blue-600">Selected for analysis</p>
            </div>
          </div>
          <p className="text-gray-700 mb-4">{selectedRole.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Experience Level:</span>
              <p className="text-gray-600">{selectedRole.experience}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Salary Range:</span>
              <p className="text-green-600 font-medium">{selectedRole.salary}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <p className="text-gray-600">{selectedRole.location}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};