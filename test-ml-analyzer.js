const SimpleMLResumeAnalyzer = require('./simple-ml-resume-analyzer');

async function testMLAnalyzer() {
    const analyzer = new SimpleMLResumeAnalyzer();
    
    // Sample resume text for testing
    const sampleResume = `
    John Doe
    Software Developer
    
    EXPERIENCE:
    Senior Frontend Developer at TechCorp (2020-Present)
    - Developed responsive web applications using React and JavaScript
    - Increased application performance by 40% through code optimization
    - Led a team of 5 developers on major projects
    - Implemented CI/CD pipelines reducing deployment time by 60%
    
    Frontend Developer at StartupXYZ (2018-2020)
    - Built user interfaces with Vue.js and CSS frameworks
    - Collaborated with UX designers to create intuitive user experiences
    - Mentored junior developers and conducted code reviews
    
    SKILLS:
    - JavaScript, React, Vue.js, Node.js
    - HTML5, CSS3, Bootstrap, Tailwind CSS
    - Git, Docker, AWS, Jenkins
    - Problem solving, Team leadership
    
    EDUCATION:
    Master of Science in Computer Science
    University of Technology (2016-2018)
    
    Bachelor of Science in Software Engineering
    State University (2012-2016)
    
    PROJECTS:
    - E-commerce Platform: Built full-stack application with React and Node.js
    - Task Management System: Developed with Vue.js and Firebase
    - Portfolio Website: Responsive design with modern CSS techniques
    `;
    
    try {
        console.log('Testing ML Resume Analyzer...\n');
        
        const result = await analyzer.analyzeResume(sampleResume);
        
        console.log('=== ANALYSIS RESULTS ===');
        console.log('Executive Summary:', result.executiveSummary);
        console.log('\nScores:');
        console.log('- Overall:', result.scores.overall);
        console.log('- Skills:', result.scores.skills);
        console.log('- Experience:', result.scores.experience);
        console.log('- Education:', result.scores.education);
        console.log('- Projects:', result.scores.projects);
        console.log('- Achievements:', result.scores.achievements);
        console.log('- Formatting:', result.scores.formatting);
        
        console.log('\nExperience Level:', result.experienceLevel);
        console.log('Primary Skills:', result.primarySkills.join(', '));
        
        console.log('\nStrengths:');
        result.strengths.forEach((strength, index) => {
            console.log(`${index + 1}. ${strength}`);
        });
        
        console.log('\nWeaknesses:');
        result.weaknesses.forEach((weakness, index) => {
            console.log(`${index + 1}. ${weakness}`);
        });
        
        console.log('\nRecommendations:');
        result.detailedRecommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.problem}`);
            console.log(`   Solution: ${rec.solution}`);
            console.log(`   Priority: ${rec.priority}`);
            console.log(`   Impact: ${rec.expectedImpact}\n`);
        });
        
        console.log('Target Roles:', result.targetRoles.join(', '));
        console.log('Salary Expectation:', result.salaryExpectation.range);
        console.log('Justification:', result.salaryExpectation.justification);
        
    } catch (error) {
        console.error('Analysis failed:', error.message);
    }
}

// Run the test
testMLAnalyzer();