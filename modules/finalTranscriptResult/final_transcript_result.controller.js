// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT MODULE ***************
const FinalTranscriptResultHelper = require('./final_transcript_result.helper');

/**
 * Handles an HTTP request to generate and stream a student's final transcript as a PDF.
 * @param {object} request - The Express request object, containing the student ID in its parameters.
 * @param {object} response - The Express response object, used to send the PDF or an error.
 * @returns {Promise<void>} - This function does not return a value but sends an HTTP response.
 */
async function GetFinalTranscriptPdf(request, response) {
  try {
    const studentId = request.params.studentId;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return response.status(400).json({ error: 'Invalid Student ID format.' });
    }

    const pdfBuffer = await FinalTranscriptResultHelper.GenerateFinalTranscriptPdf(studentId);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `inline; filename=transcript-${studentId}.pdf`);
    response.send(pdfBuffer);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    if (error.message.includes('Transcript data not found')) {
      return response.status(404).json({ error: error.message });
    }
    response.status(500).json({ error: 'An error occurred while generating the PDF.' });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  GetFinalTranscriptPdf,
};
