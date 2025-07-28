// *************** IMPORT CORE ***************
const express = require('express');

// *************** IMPORT MODULE ***************
const FinalTranscriptResultController = require('../modules/finalTranscriptResult/final_transcript_result.controller');

const router = express.Router();

router.get('/transcript/:studentId/pdf', FinalTranscriptResultController.GetFinalTranscriptPdf);

// *************** EXPORT MODULE ***************
module.exports = router;
