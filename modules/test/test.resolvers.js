// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('../block/block.model');
const SubjectModel = require('../subject/subject.model');
const TestModel = require('./test.model');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model');
const TaskModel = require('../task/task.model');
const UserModel = require('../user/user.model');

// *************** IMPORT HELPER FUNCTION *************** 
const TestHelper = require('./test.helper');

// *************** IMPORT VALIDATOR ***************
const TestValidator = require('./test.validator');
const CommonValidator = require('../../shared/validator/index');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch all tests, with an optional filter for test status.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} [args.test_status] - Optional. The status to filter tests by (e.g., 'ACTIVE').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of test objects.
 */
async function GetAllTests(_, { test_status }) {
    try {
        TestValidator.ValidateTestStatusFilter(test_status);

        const testFilter = test_status ? { test_status: test_status } : { test_status: { $ne: 'DELETED' } };

        const tests = await TestModel.find(testFilter).lean();

        return tests;
    } catch (error) {
        console.error('Unexpected error in GetAllTests:', error);

        throw new ApolloError('Failed to retrieve tests', 'GET_TESTS_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to fetch a single test by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the test to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found test object.
 */
async function GetOneTest(_, { id }) {
    try {
        CommonValidator.ValidateObjectId(id);

        const test = await TestModel.findOne({ _id: id }).lean();
        if (!test) {
            throw new ApolloError('Test not found', 'NOT_FOUND');
        }

        return test;
    } catch (error) {
        console.error('Unexpected error in GetOneTest:', error);

        throw new ApolloError('Failed to retrieve test', 'GET_TEST_FAILED', {
            error: error.message
        });
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new test and associate it with a parent subject.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.createTestInput - An object containing the details for the new test.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the newly created test object.
 */
async function CreateTest(_, { createTestInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateInputTypeObject(createTestInput);
        CommonValidator.ValidateObjectId(createTestInput.subject);

        // *************** Ensure parent subject exists and is active
        const parentSubject = await SubjectModel.findOne({ _id: createTestInput.subject, subject_status: { $ne: 'DELETED' } }).select({ block: 1 }).lean();
        if (!parentSubject) {
            throw new ApolloError('Parent subject not found.', 'NOT_FOUND');
        }

        // *************** Ensure parent block to the subject exists and is active
        const parentBlock = await BlockModel.findOne({ _id: parentSubject.block, block_status: { $ne: 'DELETED' } }).select({ evaluation_type: 1 }).lean();
        if (!parentBlock) {
            throw new ApolloError('Parent block not found.', 'NOT_FOUND');
        }

        TestValidator.ValidateTestInput({ testInput: createTestInput, evaluationType: parentBlock.evaluation_type });

        // *************** Prepare payload and create test
        const createTestPayload = TestHelper.GetCreateTestPayload({ testInput: createTestInput, userId, evaluationType: parentBlock.evaluation_type });

        const newTest = await TestModel.create(createTestPayload);
        if (!newTest) {
            throw new ApolloError('Failed to create test', 'CREATE_TEST_FAILED');
        }

        // *************** Add new test to parent subject's tests array
        const updatedSubject = await SubjectModel.updateOne(
            { _id: createTestInput.subject },
            { $addToSet: { tests: newTest._id } }
        )
        if (!updatedSubject.nModified) {
            throw new ApolloError('Failed to add test to subject', 'SUBJECT_UPDATE_FAILED');
        }

        return newTest;
    } catch (error) {
        console.error('Unexpected error in CreateTest:', error);

        throw new ApolloError('Failed to create test', 'CREATE_TEST_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to publish a test, setting its due dates and creating a task to assign a corrector.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the test to publish.
 * @param {Date|string} args.assign_corrector_due_date - The deadline for assigning a corrector.
 * @param {Date|string} args.test_due_date - The deadline for completing the test.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to an object containing the published test and the new task.
 */
async function PublishTest(_, { id, assign_corrector_due_date, test_due_date }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);
        TestValidator.ValidatePublishTestInput({ assignCorrectorDueDate: assign_corrector_due_date, testDueDate: test_due_date });

        // *************** Prepare payload for publishing the test
        const publishTestPayload = TestHelper.GetPublishTestPayload({ userId, testDueDate: test_due_date });

        // *************** Update test status and due date
        const publishedTest = await TestModel.findOneAndUpdate(
            { _id: id, test_status: { $ne: 'DELETED' } },
            { $set: publishTestPayload },
            { new: true }
        ).lean();
        if (!publishedTest) {
            throw new ApolloError('Test not found', 'NOT_FOUND');
        }

        // *************** Get the academic director ID
        const academicDirector = await UserModel.findOne({ role: 'ACADEMIC_DIRECTOR', user_status: 'ACTIVE' }).select({ _id: 1 }).lean();
        if (!academicDirector) {
            throw new ApolloError('Academic director not found', 'NOT_FOUND')
        }

        // *************** Prepare payload for assign corrector task
        const assignCorrectorTaskPayload = TestHelper.GetAssignCorrectorTaskPayload({ testId: publishedTest._id, assignCorrectorDueDate: assign_corrector_due_date, userId, academicDirectorId: academicDirector._id });

        // *************** Create assign corrector task
        const assignCorrectorTask = await TaskModel.create(assignCorrectorTaskPayload);
        if (!assignCorrectorTask) {
            throw new ApolloError('Failed to create assign corrector task', 'CREATE_TASK_FAILED');
        }

        // *************** Add assign corrector task to test's tasks array
        const updatedTest = await TestModel.updateOne(
            { _id: assignCorrectorTask.test },
            { $addToSet: { tasks: assignCorrectorTask._id } }
        );
        if (!updatedTest.nModified) {
            throw new ApolloError('Failed to add task to test', 'TEST_UPDATE_FAILED');
        }

        return {
            test: publishedTest,
            assign_corrector_task: assignCorrectorTask
        }
    } catch (error) {
        console.error('Unexpected error in PublishTest:', error);

        throw new ApolloError('Failed to publish test', 'PUBLISH_TEST_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to update an existing test with partial data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the test to update.
 * @param {object} args.updateTestInput - An object containing the fields to be updated.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the updated test object.
 */
async function UpdateTest(_, { id, updateTestInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);
        CommonValidator.ValidateObjectId(updateTestInput.subject);

        // *************** Fetch the test to be updated
        const test = await TestModel.findById(id).lean();
        if (!test) {
            throw new ApolloError('Test not found', 'NOT_FOUND');
        }

        // *************** Ensure parent subject exists and is active
        const parentSubject = await SubjectModel.findOne({ _id: updateTestInput.subject, subject_status: { $ne: 'DELETED' } }).select({ block: 1 }).lean();
        if (!parentSubject) {
            throw new ApolloError('Parent subject not found.', 'NOT_FOUND');
        }

        // *************** Ensure parent block to the subject exists and is active
        const parentBlock = await BlockModel.findById({ _id: parentSubject.block, block_status: { $ne: 'DELETED' } }).select({ evaluation_type: 1 }).lean();
        if (!block || block.block_status !== 'ACTIVE') {
            throw new ApolloError('Parent block not found.', 'NOT_FOUND');
        }

        TestValidator.ValidateTestInput({ testInput: updateTestInput, evaluationType: parentBlock.evaluation_type, isUpdate: true });

        // *************** Prepare payload and update test
        const updateTestPayload = TestHelper.GetUpdateTestPayload({ testInput: updateTestInput, userId, evaluationType: parentBlock.evaluation_type });

        // *************** Update the test in the database
        const updatedTest = await TestModel.findOneAndUpdate({ _id: id }, { $set: updateTestPayload }, { new: true }).lean();
        if (!updatedTest) {
            throw new ApolloError('Failed to update test', 'UPDATE_TEST_FAILED');
        }

        return updatedTest;
    } catch (error) {
        console.error('Unexpected error in UpdateTest:', error);

        throw new ApolloError('Failed to update test', 'UPDATE_TEST_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to perform a cascading soft delete on a test and its descendants.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the test to delete.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the test object as it was before being soft-deleted.
 */
async function DeleteTest(_, { id }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);

        // *************** Prepare payloads for cascading soft delete
        const {
            test,
            subject,
            tasks,
            studentTestResults
        } = await TestHelper.GetDeleteTestPayload({ testId: id, userId });

        // *************** Soft delete all related student test results
        if (studentTestResults) {
            const deletedStudentTestResults = await StudentTestResultModel.updateMany(
                studentTestResults.filter,
                studentTestResults.update
            );
            if (!deletedStudentTestResults.nModified) {
                throw new ApolloError('No student test results matched for deletion', 'STUDENT_RESULTS_NOT_FOUND');
            }
        }

        // *************** Soft delete all related tasks
        if (tasks) {
            const deletedTasks = await TaskModel.updateMany(
                tasks.filter,
                tasks.update
            );
            if (!deletedTasks.nModified) {
                throw new ApolloError('No tasks matched for deletion', 'TASKS_NOT_FOUND');
            }
        }

        // *************** Soft delete the test itself
        const deletedTest = await TestModel.findOneAndUpdate(
            test.filter,
            test.update
        ).lean();
        if (!deletedTest) {
            throw new ApolloError('Test deletion failed', 'TEST_DELETION_FAILED');
        }

        // *************** Remove test reference from parent subject
        const updatedSubject = await SubjectModel.updateOne(subject.filter, subject.update);
        if (!updatedSubject.nModified) {
            throw new ApolloError('Failed to update subject (remove test)', 'SUBJECT_UPDATE_FAILED');
        }

        return deletedTest;
    } catch (error) {
        console.error('Unexpected error in DeleteTest:', error);

        throw new ApolloError('Failed to delete test', 'DELETE_TEST_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************
/**
 * Loads the parent subject for a test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.subject - The ID of the subject to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the subject object.
 */
async function SubjectLoader(test, _, context) {
    try {
        TestValidator.ValidateSubjectLoaderInput(test, context);

        const subject = await context.dataLoaders.SubjectLoader.load(test.subject);

        return subject;
    } catch (error) {
        throw new ApolloError(`Failed to fetch subject`, 'SUBJECT_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the student test results associated with a test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {Array<string>} test.student_test_results - An array of student test result IDs to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student test result objects.
 */
async function StudentTestResultLoader(test, _, context) {
    try {
        TestValidator.ValidateStudentTestResultLoaderInput(test, context);

        const studentTestResults = await context.dataLoaders.StudentTestResultLoader.loadMany(test.student_test_results);

        return studentTestResults;
    } catch (error) {
        throw new ApolloError(`Failed to fetch student test results`, 'STUDENT_TEST_RESULTS_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the tasks associated with a test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {Array<string>} test.tasks - An array of task IDs to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of task objects.
 */
async function TaskLoader(test, _, context) {
    try {
        TestValidator.ValidateTaskLoaderInput(test, context);

        const tasks = await context.dataLoaders.TaskLoader.loadMany(test.tasks);

        return tasks;
    } catch (error) {
        throw new ApolloError(`Failed to fetch tasks`, 'TASKS_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who created the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.created_by - The ID of the user who created the test.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(test, _, context) {
    try {
        TestValidator.ValidateUserLoaderInput(test, context, 'created_by');

        const createdBy = await context.dataLoaders.UserLoader.load(test.created_by);

        return createdBy;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who last updated the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.updated_by - The ID of the user who last updated the test.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(test, _, context) {
    try {
        TestValidator.ValidateUserLoaderInput(test, context, 'updated_by');

        const updatedBy = await context.dataLoaders.UserLoader.load(test.updated_by);

        return updatedBy;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who published the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.published_by - The ID of the user who published the test.
 * @param {object} _ - The arguments object, not used in this resolver.
 *- @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function PublishedByLoader(test, _, context) {
    try {
        TestValidator.ValidateUserLoaderInput(test, context, 'published_by');

        const publishedBy = await context.dataLoaders.UserLoader.load(test.published_by);

        return publishedBy;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who deleted the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.updated_by - The ID of the user who performed the deletion.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function DeletedByLoader(test, _, context) {
    try {
        TestValidator.ValidateUserLoaderInput(test, context, 'deleted_by');

        const deletedBy = await context.dataLoaders.UserLoader.load(test.deleted_by);

        return deletedBy;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllTests,
        GetOneTest
    },

    Mutation: {
        CreateTest,
        PublishTest,
        UpdateTest,
        DeleteTest
    },

    Test: {
        subject: SubjectLoader,
        student_test_results: StudentTestResultLoader,
        tasks: TaskLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        published_by: PublishedByLoader,
        deleted_by: DeletedByLoader
    }
}