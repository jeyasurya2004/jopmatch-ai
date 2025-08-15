import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { agentOrchestrator } from '../services/AgentOrchestrator';
import { ResumeData } from '../types';
import mammoth from 'mammoth'; // Import the new, secure DOCX parser

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
    // Updated file type check to include docx
    const allowedTypes = ['application/pdf', 'image/', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      console.error('Unsupported file type:', file.type);
      setUploadStatus('error');
      return;
    }

    setUploading(true);
    setFileName(file.name);
    setUploadStatus('idle');

    try {
      let fileContent: string;
      let fileTypeForAgent = file.type;

      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle .docx files securely with mammoth
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fileContent = result.value;
        fileTypeForAgent = 'text/plain'; // Treat the extracted text as plain text for the agent
      } else {
        // Handle other file types as before
        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          if (file.type.includes('image') || file.type === 'application/pdf') {
            reader.readAsDataURL(file);
          } else {
            reader.readAsText(file);
          }
        });
      }

      const results = await agentOrchestrator.processResume(fileContent, fileTypeForAgent);

      onResumeProcessed(results.resumeData);
      setUploadStatus('success');
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
          Upload your resume in PDF, DOCX, image, or text format. Our AI will analyze your information.
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
            accept=".pdf,.jpg,.jpeg,.png,.txt,.docx" // Updated accept attribute
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
                  <p className="text-lg font-medium">Resume Processed!</p>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Please try a valid file format.</p>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    Drag and drop your resume here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or click to browse files
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};
