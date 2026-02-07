const fs = require('fs').promises;
const path = require('path');

async function detailedPDFTest() {
    try {
        console.log('Starting detailed PDF parsing test...');
        
        // Test with the existing PDF file
        const testFilePath = path.join(__dirname, 'uploads', '1770480368531-Dhev_Prakaash_V_Resume.pdf');
        
        console.log('Testing file:', testFilePath);
        
        // Check if file exists and get stats
        try {
            const stats = await fs.stat(testFilePath);
            console.log('File exists, size:', stats.size, 'bytes');
            
            if (stats.size === 0) {
                console.log('File is empty!');
                return;
            }
            
        } catch (error) {
            console.log('File does not exist or cannot be accessed');
            return;
        }
        
        // Test PDF parsing
        console.log('Attempting to parse PDF...');
        const pdf = require('pdf-parse');
        
        console.log('pdf-parse module loaded:', typeof pdf);
        
        const fileBuffer = await fs.readFile(testFilePath);
        console.log('File read successfully, buffer length:', fileBuffer.length);
        
        const uint8Array = new Uint8Array(fileBuffer);
        const pdfData = await new pdf.PDFParse(uint8Array);
        const textData = await pdfData.getText();
        console.log('PDF parsing successful!');
        
        console.log('=== PDF PARSING RESULTS ===');
        console.log('Text length:', textData.text.length);
        console.log('First 1000 characters:');
        console.log('--- START TEXT ---');
        console.log(textData.text.substring(0, 1000));
        console.log('--- END TEXT ---');
        console.log('=== END RESULTS ===');
        
    } catch (error) {
        console.error('=== DETAILED ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        console.error('=== END ERROR ===');
    }
}

detailedPDFTest();