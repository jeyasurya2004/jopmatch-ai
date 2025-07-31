import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { SkillGap } from '../types';

interface SkillGapViewProps {
  skillGaps: SkillGap[];
}

export const SkillGapView: React.FC<SkillGapViewProps> = ({ skillGaps }) => {
  const chartData = skillGaps.map(gap => ({
    skill: gap.skill.length > 15 ? gap.skill.substring(0, 15) + '...' : gap.skill,
    fullSkill: gap.skill,
    current: gap.currentLevel,
    required: gap.requiredLevel,
    gap: gap.gap
  }));

  const getGapColor = (gap: number) => {
    if (gap >= 60) return '#ef4444'; // red
    if (gap >= 40) return '#f97316'; // orange
    if (gap >= 20) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-6 h-6 text-red-500" />
          Skill Gap Analysis
        </CardTitle>
        <CardDescription>
          Comparison between your current skills and role requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        {skillGaps.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No significant skill gaps detected!</p>
            <p className="text-sm text-gray-400 mt-1">You're well-matched for this role</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="skill" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'current' ? 'Current Level' : 
                      name === 'required' ? 'Required Level' : 'Gap'
                    ]}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.skill === label);
                      return item?.fullSkill || label;
                    }}
                  />
                  <Bar dataKey="current" fill="#3b82f6" name="current" />
                  <Bar dataKey="required" fill="#e5e7eb" name="required" />
                  <Bar dataKey="gap" name="gap">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getGapColor(entry.gap)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Skill Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Priority Skills to Develop</h4>
              {skillGaps.slice(0, 5).map((gap) => (
                <div key={gap.skill} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{gap.skill}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        gap.gap >= 60 ? 'bg-red-100 text-red-700' :
                        gap.gap >= 40 ? 'bg-orange-100 text-orange-700' :
                        gap.gap >= 20 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {Math.round(gap.gap)}% gap
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Current: {Math.round(gap.currentLevel)}% → Target: {Math.round(gap.requiredLevel)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">
                      Priority: {gap.importance >= 80 ? 'High' : gap.importance >= 60 ? 'Medium' : 'Low'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};