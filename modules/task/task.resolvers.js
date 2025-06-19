// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./task.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./task.validator');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch all tasks, with optional filters.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} [args.task_status] - Optional. The status to filter tasks by.
 * @param {string} [args.test_id] - Optional. The ID of the test to filter tasks by.
 * @param {string} [args.user_id] - Optional. The ID of the user to filter tasks by.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of task objects.
 */
async function GetAllTasks(_, { task_status, test_id, user_id }) {
    try {
        validator.ValidateGetAllTasksInput(task_status, test_id, user_id);

        const tasks = await helper.GetAllTasksHelper(task_status, test_id, user_id);

        return tasks;
    } catch (error) {
        console.error('Unexpected error in GetAllTasks:', error);

        throw new ApolloError('Failed to retrieve tasks', 'GET_TASKS_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to fetch a single task by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the task to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found task object.
 */
async function GetOneTask(_, { id }) {
    try {
        validator.ValidateGetOneTaskInput(id);

        const task = await helper.GetOneTaskHelper(id);

        return task;
    } catch (error) {
        console.error('Unexpected error in GetOneTask:', error);

        throw new ApolloError('Failed to retrieve task', 'GET_TASK_FAILED', {
            error: error.message
        });
    }
}


// *************** MUTATION ***************
/**
 * GraphQL resolver to assign a corrector to a test.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.task_id - The ID of the 'ASSIGN_CORRECTOR' task.
 * @param {string} args.corrector_id - The ID of the user being assigned as the corrector.
 * @param {Date|string} args.enter_marks_due_date - The due date for the new 'ENTER_MARKS' task.
 * @returns {Promise<object>} - A promise that resolves to the newly created 'ENTER_MARKS' task object.
 */
async function AssignCorrector(_, { task_id, corrector_id, enter_marks_due_date }) {
    try {
        validator.ValidateAssignCorrectorInput(task_id, corrector_id, enter_marks_due_date);

        const enterMarksTask = await helper.AssignCorrectorHelper(task_id, corrector_id, enter_marks_due_date);

        return enterMarksTask;
    } catch (error) {
        console.error('Unexpected error in AssignCorrector:', error);

        throw new ApolloError('Failed to assign corrector', 'ASSIGN_CORRECTOR_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to enter marks for a student's test, which completes an 'ENTER_MARKS' task and creates a 'VALIDATE_MARKS' task.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.task_id - The ID of the 'ENTER_MARKS' task to be completed.
 * @param {object} args.enterMarksInput - An input object containing the test, student, and marks data.
 * @param {Date|string} args.validate_marks_due_date - The due date for the subsequent 'VALIDATE_MARKS' task.
 * @returns {Promise<object>} - A promise that resolves to the newly created 'VALIDATE_MARKS' task object.
 */
async function EnterMarks(_, { task_id, enterMarksInput, validate_marks_due_date }) {
    try {
        validator.ValidateInputTypeObject(enterMarksInput);

        const { test, student, marks } = enterMarksInput;

        validator.ValidateEnterMarksInput(task_id, test, student, marks, validate_marks_due_date);

        const validateMarksTask = await helper.EnterMarksHelper(task_id, test, student, marks, validate_marks_due_date)

        return validateMarksTask
    } catch (error) {
        console.error('Unexpected error in EnterMarks:', error);

        throw new ApolloError('Failed to enter marks', 'ENTER_MARKS_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to validate a student's test marks.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.task_id - The ID of the 'VALIDATE_MARKS' task.
 * @param {string} args.student_test_result_id - The ID of the student test result to validate.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function ValidateMarks(_, { task_id, student_test_result_id }) {
    try {
        validator.ValidateValidateMarksInput(task_id, student_test_result_id);

        const validatedMarks = helper.ValidateMarksHelper(task_id, student_test_result_id);

        return validatedMarks;
    } catch (error) {
        console.error('Unexpected error in ValidateMarks:', error);

        throw new ApolloError('Failed to validate marks', 'VALIDATE_MARKS_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************
/**
 * Loads the test associated with a task using a DataLoader.
 * @param {object} task - The parent task object.
 * @param {string} task.test - The ID of the test to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the test object.
 */
async function TestLoader(task, _, context) {
    try {
        validator.ValidateTestLoaderInput(task, context);

        const test = await context.dataLoaders.TaskLoader.load(task.test);

        return test;
    } catch (error) {
        throw new ApolloError(`Failed to fetch test`, 'TEST_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user associated with a task using a DataLoader.
 * @param {object} task - The parent task object.
 * @param {string} task.user - The ID of the user to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UserLoader(task, _, context) {
    try {
        validator.ValidateUserLoaderInput(task, context, 'user');

        const user = await context.dataLoaders.TaskLoader.load(task.user);

        return user;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user`, 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who created the task using a DataLoader.
 * @param {object} task - The parent task object.
 * @param {string} task.created_by - The ID of the user who created the task.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(task, _, context) {
    try {
        validator.ValidateUserLoaderInput(task, context, 'created_by');

        const created_by = await context.dataLoaders.UserLoader.load(task.created_by);

        return created_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who last updated the task using a DataLoader.
 * @param {object} task - The parent task object.
 * @param {string} task.updated_by - The ID of the user who last updated the task.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(task, _, context) {
    try {
        validator.ValidateUserLoaderInput(task, context, 'updated_by');

        const updated_by = await context.dataLoaders.UserLoader.load(task.updated_by);

        return updated_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who deleted the task using a DataLoader.
 * @param {object} task - The parent task object.
 * @param {string} task.updated_by - The ID of the user who performed the deletion.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function DeletedByLoader(task, _, context) {
    try {
        validator.ValidateUserLoaderInput(task, context, 'deleted_by');

        const deleted_by = await context.dataLoaders.UserLoader.load(task.updated_by);

        return deleted_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllTasks,
        GetOneTask,
    },

    Mutation: {
        // CreateTask,
        // UpdateTask,
        // DeleteTask,
        AssignCorrector,
        EnterMarks,
        ValidateMarks
    },

    Task: {
        test: TestLoader,
        user: UserLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        deleted_by: DeletedByLoader
    }
}