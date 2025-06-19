// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const sgMail = require('@sendgrid/mail');

// *************** IMPORT MODULE *************** 
const TaskModel = require('./task.model');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model')
const UserModel = require('../user/user.model');
const StudentModel = require('../student/student.model');
const { SENDGRID_API_KEY, SENDGRID_SENDER_EMAIL } = require('../../core/config');

// *************** IMPORT VALIDATOR ***************
const validator = require('./task.validator');

/**
 * Fetches all tasks from the database, applying an optional status filter.
 * @param {string} [task_status] - Optional. The status of the tasks to fetch (e.g., 'PENDING').
 * @param {string} [test_id] - Optional. The ID of the test to filter tasks by.
 * @param {string} [user_id] - Optional. The ID of the user to filter tasks by.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of task objects.
 */
async function GetAllTasksHelper(task_status, test_id, user_id) {
    try {
        validator.ValidateGetAllTasksInput(task_status, test_id, user_id);

        const filter = {};

        if (task_status) {
            filter.task_status = task_status;
        }

        const tasks = await TaskModel.find(filter);

        return tasks;
    } catch (error) {
        throw new ApolloError(`Failed to fetch tasks: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single task by its unique ID after validating the ID.
 * @param {string} id - The unique identifier of the task to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found task object.
 */
async function GetOneTaskHelper(id) {
    try {
        validator.ValidateGetOneTaskInput(id);

        const task = TaskModel.findOne({ _id: id });

        if (!task) {
            throw new ApolloError('Task not found', 'TASK_NOT_FOUND');
        }

        return task;
    } catch (error) {
        throw new ApolloError(`Failed to fetch task: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Sends an email using the SendGrid service.
 * @param {string} to - The email address of the recipient.
 * @param {string} subject - The subject line of the email.
 * @param {string} html - The HTML content for the email body.
 * @returns {Promise<object>} - A promise that resolves to an object indicating success or failure.
 */
async function SendEmailWithSendGrid(to, subject, html) {
    try {
        sgMail.setApiKey(SENDGRID_API_KEY);

        const msg = {
            to: to,
            from: SENDGRID_SENDER_EMAIL,
            subject: subject,
            html: html,
        };
        const [response] = await sgMail.send(msg);

        if (response.statusCode === 202) {
            return { success: true };
        } else {
            return { success: false, error: `Unexpected status code: ${response.statusCode}` };
        }
    } catch (error) {
        console.error('Failed to send email:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Assigns a corrector to a test, completes the assignment task, creates a new task for entering marks, and sends an email notification.
 * @param {string} task_id - The ID of the 'ASSIGN_CORRECTOR' task to be completed.
 * @param {string} corrector_id - The ID of the user being assigned as the corrector.
 * @param {Date|string} enter_marks_due_date - The due date for the new 'ENTER_MARKS' task.
 * @returns {Promise<object>} - A promise that resolves to the newly created 'ENTER_MARKS' task object.
 */
async function AssignCorrectorHelper(task_id, corrector_id, enter_marks_due_date) {
    try {
        validator.ValidateAssignCorrectorInput(task_id, corrector_id, enter_marks_due_date);

        const assignCorrectorTask = await TaskModel.findOne({ _id: task_id, task_type: 'ASSIGN_CORRECTOR', task_status: 'PENDING' });
        if (!assignCorrectorTask) {
            throw new ApolloError('Assign corrector task not found', 'NOT_FOUND', {
                field: 'task_id'
            });
        }

        const corrector = await UserModel.findOne({ _id: corrector_id, role: 'CORRECTOR', user_status: 'ACTIVE' });
        if (!corrector) {
            throw new ApolloError('Corrector not found', 'NOT_FOUND', {
                field: 'corrector_id'
            });
        }

        const students = await StudentModel.find({ student_status: 'ACTIVE' })
        if (!students) {
            throw new ApolloError('Students not found', 'NOT_FOUND');
        }

        const test = await TestModel.findOne({ _id: assignCorrectorTask.test });
        if (!test) {
            throw new ApolloError('Test not found', 'NOT_FOUND');
        }

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const completedByUserId = '6846e5769e5502fce150eb67';

        const assignCorrectorTaskData = {
            task_status: 'COMPLETED',
            completed_by: completedByUserId,
            completed_at: Date.now(),
            updated_by: completedByUserId
        }

        const completeAssignCorrectorTask = await TaskModel.updateOne({ _id: task_id, task_type: 'ASSIGN_CORRECTOR', task_status: 'PENDING' }, assignCorrectorTaskData);
        if (!completeAssignCorrectorTask) {
            throw new ApolloError('Assign corrector task completion failed', 'TASK_COMPLETION_FAILED');
        }

        const enterMarksTaskData = {
            test: test._id,
            user: corrector_id,
            title: 'Enter Marks',
            description: 'Corrector should enter marks for student test',
            task_type: 'ENTER_MARKS',
            task_status: 'PENDING',
            due_date: enter_marks_due_date,
            created_by: completedByUserId,
            updated_by: completedByUserId
        }

        const enterMarksTask = await TaskModel.create(enterMarksTaskData);
        if (!enterMarksTask) {
            throw new ApolloError('Enter marks task creation failed', 'TASK_CREATION_FAILED');
        }

        const updatedTest = await TestModel.updateOne(
            { _id: test._id },
            { $push: { tasks: enterMarksTask._id } }
        );

        if (updatedTest.modifiedCount === 0) {
            throw new ApolloError('Failed to add enter marks task to test', 'TEST_UPDATE_FAILED');
        }

        // *************** Prepare email content
        const studentNames = students.map((s) => `${s.first_name} ${s.last_name}`);

        const subject = 'You have been assigned as a Test Corrector!';

        const html = `
            <h2>You have been assigned as a Test Corrector!</h2>
            <p><strong>Test Name:</strong> ${test.name}</p>
            <p><strong>Subject:</strong> ${test.subject}</p>
            <p><strong>Description:</strong> ${test.description}</p>
            <p><strong>Students to Correct:</strong></p>
            <ul>
                ${studentNames.map((name, i) => `<li>${i + 1}. ${name}</li>`).join('')}
            </ul>
        `;
        // *************** For testing purposes
        const emailRecipient = 'palaganabimanyu@gmail.com'

        const emailResult = await SendEmailWithSendGrid(emailRecipient, subject, html);

        if (!emailResult.success) {
            throw new ApolloError('Email sending failed', 'SENDGRID_FAILED', {
                error: emailResult.error
            });
        }

        return enterMarksTask;
    } catch (error) {
        throw new ApolloError('Failed to assign corrector', 'TASK_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Enters marks for a student's test, creates a result document, completes the current task, and creates a new task for validation.
 * @param {string} task_id - The ID of the 'ENTER_MARKS' task.
 * @param {string} test - The ID of the related test.
 * @param {string} student - The ID of the related student.
 * @param {Array<object>} marks - The array of marks to be entered.
 * @param {Date|string} validate_marks_due_date - The due date for the new 'VALIDATE_MARKS' task.
 * @returns {Promise<object>} - A promise that resolves to an object containing the new student test result and the new validation task.
 */
async function EnterMarksHelper(task_id, test, student, marks, validate_marks_due_date) {
    try {
        validator.ValidateEnterMarksInput(task_id, test, student, marks, validate_marks_due_date);

        const enterMarksTask = await TaskModel.findOne({ _id: task_id, task_type: 'ENTER_MARKS', task_status: 'PENDING' })
        if (!enterMarksTask) {
            throw new ApolloError('Enter marks task not found', 'NOT_FOUND');
        }

        const studentCheck = await StudentModel.findOne({ _id: student, student_status: 'ACTIVE' })
        if (!studentCheck) {
            throw new ApolloError('Student not found', 'NOT_FOUND');
        }

        const testCheck = await TestModel.findOne({ _id: test });
        if (!testCheck) {
            throw new ApolloError('Test not found', 'NOT_FOUND');
        }

        const notationMap = new Map();
        for (const notation of testCheck.notations) {
            notationMap.set(notation.notation_text, notation.max_points);
        }

        for (const markEntry of marks) {
            const { notation_text, mark } = markEntry;

            if (!notationMap.has(notation_text)) {
                throw new ApolloError(`Invalid notation_text: ${notation_text}`, 'INVALID_NOTATION');
            }

            const maxPoints = notationMap.get(notation_text);
            if (mark < 0 || mark > maxPoints) {
                throw new ApolloError(
                    `Mark for '${notation_text}' must be between 0 and ${maxPoints}`,
                    'INVALID_MARK_VALUE'
                );
            }
        }

        // *************** Count average mark
        let totalMarks = 0;

        for (const item of marks) {
            totalMarks += item.mark
        }

        const averageMark = totalMarks / marks.length;

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const completedByUserId = '6846e5769e5502fce150eb67';

        const studentTestResultData = {
            student: student._id,
            test: test._id,
            marks: marks,
            average_mark: averageMark,
            mark_entry_date: Date.now(),
            student_test_result_status: 'PENDING',
            created_by: completedByUserId,
            updated_by: completedByUserId
        }

        const newStudentTestResult = await StudentTestResultModel.create(studentTestResultData);
        if (!newStudentTestResult) {
            throw new ApolloError('Student test result creation failed', 'STUDENT_TEST_RESULT_CREATION_FAILED');
        }

        const enterMarksTaskData = {
            task_status: 'COMPLETED',
            completed_by: completedByUserId,
            completed_at: Date.now(),
            updated_by: completedByUserId
        }

        const completeEnterMarksTask = await TaskModel.updateOne({ _id: enterMarksTask._id, task_type: 'ENTER_MARKS', task_status: 'PENDING' }, enterMarksTaskData);
        if (!completeEnterMarksTask) {
            throw new ApolloError('Enter marks task completion failed', 'TASK_COMPLETION_FAILED');
        }

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const academicDirectorId = '6846e5769e5502fce150eb67';

        const validateMarksTaskData = {
            test: test,
            user: academicDirectorId,
            title: 'Validate Marks',
            description: 'Academic Director should validate mark entry for student test',
            task_type: 'VALIDATE_MARKS',
            task_status: 'PENDING',
            due_date: validate_marks_due_date,
            created_by: completedByUserId,
            updated_by: completedByUserId
        }

        const validateMarksTask = await TaskModel.create(validateMarksTaskData);
        if (!validateMarksTask) {
            throw new ApolloError('Validate marks task creation failed', 'TASK_CREATION_FAILED');
        }

        const updatedTest = await TestModel.updateOne(
            { _id: testCheck._id },
            { $push: { tasks: validateMarksTask._id } }
        );

        if (updatedTest.modifiedCount === 0) {
            throw new ApolloError('Failed to add enter marks task to test', 'TEST_UPDATE_FAILED');
        }

        return {
            student_test_result: newStudentTestResult,
            validate_marks_task: validateMarksTask
        }
    } catch (error) {
        throw new ApolloError('Failed to enter marks', 'TASK_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Validates a student's test result, updating its status and completing the associated task.
 * @param {string} task_id - The ID of the 'VALIDATE_MARKS' task.
 * @param {string} student_test_result_id - The ID of the student test result to validate.
 * @returns {Promise<void>} - This function does not return a value but performs database operations.
 */
async function ValidateMarksHelper(task_id, student_test_result_id) {
    try {
        validator.ValidateValidateMarksInput(task_id, student_test_result_id);

        const validateMarksTask = await TaskModel.findOne({ _id: task_id, task_type: 'VALIDATE_MARKS', task_status: 'PENDING' });
        if (!validateMarksTask) {
            throw new ApolloError('Validate marks task not found', 'NOT_FOUND');
        }

        const studentTestResultCheck = await StudentTestResultModel.findOne({ _id: student_test_result_id, student_test_result_status: 'PENDING' });
        if (!studentTestResultCheck) {
            throw new ApolloError('Student test result not found', 'NOT_FOUND');
        }

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const completedByUserId = '6846e5769e5502fce150eb67';

        const studentTestResultData = {
            student_test_result_status: 'VALIDATED',
            updated_by: completedByUserId
        }

        const validatedStudentTestResult = await StudentTestResultModel.findOneAndUpdate({ _id: student_test_result_id, student_test_result_status: 'PENDING' }, studentTestResultData);
        if (!validatedStudentTestResult) {
            throw new ApolloError('Student test result validation failed', 'STUDENT_TEST_RESULT_VALIDATION_FAILED');
        }

        const validateMarksTaskData = {
            task_status: 'COMPLETED',
            completed_by: completedByUserId,
            completed_at: Date.now(),
            updated_by: completedByUserId
        }

        const completeValidateMarksTask = await TaskModel.findOneAndUpdate({ _id: task_id, task_type: 'VALIDATE_MARKS', task_status: 'PENDING' }, validateMarksTaskData);
        if (!completeValidateMarksTask) {
            throw new ApolloError('Validate marks task completion failed', 'TASK_COMPLETION_FAILED');
        }

        return {
            student_test_result: validatedStudentTestResult,
            validate_marks_task: completeValidateMarksTask
        }
    } catch (error) {
        throw new ApolloError('Failed to validate marks', 'TASK_COMPLETION_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetAllTasksHelper,
    GetOneTaskHelper,
    // GetTasksForUserHelper,
    // GetTasksForTestHelper,
    // CreateTaskHelper,
    // UpdateTaskHelper,
    // DeleteTaskHelper,
    AssignCorrectorHelper,
    EnterMarksHelper,
    ValidateMarksHelper
}