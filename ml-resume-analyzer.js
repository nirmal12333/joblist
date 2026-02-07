const natural = require('natural');
const sw = require('stopword');
const tf = require('@tensorflow/tfjs-node');

class MLResumeAnalyzer {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.classifier = new natural.LogisticRegressionClassifier();
        
        // Industry keywords database
        this.industryKeywords = {
            'frontend': ['javascript', 'react', 'vue', 'angular', 'html', 'css', 'typescript', 'nodejs', 'webpack'],
            'backend': ['python', 'java', 'nodejs', 'express', 'mongodb', 'postgresql', 'api', 'rest', 'microservices'],
            'data_science': ['python', 'r', 'sql', 'pandas', 'numpy', 'machine learning', 'tensorflow', 'scikit-learn'],
            'devops': ['docker', 'kubernetes', 'aws', 'jenkins', 'ci/cd', 'terraform', 'ansible'],
            'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios']
        };
        
        // Skill scoring weights
        this.skillWeights = {
            'programming': 0.3,
            'frameworks': 0.25,
            'databases': 0.2,
            'tools': 0.15,
            'soft_skills': 0.1
        };
        
        this.trained = false;
    }
    
    // Preprocess resume text
    preprocessText(text) {
        // Convert to lowercase
        let processed = text.toLowerCase();
        
        // Remove special characters but keep important ones
        processed = processed.replace(/[^a-zA-Z0-9\s\-\/\+\#\.\@\_]/g, ' ');
        
        // Tokenize
        const tokens = this.tokenizer.tokenize(processed);
        
        // Remove stopwords
        const filteredTokens = sw.removeStopwords(tokens);
        
        // Stem words
        const stemmedTokens = filteredTokens.map(token => this.stemmer.stem(token));
        
        return stemmedTokens;
    }
    
    // Extract features from resume
    extractFeatures(resumeText) {
        const tokens = this.preprocessText(resumeText);
        const featureVector = {};
        
        // Count industry keywords
        Object.keys(this.industryKeywords).forEach(industry => {
            const keywords = this.industryKeywords[industry];
            const count = tokens.filter(token => 
                keywords.some(keyword => token.includes(keyword.toLowerCase().replace(/\s+/g, '')))
            ).length;
            
            featureVector[`industry_${industry}`] = count / tokens.length;
        });
        
        // Extract experience indicators
        const experiencePatterns = ['year', 'yr', 'experience', 'exp', 'intern', 'internship'];
        const experienceCount = tokens.filter(token => 
            experiencePatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['experience_indicators'] = experienceCount / tokens.length;
        
        // Extract education indicators
        const educationPatterns = ['bachelor', 'master', 'phd', 'degree', 'university', 'college'];
        const educationCount = tokens.filter(token => 
            educationPatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['education_indicators'] = educationCount / tokens.length;
        
        // Extract achievement indicators
        const achievementPatterns = ['achieve', 'award', 'recognition', 'certification', 'certified'];
        const achievementCount = tokens.filter(token => 
            achievementPatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['achievement_indicators'] = achievementCount / tokens.length;
        
        // Extract quantification indicators
        const quantificationPatterns = ['increase', 'decrease', 'improve', 'reduce', 'save', 'generate'];
        const quantificationCount = tokens.filter(token => 
            quantificationPatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['quantification_indicators'] = quantificationCount / tokens.length;
        
        return featureVector;
    }
    
    // Calculate similarity between resume and job requirements
    calculateSimilarity(resumeFeatures, jobRequirements) {
        let similarity = 0;
        let totalWeight = 0;
        
        Object.keys(jobRequirements).forEach(requirement => {
            if (resumeFeatures[requirement] !== undefined) {
                const weight = jobRequirements[requirement] || 1;
                similarity += resumeFeatures[requirement] * weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? similarity / totalWeight : 0;
    }
    
    // Score different sections of the resume
    scoreSections(resumeText) {
        const sections = {
            'skills': this.scoreSkillsSection(resumeText),
            'experience': this.scoreExperienceSection(resumeText),
            'education': this.scoreEducationSection(resumeText),
            'projects': this.scoreProjectsSection(resumeText),
            'formatting': this.scoreFormatting(resumeText)
        };
        
        return sections;
    }
    
    scoreSkillsSection(text) {
        const skillIndicators = ['skill', 'competency', 'proficiency', 'expertise', 'knowledge'];
        const tokens = this.preprocessText(text);
        const skillMentions = tokens.filter(token => 
            skillIndicators.some(indicator => token.includes(indicator))
        ).length;
        
        // Count technical keywords
        let technicalScore = 0;
        Object.values(this.industryKeywords).forEach(keywords => {
            const matches = tokens.filter(token => 
                keywords.some(keyword => token.includes(keyword.toLowerCase().replace(/\s+/g, '')))
            ).length;
            technicalScore = Math.max(technicalScore, matches);
        });
        
        return Math.min(100, (skillMentions * 10) + (technicalScore * 5));
    }
    
    scoreExperienceSection(text) {
        const experiencePatterns = ['experience', 'work', 'position', 'role', 'responsibility'];
        const tokens = this.preprocessText(text);
        const experienceMentions = tokens.filter(token => 
            experiencePatterns.some(pattern => token.includes(pattern))
        ).length;
        
        return Math.min(100, experienceMentions * 15);
    }
    
    scoreEducationSection(text) {
        const educationPatterns = ['education', 'degree', 'university', 'college', 'bachelor', 'master'];
        const tokens = this.preprocessText(text);
        const educationMentions = tokens.filter(token => 
            educationPatterns.some(pattern => token.includes(pattern))
        ).length;
        
        return Math.min(100, educationMentions * 20);
    }
    
    scoreProjectsSection(text) {
        const projectPatterns = ['project', 'portfolio', 'built', 'developed', 'created'];
        const tokens = this.preprocessText(text);
        const projectMentions = tokens.filter(token => 
            projectPatterns.some(pattern => token.includes(pattern))
        ).length;
        
        return Math.min(100, projectMentions * 25);
    }
    
    scoreFormatting(text) {
        // Check for proper structure indicators
        const structureScore = (text.match(/\n/g) || []).length > 5 ? 30 : 10;
        const bulletScore = (text.match(/[-•*]/g) || []).length > 3 ? 30 : 10;
        const sectionScore = (text.match(/:/g) || []).length > 2 ? 20 : 5;
        
        return Math.min(100, structureScore + bulletScore + sectionScore);
    }
    
    // Generate personalized recommendations
    generateRecommendations(resumeText, sections) {
        const recommendations = [];
        const tokens = this.preprocessText(resumeText);
        
        // Check for missing quantified achievements
        const quantificationPatterns = ['increase', 'decrease', 'improve', 'reduce', 'save', 'generate', '%', 'k', 'm'];
        const hasQuantification = quantificationPatterns.some(pattern => 
            resumeText.toLowerCase().includes(pattern)
        );
        
        if (!hasQuantification) {
            recommendations.push({
                problem: "Resume lacks quantified achievements",
                solution: "Add specific metrics to describe your accomplishments (e.g., 'Increased sales by 25%', 'Managed team of 5 developers')",
                priority: "High",
                expectedImpact: "Makes your contributions measurable and more impactful to employers"
            });
        }
        
        // Check for industry-specific keywords
        const missingKeywords = [];
        Object.entries(this.industryKeywords).forEach(([industry, keywords]) => {
            const matches = keywords.filter(keyword => 
                tokens.some(token => token.includes(keyword.toLowerCase().replace(/\s+/g, '')))
            );
            
            if (matches.length < 3) {
                missingKeywords.push(...keywords.slice(0, 3));
            }
        });
        
        if (missingKeywords.length > 0) {
            recommendations.push({
                problem: "Missing industry-standard keywords",
                solution: `Include relevant technical terms like: ${missingKeywords.slice(0, 5).join(', ')}`,
                priority: "Medium",
                expectedImpact: "Improves ATS compatibility and keyword matching"
            });
        }
        
        // Section-specific recommendations
        if (sections.experience < 60) {
            recommendations.push({
                problem: "Experience section needs improvement",
                solution: "Add more detailed descriptions of your roles, responsibilities, and achievements",
                priority: "High",
                expectedImpact: "Better demonstrates your professional value"
            });
        }
        
        if (sections.skills < 50) {
            recommendations.push({
                problem: "Skills section is underdeveloped",
                solution: "List specific technologies, tools, and methodologies you're proficient in",
                priority: "High",
                expectedImpact: "Helps recruiters quickly assess your technical fit"
            });
        }
        
        return recommendations;
    }
    
    // Generate career roadmap
    generateRoadmap(resumeText, sections) {
        const roadmap = [];
        const tokens = this.preprocessText(resumeText);
        
        // Beginner stage - fundamentals
        roadmap.push({
            title: "Master Core Fundamentals",
            type: "learn",
            description: "Strengthen basic programming concepts and tools"
        });
        
        // Intermediate stage - specialization
        if (sections.skills > 50) {
            roadmap.push({
                title: "Deepen Technical Expertise",
                type: "learn",
                description: "Focus on advanced concepts in your primary technology stack"
            });
        }
        
        // Advanced stage - leadership
        if (sections.experience > 70) {
            roadmap.push({
                title: "Develop Leadership Skills",
                type: "learn",
                description: "Build project management and team leadership capabilities"
            });
        }
        
        // Based on detected skills
        Object.entries(this.industryKeywords).forEach(([industry, keywords]) => {
            const matches = keywords.filter(keyword => 
                tokens.some(token => token.includes(keyword.toLowerCase().replace(/\s+/g, '')))
            );
            
            if (matches.length > 2) {
                roadmap.push({
                    title: `Advance in ${industry.charAt(0).toUpperCase() + industry.slice(1)}`,
                    type: "project",
                    description: `Build projects and gain deeper expertise in ${industry}`
                });
            }
        });
        
        return roadmap;
    }
    
    // Main analysis function
    async analyzeResume(resumeText) {
        try {
            // Extract features
            const features = this.extractFeatures(resumeText);
            
            // Score sections
            const sections = this.scoreSections(resumeText);
            
            // Calculate overall score
            const overallScore = Math.round(
                sections.skills * 0.3 +
                sections.experience * 0.25 +
                sections.education * 0.2 +
                sections.projects * 0.15 +
                sections.formatting * 0.1
            );
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(resumeText, sections);
            
            // Generate roadmap
            const roadmap = this.generateRoadmap(resumeText, sections);
            
            // Classify experience level
            const experienceLevel = this.classifyExperienceLevel(sections.experience, resumeText);
            
            return {
                executiveSummary: this.generateSummary(resumeText, overallScore, experienceLevel),
                scores: {
                    overall: overallScore,
                    skills: Math.round(sections.skills),
                    experience: Math.round(sections.experience),
                    education: Math.round(sections.education),
                    projects: Math.round(sections.projects),
                    formatting: Math.round(sections.formatting)
                },
                strengths: this.identifyStrengths(sections),
                weaknesses: this.identifyWeaknesses(sections),
                experienceLevel,
                detailedRecommendations: recommendations,
                roadmap: roadmap,
                targetRoles: this.suggestRoles(sections),
                salaryExpectation: this.estimateSalary(overallScore, experienceLevel)
            };
            
        } catch (error) {
            console.error('ML Analysis Error:', error);
            throw new Error('Failed to analyze resume with ML model: ' + error.message);
        }
    }
    
    classifyExperienceLevel(experienceScore, text) {
        const yearsPattern = /\b(\d+)\s*(?:year|yr)s?\b/gi;
        const matches = text.match(yearsPattern);
        const years = matches ? Math.max(...matches.map(match => parseInt(match))) : 0;
        
        if (years >= 5 || experienceScore >= 80) return 'Senior';
        if (years >= 2 || experienceScore >= 60) return 'Mid-level';
        return 'Entry-level';
    }
    
    generateSummary(text, score, experienceLevel) {
        const length = text.split(/\s+/).length;
        return `This is a ${experienceLevel.toLowerCase()} ${score >= 80 ? 'strong' : score >= 60 ? 'moderate' : 'developing'} resume with approximately ${length} words. The candidate demonstrates ${score >= 70 ? 'solid' : 'modest'} technical foundation and ${score >= 60 ? 'clear' : 'emerging'} professional experience.`;
    }
    
    identifyStrengths(sections) {
        const strengths = [];
        Object.entries(sections).forEach(([section, score]) => {
            if (score >= 80) {
                strengths.push(`${section.charAt(0).toUpperCase() + section.slice(1)} section is well-developed`);
            }
        });
        return strengths.length > 0 ? strengths : ['Shows potential for growth'];
    }
    
    identifyWeaknesses(sections) {
        const weaknesses = [];
        Object.entries(sections).forEach(([section, score]) => {
            if (score < 60) {
                weaknesses.push(`${section.charAt(0).toUpperCase() + section.slice(1)} section needs improvement`);
            }
        });
        return weaknesses.length > 0 ? weaknesses : ['Could benefit from more detailed content'];
    }
    
    suggestRoles(sections) {
        const roles = [];
        if (sections.skills >= 70) roles.push('Software Developer', 'Technical Specialist');
        if (sections.experience >= 60) roles.push('Senior Developer', 'Team Lead');
        if (sections.projects >= 50) roles.push('Full Stack Developer', 'Project Manager');
        return roles.length > 0 ? roles : ['Junior Developer', 'Intern'];
    }
    
    estimateSalary(score, experienceLevel) {
        const baseRanges = {
            'Entry-level': { min: 40000, max: 70000 },
            'Mid-level': { min: 70000, max: 120000 },
            'Senior': { min: 120000, max: 180000 }
        };
        
        const range = baseRanges[experienceLevel] || baseRanges['Entry-level'];
        const multiplier = score / 100;
        
        return {
            range: `$${Math.round(range.min * multiplier).toLocaleString()} - $${Math.round(range.max * multiplier).toLocaleString()}`,
            justification: `Based on ${experienceLevel.toLowerCase()} experience and resume quality score of ${score}`
        };
    }
}

module.exports = MLResumeAnalyzer;