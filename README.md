# JobMatch AI: Role-Fit Recommendation System

A comprehensive AI-powered career matching platform that helps students find their perfect job roles through intelligent resume analysis, skill gap identification, and personalized learning recommendations.

## 🚀 Features

### Core Functionality
- **AI Resume Analysis**: Upload resumes (PDF, images, text) and extract structured data using advanced LLM models
- **Role-Fit Scoring**: Get precise compatibility scores for different job roles
- **Skill Gap Analysis**: Identify missing skills and proficiency levels with interactive visualizations
- **Personality Profiling**: Big Five personality analysis based on resume content
- **Learning Path Recommendations**: Personalized course suggestions from top platforms
- **Job Matching**: AI-curated job suggestions based on skills and preferences
- **Comprehensive Feedback**: Human-like career guidance and actionable advice

### 🧠 7 AI Agents Architecture

1. **Data Agent** (`meta-llama/llama-3.1-70b-versatile`)
   - Extracts structured data from resumes (PDF, images, text)
   - Handles vision-based resume parsing for image uploads

2. **Skill Analyzer Agent** (`mixtral-8x7b-32768`)
   - Analyzes technical and soft skills with proficiency levels
   - Identifies skill gaps compared to job requirements

3. **Career Fit Agent** (`gemma-7b-it`)
   - Calculates role-fit scores and compatibility analysis
   - Provides detailed justification and recommendations

4. **Personality Agent** (`llama3-70b-8192`)
   - Generates Big Five personality profiles
   - Analyzes communication style, teamwork, and leadership potential

5. **Recommendation Agent** (`mixtral-8x7b-32768`)
   - Suggests relevant courses and learning paths
   - Provides step-by-step skill development plans

6. **Job Fetcher Agent** (`llama3-8b-8192`)
   - Generates realistic job suggestions
   - Matches opportunities based on skills and experience

7. **Feedback Agent** (`llama3-70b-8192`)
   - Creates comprehensive career feedback reports
   - Provides encouragement and actionable next steps

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts for data visualization
- **AI/LLM**: Groq API with LLaMA models
- **Backend**: Firebase (Firestore + Authentication + Storage)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Groq API key (get from [console.groq.com](https://console.groq.com/keys))
- Firebase project (optional, for production)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd jobmatch-ai
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

3. **Add your Groq API key to `.env`**:
```env
VITE_GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser** to `http://localhost:5173`

## 📖 Usage Guide

### For Students

1. **Upload Resume**: Drag and drop your resume (PDF, JPG, PNG, TXT, DOC)
2. **Select Target Role**: Choose from 6 predefined tech roles or specify custom role
3. **Get AI Analysis**: Receive comprehensive analysis including:
   - Role-fit score with detailed justification
   - Skill gap analysis with interactive charts
   - Personality profile based on Big Five model
   - Personalized learning paths with course recommendations
   - Job suggestions matching your profile

### For Recruiters/Admins

- **Student Dashboard Overview**: View aggregated student readiness scores
- **Skill Analytics**: Analyze skill trends and gaps across student population
- **Export Reports**: Download detailed PDF reports for individual students
- **Real-time Insights**: Track student progress and job readiness metrics

## 🎨 Design Features

- **Modern UI**: Clean, professional interface with gradient accents
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Interactive Charts**: Skill gap radar charts, personality spider diagrams
- **Smooth Animations**: Micro-interactions and loading states
- **Accessibility**: WCAG compliant with proper contrast ratios
- **Dark Mode Ready**: Prepared for dark theme implementation

## 🔧 Configuration

### Groq API Models Used
- `meta-llama/llama-3.1-70b-versatile`: Data extraction and personality analysis
- `mixtral-8x7b-32768`: Skill analysis and recommendations
- `gemma-7b-it`: Career fit analysis
- `llama3-70b-8192`: Personality and feedback generation
- `llama3-8b-8192`: Job suggestions
- `llama-3.2-11b-vision-preview`: Image-based resume parsing

### Firebase Setup (Optional)
For production deployment with user authentication and data persistence:

1. Create a Firebase project
2. Enable Firestore, Authentication, and Storage
3. Add Firebase config to `.env` file
4. Update Firebase rules for security

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
The app is ready for deployment to any static hosting service. Make sure to:
1. Set environment variables in your hosting platform
2. Configure build settings (`npm run build`, `dist` folder)
3. Set up proper redirects for SPA routing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** for providing fast LLM inference
- **Meta** for LLaMA models
- **Mistral AI** for Mixtral models
- **Google** for Gemma models
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

## 📞 Support

For support, email support@jobmatch-ai.com or join our Discord community.

---

**Built with ❤️ for students and recruiters worldwide**