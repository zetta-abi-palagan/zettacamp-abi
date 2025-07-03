// *************** IMPORT MODULE *************** 
const BlockModel = require('../block/block.model');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model')
const FinalTranscriptResultModel = require('./final_transcript_result.model');
require('../subject/subject.model');
require('../test/test.model');

/**
 * Recursively evaluates a criteria object against a map of marks to determine a pass/fail result.
 * @param {object} args - The arguments for the evaluation.
 * @param {object} args.criteria - The criteria object, which can be a single rule or a logical group of rules.
 * @param {Map<string, object>} args.marksMap - A map where keys are document IDs and values are mark objects.
 * @returns {boolean} - True if the criteria are met, otherwise false.
 */
function EvaluateCriteria({ criteria, marksMap }) {
    // *************** Return true if no criteria specified
    if (!criteria) return true;

    // *************** Check if criteria is a logical group (AND/OR of conditions)
    const isGroup = criteria.logical_operator && Array.isArray(criteria.conditions) && criteria.conditions.length > 0;

    if (isGroup) {
        // *************** Recursively evaluate each condition in the group
        const results = criteria.conditions.map(condition =>
            EvaluateCriteria({ criteria: condition, marksMap })
        );

        // *************** Combine results based on logical operator
        return criteria.logical_operator === 'AND'
            ? results.every(Boolean)
            : results.some(Boolean);
    }

    // *************** Determine which result source to use (subject, test, or self)
    let resultSource;
    if (criteria.subject) {
        resultSource = marksMap.get(String(criteria.subject));
    } else if (criteria.test) {
        resultSource = marksMap.get(String(criteria.test));
    } else {
        resultSource = marksMap.get('self');
    }

    // *************** Return false if no result source found
    if (!resultSource) return false;

    // *************** Extract the mark to compare (by notation_text if specified, otherwise averageMark)
    let mark;
    if (criteria.notation_text && resultSource.marks) {
        const notationMark = resultSource.marks.find(m => m.notation_text === criteria.notation_text);
        mark = notationMark ? notationMark.mark : undefined;
    } else {
        mark = resultSource.averageMark;
    }

    // *************** Return false if mark is undefined
    if (typeof mark === 'undefined') return false;

    // *************** Compare mark using the specified operator
    switch (criteria.comparison_operator) {
        case 'GTE': return mark >= criteria.mark;
        case 'LTE': return mark <= criteria.mark;
        case 'GT': return mark > criteria.mark;
        case 'LT': return mark < criteria.mark;
        case 'E': return mark == criteria.mark;
        default: return false;
    }
}

/**
 * Calculates the entire final transcript for a single student.
 * This function aggregates all test results, evaluates them against block, subject, and test passing criteria,
 * and saves the complete, detailed result to the database.
 * @param {object} args - The arguments for the calculation.
 * @param {string} args.studentId - The ID of the student for whom to calculate the transcript.
 * @param {string} args.userId - The ID of the user initiating the calculation.
 * @returns {Promise<void>} - This function does not return a value but saves the result to the database.
 */
async function CalculateFinalTranscript({ studentId, userId }) {
    // *************** Fetch all active blocks with their active subjects and tests
    const blocks = await BlockModel.find({ block_status: 'ACTIVE' })
        .populate({
            path: 'subjects',
            match: { subject_status: 'ACTIVE' },
            populate: {
                path: 'tests',
                match: { test_status: 'ACTIVE' }
            }
        }).lean();

    // *************** Fetch all test results for the student
    const studentTestResults = await StudentTestResultModel.find({ student: studentId }).lean();

    // *************** Build a map of test results for quick lookup
    const marksMap = new Map();
    studentTestResults.forEach(result => {
        marksMap.set(String(result.test), { averageMark: result.average_mark, marks: result.marks });
    });

    // *************** Prepare the payload for the final transcript result
    const finalTranscriptResultPayload = {
        student: studentId,
        block_results: [],
        created_by: userId,
        updated_by: userId
    };

    let allBlocksPassed = true;

    // *************** Iterate through each block
    for (const block of blocks) {
        const blockResult = {
            block: block._id,
            subject_results: []
        };

        let blockWeightedSum = 0;
        let blockCoefficientSum = 0;

        // *************** Iterate through each subject in the block
        for (const subject of block.subjects) {
            const subjectResult = {
                subject: subject._id,
                test_results: []
            };

            let subjectWeightedSum = 0;
            let testWeightSum = 0;

            // *************** Iterate through each test in the subject
            for (const test of subject.tests) {
                const resultForTest = marksMap.get(String(test._id)) || { averageMark: 0, marks: [] };

                // *************** Evaluate test passing criteria
                marksMap.set('self', resultForTest);
                const testPassed = EvaluateCriteria({ criteria: test.test_passing_criteria, marksMap });
                marksMap.delete('self');

                const weightedMark = resultForTest.averageMark * test.weight;

                subjectResult.test_results.push({
                    test: test._id,
                    test_result: testPassed ? 'PASS' : 'FAIL',
                    test_total_mark: resultForTest.averageMark,
                    test_weighted_mark: weightedMark
                });

                subjectWeightedSum += weightedMark;
                testWeightSum += test.weight;
            }

            // *************** Warn if test weights do not sum to 1
            if (Math.abs(testWeightSum - 1) > 0.01) {
                console.warn(`Warning: Test weights for subject ${subject._id} do not sum to 1. Found: ${testWeightSum}`);
            }

            const subjectScore = subjectWeightedSum;
            marksMap.set(String(subject._id), { averageMark: subjectScore });
            marksMap.set('self', { averageMark: subjectScore });

            // *************** Evaluate subject passing criteria
            const subjectPassed = EvaluateCriteria({ criteria: subject.subject_passing_criteria, marksMap });

            marksMap.delete('self');
            const subjectTotalMark = subjectScore * subject.coefficient;

            subjectResult.subject_total_mark = subjectTotalMark;
            subjectResult.subject_result = subjectPassed ? 'PASS' : 'FAIL';

            blockResult.subject_results.push(subjectResult);
            blockWeightedSum += subjectTotalMark;
            blockCoefficientSum += subject.coefficient;
        }

        // *************** Calculate block score and evaluate block passing criteria
        const blockScore = blockCoefficientSum ? blockWeightedSum / blockCoefficientSum : 0;

        marksMap.set('self', { averageMark: blockScore });
        const blockPassed = EvaluateCriteria({ criteria: block.block_passing_criteria, marksMap });
        marksMap.delete('self');

        blockResult.block_total_mark = blockScore;
        blockResult.block_result = blockPassed ? 'PASS' : 'FAIL';

        if (!blockPassed) allBlocksPassed = false;

        finalTranscriptResultPayload.block_results.push(blockResult);
    }

    // *************** Set overall result based on all blocks
    finalTranscriptResultPayload.overall_result = allBlocksPassed ? 'PASS' : 'FAIL';

    // *************** Upsert the final transcript result in the database
    const finalTranscriptResult = await FinalTranscriptResultModel.findOneAndUpdate(
        { student: studentId },
        finalTranscriptResultPayload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!finalTranscriptResult) {
        throw new Error('Failed to create final transcript result.');
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    CalculateFinalTranscript
}