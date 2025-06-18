// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const sgMail = require('@sendgrid/mail');

// *************** IMPORT MODULE *************** 
const TaskModel = require('./task.model');
const UserModel = require('../user/user.model');
const StudentModel = require('../student/student.model');
const { SENDGRID_API_KEY, SENDGRID_SENDER_EMAIL } = require('../../core/config');

// *************** IMPORT VALIDATOR ***************
const validator = require('./task.validator');

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
            throw new ApolloError('Test not found', 'NOT_FOUND', {
                field: 'test'
            });
        }

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const completedByUserId = '6846e5769e5502fce150eb67';

        const assignCorrectorTaskData = {
            task_status: 'COMPLETED',
            completed_by: completedByUserId,
            completed_at: Date.now()
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
            due_date: assign_corrector_due_date,
            created_by: completedByUserId,
            updated_by: completedByUserId
        }

        const enterMarksTask = await TaskModel.create(enterMarksTaskData);
        if (!enterMarksTask) {
            throw new ApolloError('Enter marks task creation failed', 'TASK_CREATION_FAILED');
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

// *************** EXPORT MODULE ***************
module.exports = {
    GetAllTasksHelper,
    GetTasksForUserHelper,
    GetTasksForTestHelper,
    CreateTaskHelper,
    UpdateTaskHelper,
    DeleteTaskHelper,
    AssignCorrectorHelper,
    EnterMarksHelper,
    ValidateMarksHelper
}