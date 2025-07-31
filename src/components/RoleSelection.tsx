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
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Target Role</h2>
        <p className="text-lg text-gray-600">
          Choose the role you're interested in to get personalized job matching analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableRoles.map((role) => (
          <Card
            key={role.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
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