import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { agentOrchestrator } from '../services/AgentOrchestrator';
import { ResumeData } from '../types';

interface ResumeUploadProps {
  onResumeProcessed: (data: ResumeData) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onResumeProcessed }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf') && !file.type.includes('image') && !file.type.includes('text')) {
      setUploadStatus('error');
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setUploadStatus('idle');

    try {
      // Read file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        
        if (file.type.includes('image') || file.type === 'application/pdf') {
          // For images and PDFs, read as data URL
          reader.readAsDataURL(file);
        } else {
          // For text files, read as text
          reader.readAsText(file);
        }
      });

      // Process the resume through all agents
      const results = await agentOrchestrator.processResume(
        fileContent,
        file.type
      );

      // Pass the extracted resume data to the parent component
      onResumeProcessed(results.resumeData);
      setUploadStatus('success');
      
      // Log the complete results for debugging
      console.log('Agent processing complete:', results);
    } catch (error) {
      console.error('Error processing resume:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Upload Your Resume
        </CardTitle>
        <CardDescription>
          Upload your resume in PDF, image, or text format. Our AI will extract and analyze your information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {uploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="animate-pulse"
                >
                  <Upload className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Processing Resume...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Extracting your information using AI</p>
                </motion.div>
              ) : uploadStatus === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-green-600"
                >
                  <CheckCircle className="w-12 h-12 mx-auto" />
                  <p className="text-lg font-medium">Resume Processed Successfully!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{fileName}</p>
                </motion.div>
              ) : uploadStatus === 'error' ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-red-600"
                >
                  <AlertCircle className="w-12 h-12 mx-auto" />
                  <p className="text-lg font-medium">Upload Failed</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Please try again with a valid file format</p>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      Drag and drop your resume here
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      or click to browse files
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">PDF</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">JPG</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">PNG</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">TXT</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">DOC</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {uploadStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Ready for Analysis</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your resume has been processed and is ready for job matching analysis.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
};