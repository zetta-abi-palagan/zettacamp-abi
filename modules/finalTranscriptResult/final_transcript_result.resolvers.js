// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const FinalTranscriptResultModel = require('./final_transcript_result.model');

// *************** IMPORT VALIDATOR ***************
const FinalTranscriptResultValidator = require('./final_transcript_result.validator');
const CommonValidator = require('../../shared/validator/index');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch the final transcript result for a single student.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.studentId - The unique identifier of the student.
 * @returns {Promise<object>} - A promise that resolves to the found final transcript result object.
 */
async function GetFinalTranscriptResult(_, { studentId }) {
  try {
    CommonValidator.ValidateObjectId(studentId);

    const finalTranscriptResult = await FinalTranscriptResultModel.findOne({ student: studentId });
    if (!finalTranscriptResult) {
      throw new ApolloError('Final transcript result not found', 'NOT_FOUND');
    }

    return finalTranscriptResult;
  } catch (error) {
    console.error('Unexpected error in GetFinalTranscriptResult:', error);

    throw new ApolloError('Failed to retrieve final transcript result', 'GET_FINAL_TRANSCRIPT_RESULT_FAILED', {
      error: error.message,
    });
  }
}

// *************** LOADER ***************
/**
 * Loads the student associated with a final transcript result using a DataLoader.
 * @param {object} finalTranscriptResult - The parent final transcript result object.
 * @param {string} finalTranscriptResult.student - The ID of the student to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the student object.
 */
async function StudentLoader(finalTranscriptResult, _, context) {
  try {
    FinalTranscriptResultValidator.ValidateStudentLoaderInput(finalTranscriptResult, context);

    const student = await context.dataLoaders.StudentLoader.load(finalTranscriptResult.student);

    return student;
  } catch (error) {
    throw new ApolloError(`Failed to fetch student`, 'STUDENT_FETCH_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Loads the user who created the final transcript result using a DataLoader.
 * @param {object} finalTranscriptResult - The parent final transcript result object.
 * @param {string} finalTranscriptResult.created_by - The ID of the user who created the record.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(finalTranscriptResult, _, context) {
  try {
    FinalTranscriptResultValidator.ValidateUserLoaderInput(finalTranscriptResult, context, 'created_by');

    const createdBy = await context.dataLoaders.UserLoader.load(finalTranscriptResult.created_by);

    return createdBy;
  } catch (error) {
    throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Loads the user who last updated the final transcript result using a DataLoader.
 * @param {object} finalTranscriptResult - The parent final transcript result object.
 * @param {string} finalTranscriptResult.updated_by - The ID of the user who last updated the record.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(finalTranscriptResult, _, context) {
  try {
    FinalTranscriptResultValidator.ValidateUserLoaderInput(finalTranscriptResult, context, 'updated_by');

    const updatedBy = await context.dataLoaders.UserLoader.load(finalTranscriptResult.updated_by);

    return updatedBy;
  } catch (error) {
    throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Loads the block associated with a block result using a DataLoader.
 * @param {object} parent - The parent object.
 * @param {string} parent.block - The ID of the block to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the block object.
 */
async function BlockLoader(parent, _, context) {
  try {
    FinalTranscriptResultValidator.ValidateBlockLoaderInput(parent, context);

    const block = await context.dataLoaders.BlockLoader.load(parent.block);

    return block;
  } catch (error) {
    throw new ApolloError(`Failed to fetch block`, 'BLOCK_FETCH_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Loads the parent subject for a subject result using a DataLoader.
 * @param {object} parent - The parent parent object.
 * @param {string} parent.subject - The ID of the subject to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the subject object.
 */
async function SubjectLoader(parent, _, context) {
  try {
    FinalTranscriptResultValidator.ValidateSubjectLoaderInput(parent, context);

    const subject = await context.dataLoaders.SubjectLoader.load(parent.subject);

    return subject;
  } catch (error) {
    throw new ApolloError(`Failed to fetch subject`, 'SUBJECT_FETCH_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Loads the test associated with a test result using a DataLoader.
 * @param {object} parent - The parent object.
 * @param {string} parent.test - The ID of the test to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the test object.
 */
async function TestLoader(parent, _, context) {
  try {
    FinalTranscriptResultValidator.ValidateTestLoaderInput(parent, context);

    const test = await context.dataLoaders.TestLoader.load(parent.test);

    return test;
  } catch (error) {
    throw new ApolloError(`Failed to fetch test`, 'TEST_FETCH_FAILED', {
      error: error.message,
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetFinalTranscriptResult,
  },

  FinalTranscriptResult: {
    student: StudentLoader,
    created_by: CreatedByLoader,
    updated_by: UpdatedByLoader,
  },

  BlockResult: {
    block: BlockLoader,
  },

  SubjectResult: {
    subject: SubjectLoader,
  },

  TestResult: {
    test: TestLoader,
  },
};
