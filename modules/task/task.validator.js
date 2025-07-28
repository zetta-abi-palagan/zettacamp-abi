// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the optional filters for fetching tasks.
 * @param {object} args - The arguments for the filter validation.
 * @param {string} [args.taskStatus] - Optional. The status of the tasks to filter by.
 * @param {string} [args.testId] - Optional. The ID of the test to filter by.
 * @param {string} [args.userId] - Optional. The ID of the user to filter by.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTaskFilter({ taskStatus, testId, userId }) {
  const validStatus = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

  if (!taskStatus) {
    return;
  }

  if (typeof taskStatus !== 'string' || !validStatus.includes(taskStatus.toUpperCase())) {
    throw new ApolloError(`Task status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
      field: 'task_status',
    });
  }

  if (testId && !mongoose.Types.ObjectId.isValid(testId)) {
    throw new ApolloError(`Invalid test ID: ${testId}`, 'BAD_USER_INPUT');
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApolloError(`Invalid user ID: ${userId}`, 'BAD_USER_INPUT');
  }
}

/**
 * Validates the input object for creating or updating a task using a rule-based approach.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.taskInput - An object containing the task's properties to be validated.
 * @param {string} [args.taskInput.test] - The ID of the related test (required on create).
 * @param {string} [args.taskInput.user] - The ID of the assigned user.
 * @param {string} [args.taskInput.title] - The title of the task.
 * @param {string} [args.taskInput.description] - The description of the task.
 * @param {string} [args.taskInput.task_type] - The type of the task.
 * @param {string} [args.taskInput.task_status] - The status of the task (required on update).
 * @param {Date|string} [args.taskInput.due_date] - Optional. The due date for the task.
 * @param {boolean} [args.isUpdate=false] - Optional flag to indicate if this is an update operation, which allows for partial data and different validation rules.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTaskInput({ taskInput, isUpdate = false }) {
  const validTaskType = ['ASSIGN_CORRECTOR', 'ENTER_MARKS', 'VALIDATE_MARKS'];
  const validTaskStatus = ['PENDING', 'IN_PROGRESS'];

  if (isUpdate) {
    const { task_status } = taskInput;
    if (!task_status || typeof task_status == 'string' || !validTaskStatus.includes(task_status.toUpperCase())) {
      throw new ApolloError(`Task status must be one of: ${validTaskStatus.join(', ')}.`, 'BAD_USER_INPUT', { field: 'task_status' });
    }
  }

  const validationRules = [
    {
      field: 'test',
      required: true,
      skipOnUpdate: true,
      validate: (val) => mongoose.Types.ObjectId.isValid(val),
      message: 'A valid test ID is required.',
    },
    {
      field: 'user',
      required: true,
      validate: (val) => mongoose.Types.ObjectId.isValid(val),
      message: 'A valid user ID is required.',
    },
    {
      field: 'title',
      required: true,
      validate: (val) => typeof val === 'string' && val.trim() !== '',
      message: 'Title is required.',
    },
    {
      field: 'description',
      required: true,
      validate: (val) => typeof val === 'string' && val.trim() !== '',
      message: 'Description is required.',
    },
    {
      field: 'task_type',
      required: true,
      validate: (val) => typeof val === 'string' && validTaskType.includes(val.toUpperCase()),
      message: `Task type must be one of: ${validTaskType.join(', ')}.`,
    },
    {
      field: 'due_date',
      required: false,
      validate: (val) => !isNaN(new Date(val).getTime()),
      message: 'A valid date format is required for due_date.',
    },
  ];

  for (const rule of validationRules) {
    if (isUpdate && rule.skipOnUpdate) {
      continue;
    }

    const value = taskInput[rule.field];

    if ((!isUpdate && rule.required) || value !== undefined) {
      if (!rule.validate(value)) {
        throw new ApolloError(rule.message, 'BAD_USER_INPUT', { field: rule.field });
      }
    }
  }
}

/**
 * Validates the inputs for assigning a corrector to a task.
 * @param {object} args - The arguments for the validation.
 * @param {string} args.taskId - The ID of the 'ASSIGN_CORRECTOR' task.
 * @param {string} args.correctorId - The ID of the user being assigned as the corrector.
 * @param {Date|string} [args.enterMarksDueDate] - Optional. The due date for the new 'ENTER_MARKS' task.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateAssignCorrectorInput({ taskId, correctorId, enterMarksDueDate }) {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApolloError('A valid task_id is required.', 'BAD_USER_INPUT');
  }

  if (!correctorId || !mongoose.Types.ObjectId.isValid(correctorId)) {
    throw new ApolloError('A valid corrector_id is required.', 'BAD_USER_INPUT');
  }

  if (enterMarksDueDate && isNaN(new Date(enterMarksDueDate).getTime())) {
    throw new ApolloError('A valid date format is required for enter_marks_due_date.', 'BAD_USER_INPUT');
  }
}

/**
 * Validates the inputs for the 'enter marks' action.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.enterMarksInput - The object containing the test, student, and marks data.
 * @param {string} args.enterMarksInput.test - The ID of the test.
 * @param {string} args.enterMarksInput.student - The ID of the student.
 * @param {Array<object>} args.enterMarksInput.marks - The array of marks to be validated.
 * @param {Array<object>} args.notations - An array of notation objects from the parent test, used to validate the marks.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateEnterMarksInput({ enterMarksInput, notations }) {
  const { test, student, marks } = enterMarksInput;
  if (!test || test.trim() === '' || !mongoose.Types.ObjectId.isValid(test)) {
    throw new ApolloError('Invalid test ID.', 'BAD_USER_INPUT');
  }
  if (!student || student.trim() === '' || !mongoose.Types.ObjectId.isValid(student)) {
    throw new ApolloError('Invalid student ID.', 'BAD_USER_INPUT');
  }

  if (!Array.isArray(marks) || !marks.length) {
    throw new ApolloError('Marks must be a non-empty array.', 'BAD_USER_INPUT', { field: 'marks' });
  }

  const notationMap = new Map();
  for (const notation of notations) {
    notationMap.set(notation.notation_text, notation.max_points);
  }

  for (const [index, markEntry] of marks.entries()) {
    if (!markEntry.notation_text || typeof markEntry.notation_text !== 'string' || markEntry.notation_text.trim() === '') {
      throw new ApolloError(`Mark at index ${index} must have non-empty text.`, 'BAD_USER_INPUT');
    }
    if (typeof markEntry.mark !== 'number' || isNaN(markEntry.mark) || markEntry.mark < 0) {
      throw new ApolloError(`Mark at index ${index} must have a valid mark (number ≥ 0).`, 'BAD_USER_INPUT');
    }
    if (!notationMap.has(markEntry.notation_text)) {
      throw new ApolloError(`Invalid notation_text: '${markEntry.notation_text}' does not exist on this test.`, 'BAD_USER_INPUT');
    }
    const maxPoints = notationMap.get(markEntry.notation_text);
    if (markEntry.mark > maxPoints) {
      throw new ApolloError(
        `Mark for '${markEntry.notation_text}' (${markEntry.mark}) cannot exceed max points (${maxPoints}).`,
        'BAD_USER_INPUT'
      );
    }
  }
}

/**
 * Validates the IDs for the 'validate marks' workflow.
 * @param {object} args - The arguments for the validation.
 * @param {string} args.taskId - The ID of the 'VALIDATE_MARKS' task.
 * @param {string} args.studentTestResultId - The ID of the student test result to validate.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateValidateMarksInput({ taskId, studentTestResultId }) {
  if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApolloError(`Invalid task ID: ${taskId}`, 'BAD_USER_INPUT');
  }
  if (!studentTestResultId || !mongoose.Types.ObjectId.isValid(studentTestResultId)) {
    throw new ApolloError(`Invalid student test result ID: ${studentTestResultId}`, 'BAD_USER_INPUT');
  }
}

/**
 * Validates the inputs for the TestLoader resolver on the Task type.
 * @param {object} task - The parent task object, which must contain a 'test' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured TestLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTestLoaderInput(task, context) {
  if (!task || typeof task !== 'object' || task === null) {
    throw new ApolloError('Input error: task must be a valid object.', 'BAD_USER_INPUT', {
      field: 'task',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(task.test)) {
    throw new ApolloError('Input error: task.test must be a valid ID.', 'BAD_USER_INPUT', {
      field: 'task.test',
    });
  }

  if (!context || !context.dataLoaders || !context.dataLoaders.TestLoader || typeof context.dataLoaders.TestLoader.load !== 'function') {
    throw new ApolloError('Server configuration error: TestLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Validates the inputs for resolvers that use the UserLoader.
 * @param {object} parent - The parent object.
 * @param {object} context - The GraphQL context, which must contain a configured UserLoader.
 * @param {string} fieldName - The name of the property on the block object that holds the user ID (e.g., 'created_by').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUserLoaderInput(parent, context, fieldName) {
  if (!parent || typeof parent !== 'object' || parent === null) {
    throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT');
  }

  if (!context || !context.dataLoaders || !context.dataLoaders.UserLoader || typeof context.dataLoaders.UserLoader.load !== 'function') {
    throw new ApolloError('Server configuration error: UserLoader not found on context.', 'INTERNAL_SERVER_ERROR');
  }

  const userId = parent[fieldName];

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApolloError(`Input error: If provided, parent.${fieldName} must be a valid ID.`, 'BAD_USER_INPUT');
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateTaskFilter,
  ValidateTaskInput,
  ValidateAssignCorrectorInput,
  ValidateEnterMarksInput,
  ValidateValidateMarksInput,
  ValidateTestLoaderInput,
  ValidateUserLoaderInput,
};
