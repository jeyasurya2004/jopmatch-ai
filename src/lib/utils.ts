import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function getSkillLevelColor(level: number): string {
  if (level >= 80) return "text-green-600"
  if (level >= 60) return "text-yellow-600"
  return "text-red-600"
}