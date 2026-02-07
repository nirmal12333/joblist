const SimpleMLResumeAnalyzer = require('./simple-ml-resume-analyzer');

async function testNonTechnicalResume() {
    const analyzer = new SimpleMLResumeAnalyzer();
    
    // Sample non-technical resume for testing
    const sampleResume = `
    Sarah Johnson
    Marketing Manager
    
    EXPERIENCE:
    Senior Marketing Manager at Global Retail Corp (2019-Present)
    - Developed and executed comprehensive marketing campaigns increasing brand awareness by 40%
    - Managed a team of 8 marketing professionals and coordinated cross-functional projects
    - Increased customer engagement by 60% through strategic social media campaigns
    - Oversaw annual marketing budget of $2M and achieved 15% cost savings
    
    Marketing Coordinator at TechStart Solutions (2016-2019)
    - Created compelling content for digital marketing channels
    - Analyzed market trends and customer behavior to inform strategy
    - Collaborated with sales team to develop lead generation campaigns
    - Managed relationships with external marketing vendors and agencies
    
    SKILLS:
    - Digital Marketing Strategy
    - Team Leadership and Management
    - Market Research and Analysis
    - Budget Planning and Financial Management
    - Project Coordination
    - Customer Relationship Management
    
    EDUCATION:
    Master of Business Administration - Marketing
    University of Business Studies (2014-2016)
    
    Bachelor of Arts in Communications
    State University (2010-2014)
    `;
    
    try {
        console.log('Testing Non-Technical Resume Analyzer...\n');
        
        const result = await analyzer.analyzeResume(sampleResume);
        
        console.log('=== NON-TECHNICAL ANALYSIS RESULTS ===');
        console.log('Executive Summary:', result.executiveSummary);
        console.log('\nExperience Level:', result.experienceLevel);
        console.log('Primary Skills:', result.primarySkills.join(', '));
        
        console.log('\nTarget Roles:');
        result.targetRoles.forEach((role, index) => {
            console.log(`${index + 1}. ${role}`);
        });
        
        console.log('\nRoadmap:');
        result.roadmap.forEach((item, index) => {
            console.log(`${index + 1}. ${item.title} (${item.type})`);
            console.log(`   ${item.description}\n`);
        });
        
        console.log('Salary Expectation:', result.salaryExpectation.range);
        console.log('Justification:', result.salaryExpectation.justification);
        
    } catch (error) {
        console.error('Analysis failed:', error.message);
    }
}

// Run the test
testNonTechnicalResume();