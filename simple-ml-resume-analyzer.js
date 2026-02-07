const natural = require('natural');
const sw = require('stopword');

class SimpleMLResumeAnalyzer {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        
        // Industry keywords database
        this.industryKeywords = {
            'frontend': ['javascript', 'react', 'vue', 'angular', 'html', 'css', 'typescript', 'nodejs', 'webpack', 'bootstrap'],
            'backend': ['python', 'java', 'nodejs', 'express', 'mongodb', 'postgresql', 'api', 'rest', 'microservices', 'spring'],
            'data_science': ['python', 'r', 'sql', 'pandas', 'numpy', 'machine learning', 'tensorflow', 'scikit-learn', 'data analysis'],
            'devops': ['docker', 'kubernetes', 'aws', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'linux', 'bash'],
            'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'android', 'ios', 'mobile development']
        };
        
        // Skill categories and weights
        this.skillCategories = {
            'programming_languages': ['javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php'],
            'frameworks': ['react', 'vue', 'angular', 'express', 'django', 'spring', 'laravel'],
            'databases': ['mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sql server'],
            'tools': ['git', 'docker', 'kubernetes', 'aws', 'azure', 'jenkins', 'webpack'],
            'soft_skills': ['communication', 'leadership', 'teamwork', 'problem solving', 'agile']
        };
    }
    
    // Preprocess text for analysis
    preprocessText(text) {
        // Convert to lowercase
        let processed = text.toLowerCase();
        
        // Remove special characters but keep important ones
        processed = processed.replace(/[^a-zA-Z0-9\s\-\/\+\#\.\@\_\(\)]/g, ' ');
        
        // Tokenize
        const tokens = this.tokenizer.tokenize(processed);
        
        // Remove stopwords
        const filteredTokens = sw.removeStopwords(tokens);
        
        // Stem words
        const stemmedTokens = filteredTokens.map(token => this.stemmer.stem(token));
        
        return stemmedTokens;
    }
    
    // Extract features from resume text
    extractFeatures(resumeText) {
        const tokens = this.preprocessText(resumeText);
        const featureVector = {};
        
        // Count industry keywords
        Object.keys(this.industryKeywords).forEach(industry => {
            const keywords = this.industryKeywords[industry];
            const matches = tokens.filter(token => 
                keywords.some(keyword => {
                    const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                    return token.includes(cleanKeyword) || cleanKeyword.includes(token);
                })
            ).length;
            
            featureVector[`industry_${industry}`] = Math.min(1, matches / 10); // Normalize
        });
        
        // Count skill category keywords
        Object.keys(this.skillCategories).forEach(category => {
            const keywords = this.skillCategories[category];
            const matches = tokens.filter(token => 
                keywords.some(keyword => {
                    const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                    return token.includes(cleanKeyword) || cleanKeyword.includes(token);
                })
            ).length;
            
            featureVector[`skills_${category}`] = Math.min(1, matches / 5); // Normalize
        });
        
        // Extract experience indicators
        const experiencePatterns = ['year', 'yr', 'experience', 'exp', 'intern', 'internship', 'work'];
        const experienceCount = tokens.filter(token => 
            experiencePatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['experience_indicators'] = Math.min(1, experienceCount / 20);
        
        // Extract education indicators
        const educationPatterns = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'bs', 'ms'];
        const educationCount = tokens.filter(token => 
            educationPatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['education_indicators'] = Math.min(1, educationCount / 10);
        
        // Extract achievement indicators
        const achievementPatterns = ['achieve', 'award', 'recognition', 'certification', 'certified', 'accomplishment'];
        const achievementCount = tokens.filter(token => 
            achievementPatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['achievement_indicators'] = Math.min(1, achievementCount / 5);
        
        // Extract quantification indicators
        const quantificationPatterns = ['increase', 'decrease', 'improve', 'reduce', 'save', 'generate', 'boost'];
        const quantificationCount = tokens.filter(token => 
            quantificationPatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['quantification_indicators'] = Math.min(1, quantificationCount / 10);
        
        // Extract project indicators
        const projectPatterns = ['project', 'portfolio', 'built', 'developed', 'created', 'designed'];
        const projectCount = tokens.filter(token => 
            projectPatterns.some(pattern => token.includes(pattern))
        ).length;
        featureVector['project_indicators'] = Math.min(1, projectCount / 15);
        
        return featureVector;
    }
    
    // Score different sections of the resume
    scoreSections(resumeText) {
        const sections = {
            'skills': this.scoreSkillsSection(resumeText),
            'experience': this.scoreExperienceSection(resumeText),
            'education': this.scoreEducationSection(resumeText),
            'projects': this.scoreProjectsSection(resumeText),
            'formatting': this.scoreFormatting(resumeText),
            'achievements': this.scoreAchievementsSection(resumeText)
        };
        
        return sections;
    }
    
    scoreSkillsSection(text) {
        const skillIndicators = ['skill', 'competency', 'proficiency', 'expertise', 'knowledge', 'ability'];
        const tokens = this.preprocessText(text);
        const skillMentions = tokens.filter(token => 
            skillIndicators.some(indicator => token.includes(indicator))
        ).length;
        
        // Count technical keywords across all categories
        let technicalScore = 0;
        Object.values(this.skillCategories).forEach(keywords => {
            const matches = tokens.filter(token => 
                keywords.some(keyword => {
                    const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                    return token.includes(cleanKeyword) || cleanKeyword.includes(token);
                })
            ).length;
            technicalScore = Math.max(technicalScore, matches);
        });
        
        return Math.min(100, (skillMentions * 8) + (technicalScore * 6));
    }
    
    scoreExperienceSection(text) {
        const experiencePatterns = ['experience', 'work', 'position', 'role', 'responsibility', 'duty', 'task'];
        const tokens = this.preprocessText(text);
        const experienceMentions = tokens.filter(token => 
            experiencePatterns.some(pattern => token.includes(pattern))
        ).length;
        
        // Look for time indicators
        const timePatterns = ['\\d+\\s*(?:year|yr)s?', 'month', 'present', 'current'];
        const timeMentions = (text.match(new RegExp(timePatterns.join('|'), 'gi')) || []).length;
        
        return Math.min(100, (experienceMentions * 10) + (timeMentions * 5));
    }
    
    scoreEducationSection(text) {
        const educationPatterns = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd', 'bs', 'ms', 'ba', 'ma'];
        const tokens = this.preprocessText(text);
        const educationMentions = tokens.filter(token => 
            educationPatterns.some(pattern => token.includes(pattern))
        ).length;
        
        return Math.min(100, educationMentions * 15);
    }
    
    scoreProjectsSection(text) {
        const projectPatterns = ['project', 'portfolio', 'built', 'developed', 'created', 'designed', 'implemented'];
        const tokens = this.preprocessText(text);
        const projectMentions = tokens.filter(token => 
            projectPatterns.some(pattern => token.includes(pattern))
        ).length;
        
        return Math.min(100, projectMentions * 20);
    }
    
    scoreFormatting(text) {
        // Check for proper structure indicators
        const structureScore = (text.match(/\n/g) || []).length > 10 ? 25 : 10;
        const bulletScore = (text.match(/[-•*]/g) || []).length > 5 ? 25 : 10;
        const sectionScore = (text.match(/:/g) || []).length > 3 ? 20 : 5;
        const capitalScore = (text.match(/[A-Z][a-z]+/g) || []).length > 20 ? 20 : 10;
        
        return Math.min(100, structureScore + bulletScore + sectionScore + capitalScore);
    }
    
    scoreAchievementsSection(text) {
        const achievementPatterns = ['achieve', 'award', 'recognition', 'certification', 'certified', 'accomplishment', 'success'];
        const tokens = this.preprocessText(text);
        const achievementMentions = tokens.filter(token => 
            achievementPatterns.some(pattern => token.includes(pattern))
        ).length;
        
        // Look for quantified results
        const quantifiedScore = (text.match(/\d+[%kmg]|increase|decrease|improve|reduce/gi) || []).length * 5;
        
        return Math.min(100, (achievementMentions * 10) + quantifiedScore);
    }
    
    // Generate personalized recommendations
    generateRecommendations(resumeText, sections) {
        const recommendations = [];
        const tokens = this.preprocessText(resumeText);
        
        // Check for missing quantified achievements
        const hasQuantification = /[\d+%$]|increase|decrease|improve|reduce|save|generate/i.test(resumeText);
        if (!hasQuantification) {
            recommendations.push({
                problem: "Resume lacks quantified achievements",
                solution: "Add specific metrics to describe your accomplishments (e.g., 'Increased sales by 25%', 'Managed team of 5 developers', 'Reduced processing time by 40%')",
                priority: "High",
                expectedImpact: "Makes your contributions measurable and more impactful to employers"
            });
        }
        
        // Check for industry-specific keywords
        const missingKeywords = [];
        Object.entries(this.industryKeywords).forEach(([industry, keywords]) => {
            const matches = keywords.filter(keyword => 
                tokens.some(token => {
                    const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                    return token.includes(cleanKeyword) || cleanKeyword.includes(token);
                })
            );
            
            if (matches.length < 2) {
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
                solution: "Add more detailed descriptions of your roles, responsibilities, and achievements with specific examples",
                priority: "High",
                expectedImpact: "Better demonstrates your professional value and career progression"
            });
        }
        
        if (sections.skills < 50) {
            recommendations.push({
                problem: "Skills section is underdeveloped",
                solution: "List specific technologies, tools, methodologies, and frameworks you're proficient in with proficiency levels",
                priority: "High",
                expectedImpact: "Helps recruiters quickly assess your technical fit for positions"
            });
        }
        
        if (sections.achievements < 40) {
            recommendations.push({
                problem: "Limited quantified achievements",
                solution: "Include specific metrics and results from your work (e.g., 'Delivered project 2 weeks ahead of schedule', 'Improved system performance by 35%')",
                priority: "Medium",
                expectedImpact: "Demonstrates measurable impact and results-oriented mindset"
            });
        }
        
        if (sections.formatting < 50) {
            recommendations.push({
                problem: "Formatting and structure need improvement",
                solution: "Use consistent formatting, bullet points, clear section headings, and professional layout",
                priority: "Medium",
                expectedImpact: "Improves readability and makes your resume more scanner-friendly"
            });
        }
        
        return recommendations.slice(0, 6); // Return top 6 recommendations
    }
    
    // Generate career roadmap
    generateRoadmap(resumeText, sections) {
        const roadmap = [];
        const tokens = this.preprocessText(resumeText);
        
        // Detect primary industry for personalized roadmap
        const industryIndicators = {
            'technology': ['software', 'developer', 'programmer', 'coding', 'web', 'app', 'mobile', 'frontend', 'backend', 'fullstack'],
            'business': ['manager', 'marketing', 'sales', 'business', 'finance', 'accounting', 'hr', 'operations'],
            'healthcare': ['doctor', 'nurse', 'medical', 'healthcare', 'hospital', 'pharmacy', 'clinical'],
            'education': ['teacher', 'professor', 'educator', 'teaching', 'school', 'university', 'training'],
            'engineering': ['engineer', 'civil', 'mechanical', 'electrical', 'chemical', 'design'],
            'creative': ['designer', 'artist', 'creative', 'graphic', 'content', 'writer', 'photographer'],
            'service': ['customer service', 'hospitality', 'hotel', 'restaurant', 'retail', 'sales'],
            'legal': ['lawyer', 'legal', 'attorney', 'court', 'judge', 'paralegal'],
            'government': ['government', 'public', 'police', 'fire', 'military', 'defense'],
            'finance': ['banking', 'investment', 'finance', 'accountant', 'financial', 'insurance']
        };
        
        let primaryIndustry = 'general';
        let maxMatches = 0;
        
        Object.entries(industryIndicators).forEach(([industry, keywords]) => {
            const matches = keywords.filter(keyword => 
                tokens.some(token => {
                    const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                    return token.includes(cleanKeyword) || cleanKeyword.includes(token);
                })
            ).length;
            
            if (matches > maxMatches) {
                maxMatches = matches;
                primaryIndustry = industry;
            }
        });
        
        // Industry-specific roadmap templates
        const industryRoadmaps = {
            'technology': [
                { title: "Master Core Technical Skills", type: "learn", description: "Strengthen programming fundamentals and core technologies" },
                { title: "Build Practical Projects", type: "project", description: "Create real-world applications to demonstrate expertise" },
                { title: "Learn Industry Best Practices", type: "learn", description: "Study modern development methodologies and standards" }
            ],
            'business': [
                { title: "Develop Business Acumen", type: "learn", description: "Understand market dynamics and business operations" },
                { title: "Enhance Communication Skills", type: "learn", description: "Build strong presentation and negotiation abilities" },
                { title: "Gain Leadership Experience", type: "project", description: "Lead initiatives and manage team projects" }
            ],
            'healthcare': [
                { title: "Advance Clinical Knowledge", type: "learn", description: "Stay updated with latest medical practices and technologies" },
                { title: "Develop Patient Care Skills", type: "project", description: "Enhance bedside manner and patient communication" },
                { title: "Pursue Specialization", type: "learn", description: "Focus on specific medical areas of interest" }
            ],
            'education': [
                { title: "Enhance Teaching Methodologies", type: "learn", description: "Learn modern pedagogical approaches and techniques" },
                { title: "Develop Curriculum Skills", type: "project", description: "Create engaging educational content and materials" },
                { title: "Build Educational Technology Skills", type: "learn", description: "Master digital tools for modern education" }
            ],
            'engineering': [
                { title: "Strengthen Technical Foundation", type: "learn", description: "Master core engineering principles and mathematics" },
                { title: "Gain Practical Experience", type: "project", description: "Work on hands-on engineering projects and designs" },
                { title: "Learn Industry Standards", type: "learn", description: "Understand safety protocols and engineering best practices" }
            ],
            'creative': [
                { title: "Develop Creative Portfolio", type: "project", description: "Build a strong portfolio showcasing diverse creative work" },
                { title: "Master Design Tools", type: "learn", description: "Become proficient in industry-standard creative software" },
                { title: "Understand Market Trends", type: "learn", description: "Stay current with design trends and creative industry developments" }
            ],
            'service': [
                { title: "Enhance Customer Service Skills", type: "learn", description: "Develop exceptional client interaction and problem-solving abilities" },
                { title: "Learn Service Industry Best Practices", type: "learn", description: "Understand hospitality and service excellence standards" },
                { title: "Build Management Skills", type: "project", description: "Gain experience in team coordination and service operations" }
            ],
            'legal': [
                { title: "Deepen Legal Knowledge", type: "learn", description: "Study relevant laws, regulations, and legal precedents" },
                { title: "Develop Analytical Skills", type: "learn", description: "Enhance legal research and case analysis capabilities" },
                { title: "Gain Practical Legal Experience", type: "project", description: "Participate in real legal cases and client interactions" }
            ],
            'government': [
                { title: "Understand Public Policy", type: "learn", description: "Study governance structures and public administration" },
                { title: "Develop Civic Engagement Skills", type: "learn", description: "Learn community outreach and public service delivery" },
                { title: "Build Leadership in Public Service", type: "project", description: "Lead initiatives that benefit communities and citizens" }
            ],
            'finance': [
                { title: "Master Financial Analysis", type: "learn", description: "Develop skills in financial modeling and market analysis" },
                { title: "Understand Regulatory Framework", type: "learn", description: "Study financial regulations and compliance requirements" },
                { title: "Gain Investment Experience", type: "project", description: "Work on portfolio management and investment strategies" }
            ],
            'general': [
                { title: "Develop Professional Skills", type: "learn", description: "Enhance communication, organization, and time management" },
                { title: "Build Industry Knowledge", type: "learn", description: "Gain expertise in your chosen field through continuous learning" },
                { title: "Create Professional Network", type: "project", description: "Connect with industry professionals and mentors" }
            ]
        };
        
        // Get industry-specific roadmap
        const baseRoadmap = industryRoadmaps[primaryIndustry] || industryRoadmaps['general'];
        roadmap.push(...baseRoadmap);
        
        // Add experience-level progression
        if (sections.experience > 70) {
            roadmap.push({
                title: "Develop Leadership and Management Skills",
                type: "learn",
                description: "Build team leadership, strategic planning, and decision-making capabilities"
            });
        }
        
        if (sections.skills > 60) {
            roadmap.push({
                title: "Pursue Professional Certifications",
                type: "milestone",
                description: "Obtain industry-recognized credentials to validate your expertise"
            });
        }
        
        // Add general professional development
        roadmap.push({
            title: "Continuous Professional Development",
            type: "learn",
            description: "Commit to lifelong learning and skill enhancement in your field"
        });
        
        return roadmap.slice(0, 6); // Return top 6 roadmap items
    }
    
    // Main analysis function
    async analyzeResume(resumeText) {
        // Store resume text for later use in role suggestions
        this.lastResumeText = resumeText;
        try {
            // Validate input
            if (!resumeText || resumeText.trim().length < 100) {
                throw new Error('Resume content is too short or empty');
            }
            
            // Extract features
            const features = this.extractFeatures(resumeText);
            
            // Score sections
            const sections = this.scoreSections(resumeText);
            
            // Calculate overall score (weighted average)
            const overallScore = Math.round(
                sections.skills * 0.25 +
                sections.experience * 0.25 +
                sections.education * 0.15 +
                sections.projects * 0.15 +
                sections.achievements * 0.10 +
                sections.formatting * 0.10
            );
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(resumeText, sections);
            
            // Generate roadmap
            const roadmap = this.generateRoadmap(resumeText, sections);
            
            // Classify experience level
            const experienceLevel = this.classifyExperienceLevel(sections.experience, resumeText);
            
            // Detect primary skills
            const primarySkills = this.detectPrimarySkills(resumeText);
            
            return {
                executiveSummary: this.generateSummary(resumeText, overallScore, experienceLevel, primarySkills),
                scores: {
                    overall: overallScore,
                    skills: Math.round(sections.skills),
                    experience: Math.round(sections.experience),
                    education: Math.round(sections.education),
                    projects: Math.round(sections.projects),
                    achievements: Math.round(sections.achievements),
                    formatting: Math.round(sections.formatting)
                },
                strengths: this.identifyStrengths(sections, primarySkills),
                weaknesses: this.identifyWeaknesses(sections),
                experienceLevel,
                primarySkills,
                detailedRecommendations: recommendations,
                roadmap: roadmap,
                targetRoles: this.suggestRoles(sections, primarySkills),
                salaryExpectation: this.estimateSalary(overallScore, experienceLevel)
            };
            
        } catch (error) {
            console.error('ML Analysis Error:', error);
            throw new Error('Failed to analyze resume: ' + error.message);
        }
    }
    
    classifyExperienceLevel(experienceScore, text) {
        const yearsPattern = /\b(\d+)\s*(?:year|yr)s?\b/gi;
        const matches = text.match(yearsPattern);
        const years = matches ? Math.max(...matches.map(match => parseInt(match))) : 0;
        
        if (years >= 5 || experienceScore >= 80) return 'Senior Level';
        if (years >= 2 || experienceScore >= 60) return 'Mid Level';
        return 'Entry Level';
    }
    
    detectPrimarySkills(text) {
        const tokens = this.preprocessText(text);
        const skillCounts = {};
        
        Object.entries(this.skillCategories).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                const matches = tokens.filter(token => 
                    token.includes(cleanKeyword) || cleanKeyword.includes(token)
                ).length;
                
                if (matches > 0) {
                    skillCounts[keyword] = (skillCounts[keyword] || 0) + matches;
                }
            });
        });
        
        // Return top 8 skills
        return Object.entries(skillCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .map(([skill]) => skill);
    }
    
    generateSummary(text, score, experienceLevel, primarySkills) {
        const length = text.split(/\s+/).length;
        const skillsList = primarySkills.slice(0, 3).join(', ');
        
        return `This is a ${experienceLevel.toLowerCase()} resume (${score >= 80 ? 'strong' : score >= 60 ? 'solid' : 'developing'}) with approximately ${length} words. The candidate demonstrates proficiency in ${skillsList} and shows ${score >= 70 ? 'clear' : 'emerging'} potential for professional growth.`;
    }
    
    identifyStrengths(sections, primarySkills) {
        const strengths = [];
        
        if (sections.skills >= 80) {
            strengths.push(`Strong technical skills including ${primarySkills.slice(0, 3).join(', ')}`);
        }
        
        if (sections.experience >= 75) {
            strengths.push('Extensive professional experience with clear career progression');
        }
        
        if (sections.achievements >= 70) {
            strengths.push('Quantified achievements demonstrating measurable impact');
        }
        
        if (sections.formatting >= 80) {
            strengths.push('Well-structured and professionally formatted resume');
        }
        
        if (sections.projects >= 60) {
            strengths.push('Solid project portfolio and hands-on experience');
        }
        
        return strengths.length > 0 ? strengths : ['Shows potential for development and learning'];
    }
    
    identifyWeaknesses(sections) {
        const weaknesses = [];
        
        if (sections.skills < 50) {
            weaknesses.push('Technical skills section needs more detail and specificity');
        }
        
        if (sections.experience < 50) {
            weaknesses.push('Limited work experience documentation');
        }
        
        if (sections.achievements < 40) {
            weaknesses.push('Could include more quantified results and achievements');
        }
        
        if (sections.formatting < 50) {
            weaknesses.push('Formatting and structure could be improved for better readability');
        }
        
        return weaknesses.length > 0 ? weaknesses : ['Minor improvements needed for optimal impact'];
    }
    
    suggestRoles(sections, primarySkills) {
        const roles = [];
        const tokens = this.preprocessText(this.lastResumeText || '');
        
        // Industry detection based on keywords
        const industryIndicators = {
            'technology': ['software', 'developer', 'programmer', 'coding', 'web', 'app', 'mobile', 'frontend', 'backend', 'fullstack', 'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript'],
            'business': ['manager', 'marketing', 'sales', 'business', 'finance', 'accounting', 'hr', 'human resources', 'operations', 'project management', 'strategy', 'consulting'],
            'healthcare': ['doctor', 'nurse', 'medical', 'healthcare', 'hospital', 'pharmacy', 'pharmacist', 'clinical', 'patient care', 'therapy', 'dentist'],
            'education': ['teacher', 'professor', 'educator', 'teaching', 'school', 'university', 'training', 'instruction', 'curriculum', 'academic'],
            'engineering': ['engineer', 'civil', 'mechanical', 'electrical', 'chemical', 'design', 'construction', 'manufacturing', 'technical'],
            'creative': ['designer', 'artist', 'creative', 'graphic', 'content', 'writer', 'photographer', 'video', 'media', 'advertising'],
            'service': ['customer service', 'hospitality', 'hotel', 'restaurant', 'retail', 'sales', 'support', 'call center', 'client'],
            'legal': ['lawyer', 'legal', 'attorney', 'court', 'judge', 'paralegal', 'law', 'juris', 'advocate'],
            'government': ['government', 'public', 'police', 'fire', 'military', 'defense', 'civil service', 'administration', 'public service'],
            'finance': ['banking', 'investment', 'finance', 'accountant', 'financial', 'insurance', 'audit', 'tax', 'wealth management']
        };
        
        // Detect primary industry
        let primaryIndustry = 'general';
        let maxMatches = 0;
        
        Object.entries(industryIndicators).forEach(([industry, keywords]) => {
            const matches = keywords.filter(keyword => 
                tokens.some(token => {
                    const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
                    return token.includes(cleanKeyword) || cleanKeyword.includes(token);
                })
            ).length;
            
            if (matches > maxMatches) {
                maxMatches = matches;
                primaryIndustry = industry;
            }
        });
        
        // Generate industry-appropriate roles
        const industryRoles = {
            'technology': ['Software Developer', 'IT Specialist', 'Technical Consultant', 'Systems Analyst', 'Web Developer'],
            'business': ['Business Analyst', 'Marketing Manager', 'Sales Executive', 'Operations Manager', 'Project Coordinator'],
            'healthcare': ['Healthcare Professional', 'Medical Assistant', 'Clinical Specialist', 'Healthcare Administrator', 'Patient Care Coordinator'],
            'education': ['Educator', 'Training Specialist', 'Instructional Designer', 'Academic Advisor', 'Learning Consultant'],
            'engineering': ['Engineer', 'Technical Specialist', 'Design Engineer', 'Project Engineer', 'Technical Consultant'],
            'creative': ['Creative Professional', 'Content Creator', 'Media Specialist', 'Design Consultant', 'Creative Director'],
            'service': ['Customer Service Professional', 'Hospitality Manager', 'Service Coordinator', 'Client Relations Specialist', 'Operations Associate'],
            'legal': ['Legal Professional', 'Paralegal', 'Legal Assistant', 'Compliance Specialist', 'Legal Consultant'],
            'government': ['Public Service Professional', 'Administrative Officer', 'Government Specialist', 'Public Policy Assistant', 'Civil Service Professional'],
            'finance': ['Financial Professional', 'Accounting Specialist', 'Financial Analyst', 'Banking Professional', 'Investment Associate'],
            'general': ['Professional', 'Specialist', 'Coordinator', 'Associate', 'Consultant']
        };
        
        // Add experience-level appropriate roles
        const experienceLevel = sections.experience >= 70 ? 'senior' : 
                              sections.experience >= 40 ? 'mid' : 'entry';
        
        const experienceRoles = {
            'senior': ['Senior', 'Lead', 'Manager', 'Director', 'Head'],
            'mid': ['Specialist', 'Coordinator', 'Analyst', 'Professional', 'Consultant'],
            'entry': ['Associate', 'Assistant', 'Junior', 'Trainee', 'Coordinator']
        };
        
        // Combine industry and experience roles
        const baseRoles = industryRoles[primaryIndustry] || industryRoles['general'];
        const expPrefixes = experienceRoles[experienceLevel] || experienceRoles['entry'];
        
        // Generate specific role suggestions
        baseRoles.forEach((baseRole, index) => {
            if (index < 3) { // Limit to 3 base roles
                // Add experience-appropriate prefix
                if (experienceLevel !== 'entry' && index < expPrefixes.length) {
                    roles.push(`${expPrefixes[index]} ${baseRole}`);
                } else {
                    roles.push(baseRole);
                }
            }
        });
        
        // Add some general professional roles
        roles.push('Professional', 'Specialist');
        
        // Remove duplicates and limit to 8 roles
        return [...new Set(roles)].slice(0, 8);
    }
    
    estimateSalary(score, experienceLevel) {
        const baseRanges = {
            'Entry Level': { min: 45000, max: 75000 },
            'Mid Level': { min: 75000, max: 125000 },
            'Senior Level': { min: 125000, max: 185000 }
        };
        
        const range = baseRanges[experienceLevel] || baseRanges['Entry Level'];
        const multiplier = Math.min(1, score / 100 + 0.2); // Add 20% buffer
        
        return {
            range: `$${Math.round(range.min * multiplier).toLocaleString()} - $${Math.round(range.max * multiplier).toLocaleString()}`,
            justification: `Based on ${experienceLevel.toLowerCase()} experience and comprehensive skill assessment score of ${score}`
        };
    }
}

module.exports = SimpleMLResumeAnalyzer;