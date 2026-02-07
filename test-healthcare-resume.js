const SimpleMLResumeAnalyzer = require('./simple-ml-resume-analyzer');

async function testHealthcareResume() {
    const analyzer = new SimpleMLResumeAnalyzer();
    
    // Sample healthcare resume for testing
    const sampleResume = `
    Dr. Michael Chen
    Registered Nurse
    
    EXPERIENCE:
    Senior Registered Nurse at City General Hospital (2018-Present)
    - Provide comprehensive patient care in emergency department
    - Coordinate with medical team to develop treatment plans
    - Educate patients and families about medical conditions and procedures
    - Maintain accurate patient records and documentation
    - Mentor junior nursing staff and provide clinical guidance
    
    Staff Nurse at Community Medical Center (2015-2018)
    - Administered medications and treatments as prescribed
    - Monitored patient vital signs and reported changes to physicians
    - Assisted in various medical procedures and surgeries
    - Provided emotional support to patients and families
    
    SKILLS:
    - Patient Care and Assessment
    - Medical Documentation
    - Emergency Response
    - Team Collaboration
    - Patient Education
    - Clinical Procedures
    - Infection Control
    - Medical Equipment Operation
    
    EDUCATION:
    Bachelor of Science in Nursing
    State University School of Nursing (2011-2015)
    
    Licensed Registered Nurse - State Board of Nursing
    `;
    
    try {
        console.log('Testing Healthcare Resume Analyzer...\n');
        
        const result = await analyzer.analyzeResume(sampleResume);
        
        console.log('=== HEALTHCARE ANALYSIS RESULTS ===');
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
testHealthcareResume();