// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./task.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./task.validator');

// *************** QUERY ***************



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

// *************** LOADER ***************



// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllTasks,
        GetTasksForUser,
        GetTasksForTest
    },

    Mutation: {
        CreateTask,
        UpdateTask,
        DeleteTask,
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