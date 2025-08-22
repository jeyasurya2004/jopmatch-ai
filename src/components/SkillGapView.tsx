import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Target } from 'lucide-react';
import { SkillGap } from '../types';

interface SkillGapViewProps {
  skillGaps: SkillGap[];
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({ skillGaps }) => {
  const chartData = skillGaps.map(gap => ({
    name: gap.skill,
    current: gap.currentLevel,
    required: gap.requiredLevel,
    gap: gap.gap
  }));

  const getPriorityColor = (priority: 'Low' | 'Medium' | 'High') => {
    switch (priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const getGapColor = (gap: number) => {
    if (gap > 50) return '#ef4444'; // red-500
    if (gap > 20) return '#f59e0b'; // amber-500
    return '#22c55e'; // green-500
  };

  return (
    <Card className="bg-card text-card-foreground border-border shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Skill Gap Analysis
        </CardTitle>
        <CardDescription>
          Comparison between your current skills and role requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }} 
              />
              <Bar dataKey="current" fill="var(--primary)" name="Current Level" radius={[4, 4, 0, 0]} />
              <Bar dataKey="required" fill="var(--secondary)" name="Required Level" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-4">Priority Skills to Develop</h4>
          <div className="space-y-4">
            {skillGaps.map((gap, index) => (
              <motion.div 
                key={index} 
                className="p-4 rounded-lg bg-background/50 border border-border"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-foreground">{gap.skill}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: getGapColor(gap.gap), color: '#fff' }}>
                        {gap.gap}% gap
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {gap.currentLevel}% &mdash; Target: {gap.requiredLevel}%
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className={`text-sm font-semibold ${getPriorityColor(gap.priority || 'Low')}`}>
                      Priority: {gap.priority || 'Low'}
                    </span>
                  </div>
                </div>
                <Progress value={gap.currentLevel} className="mt-3 h-2" />
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};