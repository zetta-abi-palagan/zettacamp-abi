// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const sgMail = require('@sendgrid/mail');

// *************** IMPORT MODULE *************** 
const TaskModel = require('./task.model');
const { SENDGRID_API_KEY, SENDGRID_SENDER_EMAIL } = require('../../core/config');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');

/**
 * Creates a clean data payload for a new task.
 * @param {object} taskInput - The raw input object containing the task's properties.
 * @param {string} userId - The ID of the user creating the task.
 * @returns {object} A processed data payload suitable for a create operation.
 */
function GetCreateTaskPayload(taskInput, userId) {
    CommonValidator.ValidateInputTypeObject(taskInput);

    const {
        test,
        user,
        title,
        description,
        task_type,
        due_date
    } = taskInput;

    return {
        test: test,
        user: user,
        title: title,
        description: description,
        task_type: task_type.toUpperCase(),
        task_status: 'PENDING',
        due_date: due_date,
        created_by: userId,
        updated_by: userId
    };
}

/**
 * Creates a clean data payload for updating an existing task.
 * @param {object} taskInput - The raw input object containing the task's properties to update.
 * @param {string} userId - The ID of the user updating the task.
 * @returns {object} A processed data payload suitable for an update operation.
 */
function GetUpdateTaskPayload(taskInput, userId) {
    CommonValidator.ValidateInputTypeObject(taskInput);

    const {
        user,
        title,
        description,
        task_type,
        due_date
    } = taskInput;

    return {
        user: user,
        title: title,
        description: description,
        task_type: task_type.toUpperCase(),
        task_status: task_status.toUpperCase(),
        due_date: due_date,
        updated_by: userId
    };
}

/**
 * Generates a payload for soft-deleting a task and removing its reference from the parent test.
 * @param {string} taskId - The unique identifier of the task to be deleted.
 * @param {string} userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for the delete and update operations.
 */
async function GetDeleteTaskPayload(taskId, userId) {
    GlobalValidator.ValidateObjectId(taskId);

    const deletionTimestamp = Date.now();

    const task = await TaskModel.findById(taskId);
    if (!task) {
        throw new ApolloError('Task not found', 'TASK_NOT_FOUND');
    }

    const testId = task.test;
    if (!mongoose.Types.ObjectId.isValid(testId)) {
        throw new ApolloError('Invalid test ID in task', 'INVALID_TEST_ID');
    }

    const deleteTaskPayload = {
        task: {
            filter: { _id: taskId },
            update: {
                task_status: 'DELETED',
                updated_by: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        },
        test: {
            filter: { _id: testId },
            update: { $pull: { tasks: taskId } }
        }
    };

    return deleteTaskPayload;
}

/**
 * Creates the payload for marking a task as completed.
 * @param {string} userId - The ID of the user completing the task.
 * @returns {object} A data payload for the update operation.
 */
function GetTaskCompletionPayload(userId) {
    return {
        task_status: 'COMPLETED',
        completed_by: userId,
        completed_at: Date.now(),
        updated_by: userId
    };
}

/**
 * Creates the full payload for a new student test result document.
 * @param {object} enterMarksInput - The input object containing test, student, and marks data.
 * @param {string} userId - The ID of the user creating the result.
 * @returns {object} A data payload for creating the new student test result.
 */
function GetStudentTestResultPayload(enterMarksInput, userId) {
    CommonValidator.ValidateInputTypeObject(enterMarksInput);

    const { test, student, marks } = enterMarksInput;

    let totalMarks = 0;

    for (const item of marks) {
        totalMarks += item.mark
    }

    const averageMark = totalMarks / marks.length;

    return {
        student: student,
        test: test,
        marks: marks,
        average_mark: averageMark,
        mark_entry_date: Date.now(),
        student_test_result_status: 'PENDING',
        created_by: userId,
        updated_by: userId
    };
}

/**
 * Creates the payload for validating a student's test result.
 * @param {string} userId - The ID of the user validating the result.
 * @returns {object} A data payload for the update operation.
 */
function GetStudentTestResultValidationPayload(userId) {
    return {
        student_test_result_status: 'VALIDATED',
        marks_validated_date: Date.now(),
        updated_by: userId
    };
}

/**
 * Constructs the content for the 'Assign Corrector' email notification.
 * @param {object} test - The test document object.
 * @param {object} subject - The subject document object.
 * @param {Array<object>} students - An array of student document objects.
 * @returns {object} An object containing the email `subject` and `html` content.
 */
function GetAssignCorrectorEmail(test, subject, students) {
    const studentNames = students.map(function (s) {
        return s.first_name + ' ' + s.last_name;
    });

    const subjectMsg = 'You have been assigned as a Test Corrector!';

    const html = `
    <h2>You have been assigned as a Test Corrector!</h2>
    <p><strong>Test Name:</strong> ${test.name}</p>
    <p><strong>Subject:</strong> ${subject.name}</p>
    <p><strong>Description:</strong> ${test.description}</p>
    <p><strong>Students to Correct:</strong></p>
    <ol>
        ${studentNames.map(function (name) {
        return `<li>${name}</li>`;
    }).join('')}
    </ol>
`;

    return { subject: subjectMsg, html: html };
}

/**
 * Sends an email using the SendGrid service.
 * @param {string} to - The email address of the recipient.
 * @param {string} subject - The subject line of the email.
 * @param {string} html - The HTML content for the email body.
 * @returns {Promise<object>} - A promise that resolves to an object indicating the outcome of the email sending attempt.
 */
async function SendEmailWithSendGrid(to, subject, html) {
    try {
        sgMail.setApiKey(SENDGRID_API_KEY);

        const msg = {
            to,
            from: SENDGRID_SENDER_EMAIL,
            subject,
            html
        };

        const [response] = await sgMail.send(msg);

        return {
            success: response.statusCode >= 200 && response.statusCode < 300,
            statusCode: response.statusCode
        };
    } catch (error) {
        console.error('SendGrid Error:', error.message || error);
        return {
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateTaskPayload,
    GetUpdateTaskPayload,
    GetDeleteTaskPayload,
    GetTaskCompletionPayload,
    GetStudentTestResultPayload,
    GetStudentTestResultValidationPayload,
    GetAssignCorrectorEmail,
    SendEmailWithSendGrid
}