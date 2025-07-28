// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the optional filters for fetching student test results.
 * @param {object} args - The arguments for the filter validation.
 * @param {string} [args.studentTestResult] - Optional. The status of the results to filter by (e.g., 'PENDING').
 * @param {string} [args.testId] - Optional. The ID of the test to filter by.
 * @param {string} [args.studentId] - Optional. The ID of the student to filter by.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateStudentTestResultFilter({ studentTestResult, testId, studentId }) {
  const validStatus = ['PENDING', 'VALIDATED'];

  if (!studentTestResult) {
    return;
  }

  if (typeof studentTestResult !== 'string' || !validStatus.includes(studentTestResult.toUpperCase())) {
    throw new ApolloError(`Student test result status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
      field: 'student_test_result_status',
    });
  }

  if (testId && !mongoose.Types.ObjectId.isValid(testId)) {
    throw new ApolloError(`Invalid test ID: ${testId}`, 'BAD_USER_INPUT');
  }

  if (studentId && !mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApolloError(`Invalid student ID: ${studentId}`, 'BAD_USER_INPUT');
  }
}

/**
 * Validates the marks for a student's test result against the test's defined notations.
 * @param {object} args - The arguments for the validation.
 * @param {Array<object>} args.marks - A non-empty array of mark objects to be validated.
 * @param {Array<object>} args.notations - An array of notation objects from the parent test, used to validate the marks.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUpdateStudentTestResultInput({ marks, notations }) {
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
        `Mark for '${markEntry.notation_text}' (${markEntry.mark}) cannot exceed the max points (${maxPoints}).`,
        'BAD_USER_INPUT'
      );
    }
  }
}

/**
 * Loads the student associated with a test result using a DataLoader.
 * @param {object} studentTestResult - The parent student test result object.
 * @param {string} studentTestResult.student - The ID of the student to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the student object.
 */
function ValidateStudentLoaderInput(studentTestResult, context) {
  if (!studentTestResult || typeof studentTestResult !== 'object' || studentTestResult === null) {
    throw new ApolloError('Input error: studentTestResult must be a valid object.', 'BAD_USER_INPUT', {
      field: 'studentTestResult',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(studentTestResult.student)) {
    throw new ApolloError('Input error: studentTestResult.student must be a valid ID.', 'BAD_USER_INPUT', {
      field: 'studentTestResult.student',
    });
  }

  if (
    !context ||
    !context.dataLoaders ||
    !context.dataLoaders.StudentLoader ||
    typeof context.dataLoaders.StudentLoader.load !== 'function'
  ) {
    throw new ApolloError('Server configuration error: StudentLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Loads the test associated with a student's result using a DataLoader.
 * @param {object} studentTestResult - The parent student test result object.
 * @param {string} studentTestResult.test - The ID of the test to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the test object.
 */
function ValidateTestLoaderInput(studentTestResult, context) {
  if (!studentTestResult || typeof studentTestResult !== 'object' || studentTestResult === null) {
    throw new ApolloError('Input error: studentTestResult must be a valid object.', 'BAD_USER_INPUT', {
      field: 'studentTestResult',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(studentTestResult.test)) {
    throw new ApolloError('Input error: studentTestResult.test must be a valid ID.', 'BAD_USER_INPUT', {
      field: 'studentTestResult.test',
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
  ValidateStudentTestResultFilter,
  ValidateUpdateStudentTestResultInput,
  ValidateStudentLoaderInput,
  ValidateTestLoaderInput,
  ValidateUserLoaderInput,
};
