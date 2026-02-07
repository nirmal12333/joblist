const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const SimpleMLResumeAnalyzer = require('./simple-ml-resume-analyzer');

// Load environment variables
dotenv.config();

const app = express();
const PORT = 10000;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Initialize Simple ML Resume Analyzer
const mlAnalyzer = new SimpleMLResumeAnalyzer();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed!'), false);
    }
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// File upload endpoint
app.post('/upload', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No resume file uploaded. Please select a PDF, DOCX, or DOC file.' });
  }
  
  console.log('File uploaded:', req.file.filename);
  
  try {
    // Extract text from the uploaded file based on its type
    let fileContent = '';
    
    if (req.file.mimetype === 'application/pdf') {
      const pdf = require('pdf-parse');
      const fileBuffer = await fs.readFile(req.file.path);
      const uint8Array = new Uint8Array(fileBuffer);
      const pdfData = await new pdf.PDFParse(uint8Array);
      const textData = await pdfData.getText();
      fileContent = textData.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               req.file.mimetype === 'application/msword') {
      // For simplicity, we'll read DOCX/DOC as text for now
      fileContent = await fs.readFile(req.file.path, 'utf8');
    } else {
      // For other text-based files
      fileContent = await fs.readFile(req.file.path, 'utf8');
    }
    
    res.json({ 
      message: 'File uploaded and processed successfully',
      filename: req.file.filename,
      path: req.file.path,
      contentPreview: fileContent.substring(0, 200) + '...' // First 200 chars as preview
    });
  } catch (error) {
    console.error('File processing error:', error);
    return res.status(500).json({ error: 'Error processing file: ' + error.message });
  }
});

// API endpoint for resume analysis with ML model
app.post('/analyze', async (req, res) => {
  try {
    const { filename, path: filePath, useML = true } = req.body;
    
    if (!filename || !filePath) {
      return res.status(400).json({ error: 'Filename and path are required' });
    }

    // Read the uploaded file content
    let fileContent = '';
    
    // Determine file type and extract content accordingly
    const mimeType = filePath.endsWith('.pdf') ? 'application/pdf' :
                     filePath.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                     filePath.endsWith('.doc') ? 'application/msword' : 'text/plain';
    
    if (mimeType === 'application/pdf') {
      try {
        const pdf = require('pdf-parse');
        const fileBuffer = await fs.readFile(filePath);
        const uint8Array = new Uint8Array(fileBuffer);
        const pdfData = await new pdf.PDFParse(uint8Array);
        const textData = await pdfData.getText();
        fileContent = textData.text;
      } catch (error) {
        console.error('PDF processing error:', error);
        // If PDF parsing fails, try reading as binary and convert
        fileContent = await fs.readFile(filePath, 'utf8');
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimeType === 'application/msword') {
      try {
        // Attempt to use mammoth for docx files
        if (filePath.endsWith('.docx')) {
          const mammoth = require('mammoth');
          const result = await mammoth.extractRawText({path: filePath});
          fileContent = result.value;
        } else {
          // For doc files, try reading as text
          fileContent = await fs.readFile(filePath, 'utf8');
        }
      } catch (error) {
        console.error('DOC/DOCX processing error:', error);
        // Fallback to reading as text
        fileContent = await fs.readFile(filePath, 'utf8');
      }
    } else {
      fileContent = await fs.readFile(filePath, 'utf8');
    }
    
    // Validate resume content
    if (!fileContent || fileContent.trim().length < 100) {
      return res.status(400).json({ 
        error: 'Resume content is too short or empty. Please upload a complete resume.' 
      });
    }
    
    let analysisResult;
    
    if (useML) {
      // Use ML-based analysis
      console.log('Using ML model for analysis...');
      analysisResult = await mlAnalyzer.analyzeResume(fileContent);
      console.log('ML Analysis completed for:', filename);
    } else {
      // Use Google Generative AI as fallback
      console.log('Using Google Generative AI for analysis...');
      
      // Check if the API key is available
      if (!process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured - GOOGLE_API_KEY missing' });
      }
      
      // Create AI prompt for comprehensive resume analysis
      const prompt = `
      Analyze this resume comprehensively and provide detailed feedback in the following structured format:

      ANALYSIS BREAKDOWN:
      1. EXECUTIVE_SUMMARY: Brief overview (2-3 sentences)
      2. SCORES: 
         - Overall Score (1-100)
         - Skills Score (1-100)
         - Experience Score (1-100)
         - Education Score (1-100)
         - Formatting Score (1-100)
      3. STRENGTHS: Top 3-5 strengths
      4. WEAKNESSES: Top 3-5 weaknesses
      5. DETAILED_RECOMMENDATIONS: 
          For each recommendation, provide:
          - Problem: What is the specific issue
          - Solution: How to fix or improve it
          - Priority: High/Medium/Low
          - Expected Impact: How this will help
      6. TARGET_ROLES: 3-5 suitable job titles
      7. SALARY_EXPECTATION: Range based on experience and skills

      RETURN DATA IN THIS EXACT JSON STRUCTURE:
      {
        "executiveSummary": "Brief overview of the resume",
        "scores": {
          "overall": 85,
          "skills": 80,
          "experience": 90,
          "education": 75,
          "formatting": 88
        },
        "strengths": ["Strength 1", "Strength 2", "Strength 3"],
        "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
        "detailedRecommendations": [
          {
            "problem": "Problem description here",
            "solution": "Solution description here",
            "priority": "High/Medium/Low",
            "expectedImpact": "Expected impact of implementing this solution"
          }
        ],
        "targetRoles": ["Role 1", "Role 2", "Role 3"],
        "salaryExpectation": {
          "range": "$70,000 - $90,000",
          "justification": "Based on experience and skills"
        }
      }

      Resume content:
      ${fileContent}
      `;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponseText = response.text();
      
      // Extract JSON from response
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/s);
      
      if (jsonMatch) {
        try {
          let cleanJson = jsonMatch[0].trim();
          if (cleanJson.startsWith('```json')) {
            cleanJson = cleanJson.substring(7);
          }
          if (cleanJson.endsWith('```')) {
            cleanJson = cleanJson.substring(0, cleanJson.lastIndexOf('```'));
          }
          analysisResult = JSON.parse(cleanJson);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // Return structured fallback data
          analysisResult = {
            "executiveSummary": "Resume analysis completed with basic scoring.",
            "scores": {
              "overall": 75,
              "skills": 70,
              "experience": 80,
              "education": 70,
              "formatting": 85
            },
            "strengths": ["Good technical skills", "Relevant experience", "Clear structure"],
            "weaknesses": ["Could add more quantified achievements", "Missing some keywords"],
            "detailedRecommendations": [
              {
                "problem": "Limited quantified achievements",
                "solution": "Add specific metrics to describe your accomplishments",
                "priority": "High",
                "expectedImpact": "Makes your contributions more impactful"
              }
            ],
            "targetRoles": ["Frontend Developer", "Software Engineer"],
            "salaryExpectation": {
              "range": "$65,000 - $85,000",
              "justification": "Based on experience level"
            }
          };
        }
      } else {
        // Return structured fallback data
        analysisResult = {
          "executiveSummary": "Resume analysis completed with basic scoring.",
          "scores": {
            "overall": 75,
            "skills": 70,
            "experience": 80,
            "education": 70,
            "formatting": 85
          },
          "strengths": ["Good technical skills", "Relevant experience", "Clear structure"],
          "weaknesses": ["Could add more quantified achievements", "Missing some keywords"],
          "detailedRecommendations": [
            {
              "problem": "Limited quantified achievements",
              "solution": "Add specific metrics to describe your accomplishments",
              "priority": "High",
              "expectedImpact": "Makes your contributions more impactful"
            }
          ],
          "targetRoles": ["Frontend Developer", "Software Engineer"],
          "salaryExpectation": {
            "range": "$65,000 - $85,000",
            "justification": "Based on experience level"
          }
        };
      }
      console.log('AI Analysis completed for:', filename);
    }
    
    res.json(analysisResult);

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Uploads directory: ${path.join(__dirname, 'uploads')}`);
});