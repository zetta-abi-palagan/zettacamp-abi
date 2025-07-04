// *************** IMPORT MODULE *************** 
const BlockModel = require('../block/block.model');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model')
const FinalTranscriptResultModel = require('./final_transcript_result.model');
require('../subject/subject.model');
require('../test/test.model');

/**
 * Evaluates a single condition (e.g., mark >= 80).
 * @param {object} args - The arguments for the evaluation.
 * @param {object} args.condition - The condition object to evaluate.
 * @param {Map<string, object>} args.marksMap - A map of all calculated marks for lookup.
 * @param {number} args.selfScore - The score of the entity itself (used for 'AVERAGE' type).
 * @param {Array<object>} [args.selfMarks] - The detailed marks of the entity itself (used for 'MARK' type on the current item).
 * @returns {boolean} - True if the condition is met, otherwise false.
 */
function evaluateSingleCondition({ condition, marksMap, selfScore, selfMarks }) {
    const { criteria_type, subject, test, notation_text, comparison_operator, mark: threshold } = condition;

    let sourceMark;

    if (criteria_type === 'AVERAGE') {
        sourceMark = selfScore;
    } else if (criteria_type === 'MARK') {
        let resultSource;
        if (test || subject) {
            const sourceId = subject ? String(subject) : String(test);
            resultSource = marksMap.get(sourceId);
        } else {
            resultSource = { marks: selfMarks };
        }

        if (resultSource && notation_text && resultSource.marks) {
            const notation = resultSource.marks.find(m => m.notation_text === notation_text);
            sourceMark = notation ? notation.mark : undefined;
        }
    }

    if (typeof sourceMark === 'undefined') return false;

    switch (comparison_operator) {
        case 'GTE': return sourceMark >= threshold;
        case 'LTE': return sourceMark <= threshold;
        case 'GT': return sourceMark > threshold;
        case 'LT': return sourceMark < threshold;
        case 'E': return sourceMark == threshold;
        default: return false;
    }
}

/**
 * Evaluates a group of conditions that are logically connected by 'AND'.
 * @param {object} args - The arguments for the evaluation.
 * @param {Array<object>} args.conditions - The array of conditions in the group.
 * @param {Map<string, object>} args.marksMap - A map of all calculated marks.
 * @param {number} args.selfScore - The score of the entity itself.
 * @param {Array<object>} [args.selfMarks] - The detailed marks of the entity itself.
 * @returns {boolean} - True if all conditions in the group are met, otherwise false.
 */
function evaluateConditionGroup({ conditions, marksMap, selfScore, selfMarks }) {
    // *************** 'every' implements the AND logic
    return conditions.every(condition =>
        evaluateSingleCondition({ condition, marksMap, selfScore, selfMarks })
    );
}

/**
 * Evaluates a set of criteria (pass or fail) for an entity.
 * @param {object} args - The arguments for the evaluation.
 * @param {object} args.criteriaSet - The pass_criteria or fail_criteria object.
 * @param {string} args.groupKey - The key for the criteria groups array (e.g., 'block_criteria_groups').
 * @param {Map<string, object>} args.marksMap - A map of all calculated marks.
 * @param {number} args.selfScore - The score of the entity itself.
 * @param {Array<object>} [args.selfMarks] - The detailed marks of the entity itself.
 * @returns {boolean} - True if the criteria set is satisfied, otherwise false.
 */
function evaluateCriteriaSet({ criteriaSet, groupKey, marksMap, selfScore, selfMarks }) {
    if (!criteriaSet || !Array.isArray(criteriaSet[groupKey])) return false;

    // *************** 'some' implements the OR logic between groups
    return criteriaSet[groupKey].some(group =>
        evaluateConditionGroup({ conditions: group.conditions, marksMap, selfScore, selfMarks })
    );
}

/**
 * Calculates the results for all tests within a single subject.
 * @param {object} args - The arguments for the calculation.
 * @param {object} args.subject - The subject document, with its 'tests' array populated.
 * @param {Map<string, object>} args.marksMap - The map of all student test results.
 * @returns {object} An object containing test results, the weighted sum of marks, and the sum of test weights.
 */
function calculateTestResultsForSubject({ subject, marksMap }) {
    const testResults = [];
    let subjectWeightedSum = 0;
    let testWeightSum = 0;

    for (const test of subject.tests) {
        const resultForTest = marksMap.get(String(test._id)) || { averageMark: 0, marks: [] };

        const passed = evaluateCriteriaSet({
            criteriaSet: test.test_passing_criteria && test.test_passing_criteria.pass_criteria,
            groupKey: 'test_criteria_groups',
            marksMap,
            selfScore: resultForTest.averageMark,
            selfMarks: resultForTest.marks
        });
        const failed = evaluateCriteriaSet({
            criteriaSet: test.test_passing_criteria && test.test_passing_criteria.fail_criteria,
            groupKey: 'test_criteria_groups',
            marksMap,
            selfScore: resultForTest.averageMark,
            selfMarks: resultForTest.marks
        });

        const testPassed = !failed && passed;
        const weightedMark = resultForTest.averageMark * test.weight;

        testResults.push({
            test: test._id,
            test_result: testPassed ? 'PASS' : 'FAIL',
            test_total_mark: Number(resultForTest.averageMark.toFixed(2)),
            test_weighted_mark: Number(weightedMark.toFixed(2))
        });

        subjectWeightedSum += weightedMark;
        testWeightSum += test.weight;
    }

    return { testResults, subjectWeightedSum, testWeightSum };
}

/**
 * Calculates the results for all subjects within a single block.
 * @param {object} args - The arguments for the calculation.
 * @param {object} args.block - The block document, with its 'subjects' array populated.
 * @param {Map<string, object>} args.marksMap - The map of all student test results, which will be updated with subject scores.
 * @returns {object} An object containing subject results, the weighted sum of marks, and the sum of subject coefficients.
 */
function calculateSubjectResultsForBlock({ block, marksMap }) {
    const subjectResults = [];
    let blockWeightedSum = 0;
    let blockCoefficientSum = 0;

    for (const subject of block.subjects) {
        const { testResults, subjectWeightedSum, testWeightSum } = calculateTestResultsForSubject({ subject, marksMap });

        if (Math.abs(testWeightSum - 1) > 0.01) {
            console.warn(`Warning: Test weights for subject ${subject._id} do not sum to 1. Found: ${testWeightSum}`);
        }

        const subjectScore = subjectWeightedSum;
        marksMap.set(String(subject._id), { averageMark: subjectScore });

        const passed = evaluateCriteriaSet({
            criteriaSet: subject.subject_passing_criteria && subject.subject_passing_criteria.pass_criteria,
            groupKey: 'subject_criteria_groups',
            marksMap,
            selfScore: subjectScore,
        });
        const failed = evaluateCriteriaSet({
            criteriaSet: subject.subject_passing_criteria && subject.subject_passing_criteria.fail_criteria,
            groupKey: 'subject_criteria_groups',
            marksMap,
            selfScore: subjectScore,
        });

        const subjectPassed = !failed && passed;
        const subjectTotalMark = subjectScore * subject.coefficient;

        subjectResults.push({
            subject: subject._id,
            test_results: testResults,
            subject_total_mark: Number(subjectTotalMark.toFixed(2)),
            subject_result: subjectPassed ? 'PASS' : 'FAIL'
        });

        blockWeightedSum += subjectTotalMark;
        blockCoefficientSum += subject.coefficient;
    }

    return { subjectResults, blockWeightedSum, blockCoefficientSum };
}

/**
 * Calculates the entire final transcript for a single student.
 * This function orchestrates the aggregation of all test results and evaluation of all passing criteria.
 * @param {object} args - The arguments for the calculation.
 * @param {string} args.studentId - The ID of the student for whom to calculate the transcript.
 * @param {string} args.userId - The ID of the user initiating the calculation.
 * @returns {Promise<void>} - This function does not return a value but saves the result to the database.
 */
async function CalculateFinalTranscript({ studentId, userId }) {
    const blocks = await BlockModel.find({ block_status: 'ACTIVE' })
        .populate({
            path: 'subjects',
            match: { subject_status: 'ACTIVE' },
            populate: {
                path: 'tests',
                match: { test_status: 'ACTIVE' }
            }
        }).lean();

    const studentTestResults = await StudentTestResultModel.find({ student: studentId }).lean();
    const marksMap = new Map();
    studentTestResults.forEach(result => {
        marksMap.set(String(result.test), { averageMark: result.average_mark, marks: result.marks });
    });

    const blockResults = [];
    let allBlocksPassed = true;

    for (const block of blocks) {
        const { subjectResults, blockWeightedSum, blockCoefficientSum } = calculateSubjectResultsForBlock({ block, marksMap });
        const blockScore = blockCoefficientSum ? blockWeightedSum / blockCoefficientSum : 0;

        const passed = evaluateCriteriaSet({
            criteriaSet: block.block_passing_criteria && block.block_passing_criteria.pass_criteria,
            groupKey: 'block_criteria_groups',
            marksMap,
            selfScore: blockScore,
        });
        const failed = evaluateCriteriaSet({
            criteriaSet: block.block_passing_criteria && block.block_passing_criteria.fail_criteria,
            groupKey: 'block_criteria_groups',
            marksMap,
            selfScore: blockScore,
        });
        const blockPassed = !failed && passed;

        if (!blockPassed) allBlocksPassed = false;

        blockResults.push({
            block: block._id,
            subject_results: subjectResults,
            block_total_mark: Number(blockScore.toFixed(2)),
            block_result: blockPassed ? 'PASS' : 'FAIL'
        });
    }

    const finalTranscriptResultPayload = {
        student: studentId,
        block_results: blockResults,
        overall_result: allBlocksPassed ? 'PASS' : 'FAIL',
        created_by: userId,
        updated_by: userId
    };

    const finalTranscriptResult = await FinalTranscriptResultModel.findOneAndUpdate(
        { student: studentId },
        finalTranscriptResultPayload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!finalTranscriptResult) {
        throw new Error('Failed to create or update the final transcript result.');
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    CalculateFinalTranscript
}