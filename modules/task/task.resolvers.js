// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const TaskModel = require('./task.model');
const TestModel = require('../test/test.model');
const SubjectModel = require('../subject/subject.model');
const UserModel = require('../user/user.model');
const StudentModel = require('../student/student.model');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model');

// *************** IMPORT HELPER FUNCTION *************** 
const TaskHelper = require('./task.helper');

// *************** IMPORT VALIDATOR ***************
const TaskValidator = require('./task.validator');
const CommonValidator = require('../../shared/validator/index');

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
        TaskValidator.ValidateTaskFilter({ taskStatus: task_status, testId: test_id, userId: user_id });

        const filter = {};

        filter.task_status = task_status ? task_status : { $ne: 'DELETED' };
        if (test_id) { filter.test = test_id; }
        if (user_id) { filter.user = user_id; }

        const tasks = await TaskModel.find(filter).lean();

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
        CommonValidator.ValidateObjectId(id);

        const task = await TaskModel.findOne({ _id: id }).lean();
        if (!task) {
            throw new ApolloError('Task not found', 'NOT_FOUND');
        }

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
 * GraphQL resolver to create a new task and associate it with a parent test.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.createTaskInput - An object containing the details for the new task.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the newly created task object.
 */
async function CreateTask(_, { createTaskInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateInputTypeObject(createTaskInput);
        TaskValidator.ValidateTaskInput(createTaskInput);

        // *************** Check if test exists and is not deleted
        const testCheck = await TestModel.findOne({ _id: createTaskInput.test, test_status: { $ne: 'DELETED' } }).lean();
        if (!testCheck) {
            throw new ApolloError('Test not found or is not active.', 'NOT_FOUND');
        }

        // *************** Check if user exists and is not deleted
        const userCheck = await UserModel.findOne({ _id: createTaskInput.user, user_status: { $ne: 'DELETED' } }).lean();
        if (!userCheck) {
            throw new ApolloError('User not found or is not active.', 'NOT_FOUND');
        }

        // *************** Prepare payload and create new task
        const createTaskPayload = TaskHelper.GetCreateTaskPayload({ taskInput: createTaskInput, userId });

        const newTask = await TaskModel.create(createTaskPayload);

        // *************** Add new task to test's tasks array
        const updatedTest = await TestModel.updateOne({ _id: createTaskInput.test }, { $addToSet: { tasks: newTask._id } });
        if (!updatedTest.nModified) {
            throw new ApolloError('Failed to add test to subject', 'SUBJECT_UPDATE_FAILED');
        }

        return newTask;
    } catch (error) {
        console.error('Unexpected error in CreateTask:', error);

        throw new ApolloError('Failed to create task', 'CREATE_TASK_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to update an existing task with partial data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the task to update.
 * @param {object} args.updateTaskInput - An object containing the fields to be updated.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the updated task object.
 */
async function UpdateTask(_, { id, updateTaskInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);
        CommonValidator.ValidateInputTypeObject(updateTaskInput);
        TaskValidator.ValidateTaskInput({ taskId: id, taskInput: updateTaskInput });

        // *************** Prepare update payload and update task
        const updateTaskPayload = TaskHelper.GetUpdateTaskPayload({ taskInput: updateTaskInput, userId });

        // *************** Update task in database
        const updatedTask = await TaskModel.findByIdAndUpdate(id, { $set: updateTaskPayload }, { new: true }).lean();
        if (!updatedTask) {
            throw new ApolloError('Task failed to update.', 'UPDATE_TASK_FAILED');
        }

        return updatedTask;
    } catch (error) {
        console.error('Unexpected error in UpdateTask:', error);

        throw new ApolloError('Failed to update task', 'UPDATE_TASK_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to soft-delete a task and remove its reference from the parent test.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the task to delete.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the task object as it was before being soft-deleted.
 */
async function DeleteTask(_, { id }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);

        // *************** Prepare delete payloads for task and test
        const {
            task,
            test
        } = await TaskHelper.GetDeleteTaskPayload({ taskId: id, userId });

        // *************** Soft-delete the task
        const deletedTask = await TaskModel.findOneAndUpdate(
            task.filter,
            task.update,
        ).lean();

        if (!deletedTask) {
            throw new ApolloError('Task deletion failed', 'TASK_DELETION_FAILED');
        }

        // *************** Remove task reference from test
        const testUpdate = await TestModel.updateOne(test.filter, test.update);
        if (!testUpdate.nModified) {
            throw new ApolloError('Failed to update test', 'TEST_UPDATE_FAILED');
        }

        return deletedTask;
    } catch (error) {
        console.error('Unexpected error in DeleteTask:', error);

        throw new ApolloError('Failed to delete task', 'DELETE_TASK_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver for the 'Assign Corrector' workflow.
 * Completes an existing task, creates a new 'ENTER_MARKS' task, and sends an email notification.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.task_id - The ID of the 'ASSIGN_CORRECTOR' task.
 * @param {string} args.corrector_id - The ID of the user being assigned as the corrector.
 * @param {Date|string} args.enter_marks_due_date - The due date for the new 'ENTER_MARKS' task.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the newly created 'ENTER_MARKS' task object.
 */
async function AssignCorrector(_, { task_id, corrector_id, enter_marks_due_date }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        TaskValidator.ValidateAssignCorrectorInput({ taskId: task_id, correctorId: corrector_id, enterMarksDueDate: enter_marks_due_date });

        // *************** Find the assign corrector task and ensure it is pending
        const assignCorrectorTask = await TaskModel.findOne({ _id: task_id, task_type: 'ASSIGN_CORRECTOR', task_status: 'PENDING' }).select({ test: 1 }).lean();
        if (!assignCorrectorTask) {
            throw new ApolloError('Assign corrector task not found.', 'BAD_REQUEST');
        }

        // *************** Ensure the corrector exists and is active
        const corrector = await UserModel.findOne({ _id: corrector_id, role: 'CORRECTOR', user_status: 'ACTIVE' }).select({ _id: 1, email: 1 }).lean();
        if (!corrector) {
            throw new ApolloError('The specified user is not a valid, active corrector.', 'BAD_REQUEST');
        }

        // *************** Fetch the related test
        const test = await TestModel.findById(assignCorrectorTask.test).select({ subject: 1, name: 1, description: 1 }).lean();
        if (!test) {
            throw new ApolloError('Related test not found.', 'NOT_FOUND');
        }

        const subject = await SubjectModel.findById(test.subject).lean();
        if (!subject) {
            throw new ApolloError('Related subject not found.', 'NOT_FOUND');
        }

        // *************** Get all active students
        const students = await StudentModel.find({ student_status: 'ACTIVE' }).select({ first_name: 1, last_name: 1 }).lean();
        if (!students) {
            throw new ApolloError('Students not found', 'NOT_FOUND');
        }

        // *************** Mark the assign corrector task as completed
        const taskCompletionPayload = TaskHelper.GetTaskCompletionPayload(userId);

        const completeAssignCorrectorTask = await TaskModel.updateOne({ _id: task_id, task_type: 'ASSIGN_CORRECTOR', task_status: 'PENDING' }, { $set: taskCompletionPayload });
        if (!completeAssignCorrectorTask.nModified) {
            throw new ApolloError('Assign corrector task completion failed', 'TASK_COMPLETION_FAILED');
        }

        // *************** Create a new enter marks task for the corrector
        const enterMarksTaskData = {
            test: String(test._id),
            user: corrector_id,
            title: 'Enter Marks',
            description: 'Corrector should enter marks for student test: ' + test.name,
            task_type: 'ENTER_MARKS',
            due_date: enter_marks_due_date
        };

        const newTaskPayload = TaskHelper.GetCreateTaskPayload({ taskInput: enterMarksTaskData, userId });

        const enterMarksTask = await TaskModel.create(newTaskPayload);
        if (!enterMarksTask) {
            throw new ApolloError('Failed to create enter marks task', 'CREATE_TASK_FAILED');
        }

        // *************** Add the new enter marks task to the test
        const updatedTest = await TestModel.updateOne({ _id: test._id }, { $addToSet: { tasks: enterMarksTask._id } });
        if (!updatedTest.nModified) {
            throw new ApolloError('Failed to add task to test', 'TEST_UPDATE_FAILED');
        }

        // *************** Send notification email to the corrector (replace with corrector.email in production)
        const emailRecipient = corrector.email;

        const emailContent = TaskHelper.GetAssignCorrectorEmail({ test, subject, students });

        const sendEmail = await TaskHelper.SendEmailWithSendGrid({
            to: emailRecipient,
            subject: emailContent.subject,
            html: emailContent.html
        });
        if (!sendEmail.success) {
            console.error("CRITICAL: Corrector was assigned but notification email failed to send.", emailResult.error);
        }

        return enterMarksTask;
    } catch (error) {
        console.error('Unexpected error in AssignCorrector:', error);

        throw new ApolloError('Failed to assign corrector', 'ASSIGN_CORRECTOR_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver for the 'Enter Marks' workflow.
 * Completes an 'ENTER_MARKS' task, creates a student test result, and creates a new 'VALIDATE_MARKS' task.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.task_id - The ID of the 'ENTER_MARKS' task to be completed.
 * @param {object} args.enterMarksInput - An input object containing the test, student, and marks data.
 * @param {Date|string} args.validate_marks_due_date - The due date for the subsequent 'VALIDATE_MARKS' task.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to an object containing the new student test result and the new validation task.
 */
async function EnterMarks(_, { task_id, enterMarksInput, validate_marks_due_date }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateInputTypeObject(enterMarksInput);
        CommonValidator.ValidateObjectId(task_id);

        // *************** Find the enter marks task and ensure it is pending
        const enterMarksTask = await TaskModel.findOne({ _id: task_id, task_type: 'ENTER_MARKS', task_status: 'PENDING' }).select({ _id: 1 }).lean();
        if (!enterMarksTask) {
            throw new ApolloError('Enter Marks task not found or is not pending.', 'BAD_REQUEST');
        }

        // *************** Fetch the related test
        const parentTest = await TestModel.findById(enterMarksInput.test).select({ notations: 1, name: 1 }).lean();
        if (!parentTest) {
            throw new ApolloError('Related test not found.', 'NOT_FOUND');
        }

        TaskValidator.ValidateEnterMarksInput({ enterMarksInput, notations: parentTest.notations });

        const studentTestResultPayload = TaskHelper.GetStudentTestResultPayload({ enterMarksInput, userId, notations: parentTest.notations });

        // *************** Create student test result
        const studentTestResult = await StudentTestResultModel.create(studentTestResultPayload);
        if (!studentTestResult) {
            throw new ApolloError('Failed to create student test result', 'CREATE_STUDENT_TEST_RESULT_FAILED');
        }

        // *************** Mark the enter marks task as completed
        const taskCompletionPayload = TaskHelper.GetTaskCompletionPayload(userId);
        const completeEnterMarksTask = await TaskModel.updateOne({ _id: task_id, task_type: 'ENTER_MARKS', task_status: 'PENDING' }, { $set: taskCompletionPayload });
        if (!completeEnterMarksTask.nModified) {
            throw new ApolloError('Failed to complete enter marks task', 'TASK_COMPLETION_FAILED');
        }

        // *************** Get the academic director ID
        const academicDirector = await UserModel.findOne({ role: 'ACADEMIC_DIRECTOR', user_status: 'ACTIVE' }).select({ _id: 1 }).lean();
        if (!academicDirector) {
            throw new ApolloError('Academic director not found', 'NOT_FOUND')
        }

        const validateMarksTaskData = {
            test: enterMarksInput.test,
            user: academicDirector._id,
            title: 'Validate Marks',
            description: 'Academic Director should validate mark entry for test: ' + parentTest.name,
            task_type: 'VALIDATE_MARKS',
            due_date: validate_marks_due_date
        };
        const validateMarksTaskPayload = TaskHelper.GetCreateTaskPayload({ taskInput: validateMarksTaskData, userId });

        const validateMarksTask = await TaskModel.create(validateMarksTaskPayload);
        if (!validateMarksTask) {
            throw new ApolloError('Failed to create validate marks task', 'CREATE_TASK_FAILED');
        }

        // *************** Add validate marks task to test
        const insertTaskToTest = await TestModel.updateOne({ _id: enterMarksInput.test }, { $addToSet: { tasks: validateMarksTask._id } });
        if (!insertTaskToTest.nModified) {
            throw new ApolloError('Failed to add task to test', 'TEST_UPDATE_FAILED');
        }

        // *************** Add student test result to test
        const insertStudentTestResultToTest = await TestModel.updateOne({ _id: enterMarksInput.test }, { $addToSet: { student_test_results: studentTestResult._id } });
        if (!insertStudentTestResultToTest.nModified) {
            throw new ApolloError('Failed to add student test result to test', 'TEST_UPDATE_FAILED');
        }

        return {
            student_test_result: studentTestResult,
            validate_marks_task: validateMarksTask
        }
    } catch (error) {
        console.error('Unexpected error in EnterMarks:', error);

        throw new ApolloError('Failed to enter marks', 'ENTER_MARKS_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver for the 'Validate Marks' workflow.
 * Completes an existing task and validates the associated student test result.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.task_id - The ID of the 'VALIDATE_MARKS' task.
 * @param {string} args.student_test_result_id - The ID of the student test result to validate.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to an object containing the validated student test result and the completed task.
 */
async function ValidateMarks(_, { task_id, student_test_result_id }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        TaskValidator.ValidateValidateMarksInput({ taskId: task_id, studentTestResultId: student_test_result_id });

        // *************** Find the validate marks task and ensure it is pending
        const validateMarksTask = await TaskModel.findOne({ _id: task_id, task_type: 'VALIDATE_MARKS', task_status: 'PENDING' }).select({ _id: 1 }).lean();
        if (!validateMarksTask) {
            throw new ApolloError('Validate Marks task not found or is not pending.', 'BAD_REQUEST');
        }

        // *************** Find the student test result to validate
        const studentTestResultToValidate = await StudentTestResultModel.findOne({ _id: student_test_result_id, student_test_result_status: 'PENDING' }).lean();
        if (!studentTestResultToValidate) {
            throw new ApolloError('Student test result not found or is not pending validation.', 'NOT_FOUND');
        }

        const taskCompletionPayload = TaskHelper.GetTaskCompletionPayload(userId);
        const validationPayload = TaskHelper.GetStudentTestResultValidationPayload(userId);

        // *************** Mark the validate marks task as completed
        const completedTask = await TaskModel.findOneAndUpdate(
            { _id: task_id, task_type: 'VALIDATE_MARKS', task_status: 'PENDING' },
            { $set: taskCompletionPayload },
            { new: true }
        ).lean();
        if (!completedTask) {
            throw new ApolloError('Failed to complete validate marks task', 'TASK_COMPLETION_FAILED');
        }

        // *************** Mark the student test result as validated
        const validatedStudentTestResult = await StudentTestResultModel.findOneAndUpdate({ _id: student_test_result_id }, validationPayload, { new: true }).lean();
        if (!validatedStudentTestResult) {
            throw new ApolloError('Failed to validate student test result', 'VALIDATE_STUDENT_TEST_RESULT_FAILED');
        }

        return {
            student_test_result: validatedStudentTestResult,
            validate_marks_task: completedTask
        }
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
        TaskValidator.ValidateTestLoaderInput(task, context);

        const test = await context.dataLoaders.TestLoader.load(task.test);

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
        TaskValidator.ValidateUserLoaderInput(task, context, 'user');

        const user = await context.dataLoaders.UserLoader.load(task.user);

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
        TaskValidator.ValidateUserLoaderInput(task, context, 'created_by');

        const createdBy = await context.dataLoaders.UserLoader.load(task.created_by);

        return createdBy;
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
        TaskValidator.ValidateUserLoaderInput(task, context, 'updated_by');

        const updatedBy = await context.dataLoaders.UserLoader.load(task.updated_by);

        return updatedBy;
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
        TaskValidator.ValidateUserLoaderInput(task, context, 'deleted_by');

        const deletedBy = await context.dataLoaders.UserLoader.load(task.deleted_by);

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
        GetAllTasks,
        GetOneTask,
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