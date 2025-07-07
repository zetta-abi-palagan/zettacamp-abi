// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { parentPort, workerData } = require('worker_threads');

// *************** IMPORT MODULE ***************
const { MONGO_URI } = require('../../core/config');
const FinalTranscriptResultHelper = require('../../modules/finalTranscriptResult/final_transcript_result.helper');

/**
 * Runs the final transcript calculation in a separate worker thread.
 * This function connects to the database, performs the calculation for a specific student,
 * and communicates the result back to the main thread.
 * @returns {Promise<void>} - This function does not return a value but posts a message to the parent thread.
 */
async function RunTranscriptCalculationWorker() {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI not defined for worker thread.');
        }

        await mongoose.connect(MONGO_URI);
        mongoose.set('debug', true);

        const { studentId, userId } = workerData;

        await FinalTranscriptResultHelper.CalculateFinalTranscript({ studentId, userId });

        if (parentPort) {
            parentPort.postMessage({ status: 'done', studentId: studentId });
        }
    } catch (error) {
        console.error('Worker thread error:', error);
        if (parentPort) {
            parentPort.postMessage({ status: 'error', error: error.message });
        }
    } finally {
        await mongoose.disconnect();
    }
}

// *************** Run the worker function
RunTranscriptCalculationWorker();