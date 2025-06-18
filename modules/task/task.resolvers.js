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