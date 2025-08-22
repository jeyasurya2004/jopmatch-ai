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
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="w-full max-w-3xl mx-auto shadow-strong border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200/50 dark:border-gray-700/50">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CardTitle className="flex items-center gap-3 text-2xl">
              <motion.div
                className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                whileHover={{ rotate: 5, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Upload Your Resume
              </span>
            </CardTitle>
            <CardDescription className="text-base mt-2 text-muted-foreground">
              Upload your resume in PDF, DOCX, image, or text format. Our AI will analyze your information with precision.
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          <motion.div
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 scale-105' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/30 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10'
            } ${uploading ? 'pointer-events-none opacity-70' : 'hover:scale-102'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            whileHover={{ scale: uploading ? 1 : 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.txt,.docx"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {uploading ? (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <motion.div
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity }
                      }}
                    >
                      <Upload className="w-16 h-16 text-blue-500 mx-auto" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-xl font-semibold text-foreground">Processing Resume...</p>
                      <motion.div 
                        className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                ) : uploadStatus === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-green-600 space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle className="w-16 h-16 mx-auto drop-shadow-lg" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-xl font-semibold">Resume Processed Successfully!</p>
                      <motion.p 
                        className="text-sm text-muted-foreground bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full inline-block"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        📄 {fileName}
                      </motion.p>
                    </div>
                  </motion.div>
                ) : uploadStatus === 'error' ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="text-red-600 space-y-4"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <AlertCircle className="w-16 h-16 mx-auto drop-shadow-lg" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-xl font-semibold">Upload Failed</p>
                      <p className="text-sm text-muted-foreground">Please try a valid file format (PDF, DOCX, JPG, PNG, TXT).</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Upload className="w-16 h-16 text-blue-500 mx-auto drop-shadow-lg" />
                    </motion.div>
                    <div className="space-y-3">
                      <p className="text-xl font-semibold text-foreground">
                        Drag and drop your resume here
                      </p>
                      <p className="text-muted-foreground">
                        or click to browse files
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {['PDF', 'DOCX', 'JPG', 'PNG', 'TXT'].map((format, index) => (
                          <motion.span
                            key={format}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * index, duration: 0.3 }}
                            whileHover={{ scale: 1.1 }}
                          >
                            {format}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
