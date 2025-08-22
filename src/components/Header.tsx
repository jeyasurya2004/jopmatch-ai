import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Moon, Sun, User, LogOut, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentStep: 'upload' | 'role' | 'dashboard';
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, onReset }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.header 
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-soft"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-4 cursor-pointer group" 
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-medium group-hover:shadow-strong transition-all duration-300"
              whileHover={{ rotate: 5 }}
            >
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <motion.h1 
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
              >
                JobMatch AI
              </motion.h1>
              <p className="text-sm text-muted-foreground font-medium">Role-Fit Recommendation System</p>
            </div>
          </motion.div>
          
          {/* Progress Indicator - Mobile Responsive */}
          <div className="hidden md:flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50">
            <motion.div 
              className={`w-4 h-4 rounded-full transition-all duration-500 ${
                currentStep === 'upload' ? 'bg-blue-600 shadow-glow-primary' : 'bg-green-500 shadow-glow-success'
              }`}
              animate={{ scale: currentStep === 'upload' ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: currentStep === 'upload' ? Infinity : 0 }}
            />
            <motion.div 
              className={`w-12 h-1 rounded-full transition-all duration-500 ${
                currentStep !== 'upload' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: currentStep !== 'upload' ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.div 
              className={`w-4 h-4 rounded-full transition-all duration-500 ${
                currentStep === 'role' ? 'bg-blue-600 shadow-glow-primary' : 
                currentStep === 'dashboard' ? 'bg-green-500 shadow-glow-success' : 
                'bg-gray-300 dark:bg-gray-600'
              }`}
              animate={{ scale: currentStep === 'role' ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: currentStep === 'role' ? Infinity : 0 }}
            />
            <motion.div 
              className={`w-12 h-1 rounded-full transition-all duration-500 ${
                currentStep === 'dashboard' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: currentStep === 'dashboard' ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <motion.div 
              className={`w-4 h-4 rounded-full transition-all duration-500 ${
                currentStep === 'dashboard' ? 'bg-blue-600 shadow-glow-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              animate={{ scale: currentStep === 'dashboard' ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: currentStep === 'dashboard' ? Infinity : 0 }}
            />
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <motion.div 
              className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-3 py-2 rounded-full border border-gray-200/50 dark:border-gray-700/50"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={{ rotate: theme === 'light' ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <Sun className="w-4 h-4 text-amber-500" />
              </motion.div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-blue-600 transition-all duration-300"
              />
              <motion.div
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <Moon className="w-4 h-4 text-blue-400" />
              </motion.div>
            </motion.div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:bg-primary/10 transition-all duration-300">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                      {user?.displayName ? getInitials(user.displayName) : 
                       user?.email ? getInitials(user.email) : 'U'}
                    </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-strong" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2 p-2">
                    <p className="text-sm font-semibold leading-none text-foreground">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground font-medium">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-primary/10 transition-colors duration-200">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
};