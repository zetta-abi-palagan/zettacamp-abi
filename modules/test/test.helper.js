// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const TestModel = require('./test.model');
const SubjectModel = require('../subject/subject.model');
const BlockModel = require('../block/block.model');
const TaskModel = require('../task/task.model');

// *************** IMPORT VALIDATOR ***************
const validator = require('./test.validator');

/**
 * Fetches all tests from the database, after validating the optional status filter.
 * @param {string} [test_status] - Optional. The status of the tests to fetch (e.g., 'ACTIVE').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of test objects.
 */
async function GetAllTestsHelper(test_status) {
    try {
        validator.ValidateGetAllTestsInput(test_status);

        const filter = {};

        if (test_status) {
            filter.test_status = test_status;
        }

        const tests = await TestModel.find(filter);

        return tests;
    } catch (error) {
        throw new ApolloError(`Failed to fetch tests: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single test by its unique ID after validating the ID.
 * @param {string} id - The unique identifier of the test to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found test object.
 */
async function GetOneTestHelper(id) {
    try {
        validator.ValidateGetOneTestInput(id);

        const test = await TestModel.findOne({ _id: id });

        if (!test) {
            throw new ApolloError('Test not found', 'TEST_NOT_FOUND');
        }

        return test;
    } catch (error) {
        throw new ApolloError(`Failed to fetch test: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Validates inputs and creates a new test, then links it to the parent subject.
 * @param {string} subject - The ID of the subject to which the test will be added.
 * @param {string} name - The name of the test.
 * @param {string} description - The description of the test.
 * @param {string} test_type - The type of the test (e.g., 'QUIZ', 'EXAM').
 * @param {string} result_visibility - The visibility setting for the test results.
 * @param {number} weight - The weight or coefficient of the test.
 * @param {string} correction_type - The correction method for the test.
 * @param {Array<object>} notations - The notation system used for the test.
 * @param {boolean} is_retake - Flag indicating if this is a retake test.
 * @param {string} connected_test - The ID of the original test if this is a retake.
 * @param {string} test_status - The initial status of the test (e.g., 'ACTIVE').
 * @returns {Promise<object>} - A promise that resolves to the newly created test object.
 */
async function CreateTestHelper(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status) {
    try {
        validator.ValidateCreateTestInput(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status)

        const subjectCheck = await SubjectModel.findOne({
            _id: subject,
            subject_status: 'ACTIVE'
        });
        if (!subjectCheck) {
            throw new ApolloError('Subject not found or is not active', 'NOT_FOUND', {
                field: 'subject'
            });
        }

        const blockCheck = await BlockModel.findOne({
            _id: subjectCheck.block,
            block_status: 'ACTIVE'
        });

        if (!blockCheck) {
            throw new ApolloError('Block not found or is not active', 'NOT_FOUND', {
                field: 'block'
            });
        }

        if (typeof test_type !== 'string') {
            throw new ApolloError('Test type must be a string.', 'BAD_USER_INPUT', {
                field: 'test_type'
            });
        }

        if (typeof result_visibility !== 'string') {
            throw new ApolloError('Result visibility must be a string.', 'BAD_USER_INPUT', {
                field: 'result_visibility'
            });
        }

        if (typeof correction_type !== 'string') {
            throw new ApolloError('Correction type must be a string.', 'BAD_USER_INPUT', {
                field: 'correction_type'
            });
        }

        if (typeof test_status !== 'string') {
            throw new ApolloError('Test status must be a string.', 'BAD_USER_INPUT', {
                field: 'test_status'
            });
        }

        const evaluationType = blockCheck.evaluation_type;
        const upperTestType = test_type.toUpperCase();

        const allowedTestTypes = evaluationType === 'COMPETENCY'
            ? ['ORAL', 'WRITTEN', 'MEMOIRE_WRITTEN', 'FREE_CONTINUOUS_CONTROL', 'MENTOR_EVALUATION']
            : evaluationType === 'SCORE'
                ? ['FREE_CONTINUOUS_CONTROL', 'MEMMOIRE_ORAL_NON_JURY', 'MEMOIRE_ORAL', 'MEMOIRE_WRITTEN', 'MENTOR_EVALUATION', 'ORAL', 'WRITTEN']
                : [];

        if (!allowedTestTypes.includes(upperTestType)) {
            throw new ApolloError(`Test type '${upperTestType}' is not allowed for block with evaluation_type '${evaluationType}'.`, 'BAD_USER_INPUT', {
                field: 'test_type'
            });
        }

        if (is_retake && connected_test.length) {
            const connectedTestCheck = await TestModel.findOne({
                _id: connected_test,
                test_status: 'ACTIVE'
            });
            if (!connectedTestCheck) {
                throw new ApolloError('Connected test not found or is not active', 'NOT_FOUND', {
                    field: 'connected_test'
                });
            }
        }

        const upperResultVisibility = result_visibility.toUpperCase();
        const upperCorrectionType = correction_type.toUpperCase();
        const upperTestStatus = test_status.toUpperCase();

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const createdByUserId = '6846e5769e5502fce150eb67';

        const testData = {
            subject: subject,
            name: name,
            description: description,
            test_type: upperTestType,
            result_visibility: upperResultVisibility,
            weight: weight,
            correction_type: upperCorrectionType,
            notations: notations,
            is_retake: is_retake,
            connected_test: connected_test,
            test_status: upperTestStatus,
            created_by: createdByUserId,
            updated_by: createdByUserId
        }

        const newTest = await TestModel.create(testData);

        if (!newTest) {
            throw new ApolloError('Test creation failed', 'TEST_CREATION_FAILED');
        }

        await SubjectModel.updateOne(
            { _id: subject, subject_status: 'ACTIVE' },
            {
                $addToSet: { tests: newTest._id },
                $set: { updated_by: createdByUserId }
            }
        );

        return newTest;
    } catch (error) {
        throw new ApolloError('Failed to create test', 'TEST_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Publishes a test, updating its status and creating a follow-up task to assign a corrector.
 * @param {string} id - The unique identifier of the test to publish.
 * @param {Date|string} assign_corrector_due_date - The deadline for assigning a corrector.
 * @param {Date|string} test_due_date - The deadline for the test itself.
 * @returns {Promise<void>} - This function does not return a value but performs database operations.
 */
async function PublishTestHelper(id, assign_corrector_due_date, test_due_date) {
    try {
        validator.ValidatePublishTestInput(id, assign_corrector_due_date, test_due_date);

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const publishedByUserId = '6846e5769e5502fce150eb67';

        const testData = {
            is_published: true,
            published_date: Date.now(),
            published_by: publishedByUserId,
            test_due_date: test_due_date,
        }

        const publishedTest = await TestModel.findOneAndUpdate({ _id: id, test_status: 'ACTIVE' }, testData, { new: true });

        if (!publishedTest) {
            throw new ApolloError('Test publish failed', 'TEST_PUBLISH_FAILED');
        }

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const academicDirectorId = '6846e5769e5502fce150eb67';

        const taskData = {
            test: publishedTest.id,
            user: academicDirectorId,
            title: 'Assign Corrector',
            description: 'Academic Director should assign corrector for student test',
            task_type: 'ASSIGN_CORRECTOR',
            task_status: 'PENDING',
            due_date: assign_corrector_due_date,
            created_by: publishedByUserId,
            updated_by: publishedByUserId
        }

        const assignCorrectorTask = await TaskModel.create(taskData)

        if (!assignCorrectorTask) {
            throw new ApolloError('Task assign corrector creation failed', 'TASK_CREATION_FAILED');
        }

        await TestModel.updateOne(
            { _id: publishedTest._id, test_status: 'ACTIVE' },
            {
                $addToSet: { tests: assignCorrectorTask._id },
            }
        )

        return {
            test: publishedTest,
            assign_corrector_task: assignCorrectorTask
        };
    } catch (error) {
        throw new ApolloError('Failed to publish test', 'TEST_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Validates inputs and updates an existing test.
 * @param {string} id - The ID of the test to update.
 * @param {string} name - The name of the test.
 * @param {string} description - The description of the test.
 * @param {string} test_type - The type of the test (e.g., 'QUIZ', 'EXAM').
 * @param {string} result_visibility - The visibility setting for the test results.
 * @param {number} weight - The weight or coefficient of the test.
 * @param {string} correction_type - The correction method for the test.
 * @param {Array<object>} notations - The notation system used for the test.
 * @param {boolean} is_retake - Flag indicating if this is a retake test.
 * @param {string} connected_test - The ID of the original test if this is a retake.
 * @param {string} test_status - The status of the test (e.g., 'ACTIVE').
 * @returns {Promise<object>} - A promise that resolves to the updated test object.
 */
async function UpdateTestHelper(id, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status) {
    try {
        validator.ValidateUpdateTestInput(id, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status);

        const test = await TestModel.findOne({
            _id: id,
            subject_status: 'ACTIVE'
        });
        if (!test) {
            throw new ApolloError('Test not found', 'NOT_FOUND', {
                field: 'id'
            });
        }

        const subjectCheck = await SubjectModel.findOne({
            _id: test.subject,
            subject_status: 'ACTIVE'
        });

        if (!subjectCheck) {
            throw new ApolloError('Subject not found or is not active', 'NOT_FOUND', {
                field: 'subject'
            });
        }

        const blockCheck = await BlockModel.findOne({
            _id: subjectCheck.block,
            block_status: 'ACTIVE'
        });

        if (!blockCheck) {
            throw new ApolloError('Block not found or is not active', 'NOT_FOUND', {
                field: 'block'
            });
        }

        if (typeof test_type !== 'string') {
            throw new ApolloError('Test type must be a string.', 'BAD_USER_INPUT', {
                field: 'test_type'
            });
        }

        if (typeof result_visibility !== 'string') {
            throw new ApolloError('Result visibility must be a string.', 'BAD_USER_INPUT', {
                field: 'result_visibility'
            });
        }

        if (typeof correction_type !== 'string') {
            throw new ApolloError('Correction type must be a string.', 'BAD_USER_INPUT', {
                field: 'correction_type'
            });
        }

        if (typeof test_status !== 'string') {
            throw new ApolloError('Test status must be a string.', 'BAD_USER_INPUT', {
                field: 'test_status'
            });
        }

        const evaluationType = blockCheck.evaluation_type;
        const upperTestType = test_type.toUpperCase();

        const allowedTestTypes = evaluationType === 'COMPETENCY'
            ? ['ORAL', 'WRITTEN', 'MEMOIRE_WRITTEN', 'FREE_CONTINUOUS_CONTROL', 'MENTOR_EVALUATION']
            : evaluationType === 'SCORE'
                ? ['FREE_CONTINUOUS_CONTROL', 'MEMMOIRE_ORAL_NON_JURY', 'MEMOIRE_ORAL', 'MEMOIRE_WRITTEN', 'MENTOR_EVALUATION', 'ORAL', 'WRITTEN']
                : [];

        if (!allowedTestTypes.includes(upperTestType)) {
            throw new ApolloError(`Test type '${upperTestType}' is not allowed for block with evaluation_type '${evaluationType}'.`, 'BAD_USER_INPUT', {
                field: 'test_type'
            });
        }

        if (is_retake && connected_test.length) {
            const connectedTestCheck = await TestModel.findOne({
                _id: connected_test,
                test_status: 'ACTIVE'
            });
            if (!connectedTestCheck) {
                throw new ApolloError('Connected test not found or is not active', 'NOT_FOUND', {
                    field: 'connected_test'
                });
            }
        }

        const upperResultVisibility = result_visibility.toUpperCase();
        const upperCorrectionType = correction_type.toUpperCase();
        const upperTestStatus = test_status.toUpperCase();

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        const testData = {
            name: name,
            description: description,
            test_type: upperTestType,
            result_visibility: upperResultVisibility,
            weight: weight,
            correction_type: upperCorrectionType,
            notations: notations,
            is_retake: is_retake,
            connected_test: connected_test,
            test_status: upperTestStatus,
            updated_by: updatedByUserId
        }

        const updatedTest = await TestModel.findOneAndUpdate({ _id: id, test_status: 'ACTIVE' }, testData, { new: true });

        if (!updatedTest) {
            throw new ApolloError('Test update failed', 'TEST_UPDATE_FAILED');
        }

        return updatedTest;
    } catch (error) {
        throw new ApolloError('Failed to update test', 'TEST_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Soft deletes a test and removes its reference from the parent subject.
 * @param {string} id - The unique identifier of the test to be deleted.
 * @returns {Promise<object>} - A promise that resolves to the test object as it was before being updated.
 */
async function DeleteTestHelper(id) {
    try {
        validator.ValidateDeleteTestInput(id);

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const deletedByUserId = '6846e5769e5502fce150eb67';

        const testData = {
            test_status: 'DELETED',
            updated_at: deletedByUserId,
            deleted_by: deletedByUserId,
            deleted_at: Date.now()
        }

        const deletedTest = await TestModel.findOneAndUpdate({ _id: id }, testData);

        if (!deletedTest) {
            throw new ApolloError('Test deletion failed', 'TEST_DELETION_FAILED');
        }

        await SubjectModel.updateOne(
            { _id: deletedTest.subject, subject_status: 'ACTIVE' },
            {
                $pull: { tests: deletedTest._id },
                $set: { updated_by: deletedByUserId }
            }
        );

        return deletedTest;
    } catch (error) {
        throw new ApolloError('Failed to delete test', 'TEST_DELETION_FAILED', {
            error: error.message
        });
    }
}


// *************** EXPORT MODULE ***************
module.exports = {
    GetAllTestsHelper,
    GetOneTestHelper,
    CreateTestHelper,
    PublishTestHelper,
    UpdateTestHelper,
    DeleteTestHelper
}