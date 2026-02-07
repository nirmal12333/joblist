const fs = require('fs').promises;
const path = require('path');

async function testPDFParsing() {
    try {
        // Test with the existing PDF file
        const testFilePath = path.join(__dirname, 'uploads', '1770480368531-Dhev_Prakaash_V_Resume.pdf');
        
        // Check if file exists
        try {
            await fs.access(testFilePath);
            console.log('PDF file found:', testFilePath);
        } catch (error) {
            console.log('PDF file not found, looking for any PDF in uploads folder...');
            const uploadsDir = path.join(__dirname, 'uploads');
            const files = await fs.readdir(uploadsDir);
            const pdfFiles = files.filter(file => file.endsWith('.pdf'));
            
            if (pdfFiles.length === 0) {
                console.log('No PDF files found in uploads directory');
                return;
            }
            
            const testFile = path.join(uploadsDir, pdfFiles[0]);
            console.log('Testing with:', testFile);
            
            // Test PDF parsing
            const pdf = require('pdf-parse');
            const fileBuffer = await fs.readFile(testFile);
            const pdfData = await pdf(fileBuffer);
            
            console.log('=== PDF PARSING TEST RESULTS ===');
            console.log('Number of pages:', pdfData.numpages);
            console.log('Text length:', pdfData.text.length);
            console.log('First 500 characters:');
            console.log(pdfData.text.substring(0, 500));
            console.log('=== END TEST ===');
            
        }
    } catch (error) {
        console.error('PDF parsing test failed:', error.message);
        console.error('Error stack:', error.stack);
    }
}

testPDFParsing();