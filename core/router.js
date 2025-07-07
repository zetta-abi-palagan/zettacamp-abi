// *************** IMPORT CORE ***************
const express = require('express');

// *************** IMPORT MODULE ***************
const finalTranscriptResultRouter = require('../modules/finalTranscriptResult/final_transcript_result.router');

const router = express.Router();

router.use(finalTranscriptResultRouter);

// *************** EXPORT MODULE ***************
module.exports = router;