// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const bcrypt = require('bcrypt');

// *************** IMPORT MODULE ***************
const config = require('../../core/config');
const StudentModel = require('./student.model');

// *************** IMPORT UTILITES ***************
const CommonHelper = require('../../shared/helper/index');

// *************** IMPORT VALIDATOR ***************
const StudentValidator = require('./student.validator');
const CommonValidator = require('../../shared/validator/index');

/**
 * Processes and transforms raw student input into a structured data payload for a create operation, including password hashing.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.createStudentInput - The raw input object containing the new student's properties.
 * @param {string} args.userId - The ID of the user creating the record.
 * @param {boolean} args.isEmailUnique - A flag indicating if the provided email is unique.
 * @returns {Promise<object>} A promise that resolves to a processed data payload suitable for a database create operation.
 */
async function GetCreateStudentPayload({ createStudentInput, userId, isEmailUnique }) {
  CommonValidator.ValidateInputTypeObject(createStudentInput);
  CommonValidator.ValidateObjectId(userId);
  StudentValidator.ValidateStudentInput({ studentInput: createStudentInput, isEmailUnique });

  const { first_name, last_name, email, password, date_of_birth, profile_picture, student_status, school } = createStudentInput;

  CommonValidator.ValidateObjectId(school);

  const hashedPassword = await bcrypt.hash(password, parseInt(config.BCRYPT_ROUNDS));

  return {
    first_name,
    last_name,
    email,
    password: hashedPassword,
    date_of_birth,
    profile_picture,
    student_status: student_status.toUpperCase(),
    school,
    created_by: userId,
    updated_by: userId,
  };
}

/**
 * Processes and transforms raw student input into a structured data payload for a partial update operation.
 * It only includes fields that are explicitly provided and hashes the password if a new one is supplied.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.updateStudentInput - The raw input object containing the student's properties to update.
 * @param {string} args.userId - The ID of the user performing the update.
 * @param {boolean} args.isEmailUnique - A flag indicating if the provided email is unique.
 * @returns {Promise<object>} A promise that resolves to a processed data payload suitable for a partial database update.
 */
async function GetUpdateStudentPayload({ updateStudentInput, userId, isEmailUnique }) {
  CommonValidator.ValidateInputTypeObject(updateStudentInput);
  CommonValidator.ValidateObjectId(userId);
  StudentValidator.ValidateStudentInput({ studentInput: updateStudentInput, isEmailUnique, isUpdate: true });

  const { first_name, last_name, email, password, date_of_birth, profile_picture, student_status, school } = updateStudentInput;

  const payload = {};

  if (first_name !== undefined && first_name !== null) payload.first_name = first_name;
  if (last_name !== undefined && last_name !== null) payload.last_name = last_name;
  if (email !== undefined && email !== null) payload.email = email;
  if (password !== undefined && password !== null) payload.password = await bcrypt.hash(password, parseInt(config.BCRYPT_ROUNDS));
  if (date_of_birth !== undefined && date_of_birth !== null) payload.date_of_birth = date_of_birth;
  if (profile_picture !== undefined && profile_picture !== null) payload.profile_picture = profile_picture;
  if (student_status !== undefined && student_status !== null) payload.student_status = student_status.toUpperCase();
  if (school !== undefined && school !== null) {
    payload.school = school;
  }

  payload.updated_by = userId;

  return payload;
}

/**
 * Generates a payload for soft-deleting a student and removing their reference from the parent school.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.studentId - The unique identifier of the student to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for the delete and update operations.
 */
async function GetDeleteStudentPayload({ studentId, userId }) {
  try {
    CommonValidator.ValidateObjectId(studentId);
    CommonValidator.ValidateObjectId(userId);

    const deletionTimestamp = Date.now();

    const student = await StudentModel.findOne({ _id: studentId, student_status: { $ne: 'DELETED' } });
    if (!student) {
      throw new ApolloError('Student not found', 'STUDENT_NOT_FOUND');
    }

    const deleteStudentPayload = {
      student: CommonHelper.BuildDeletePayload({
        ids: [studentId],
        statusKey: 'student_status',
        timestamp: deletionTimestamp,
        userId: userId,
      }),
      school: BuildPullStudentFromSchoolPayload({
        schoolId: student.school,
        studentId,
      }),
    };

    return deleteStudentPayload;
  } catch (error) {
    throw new ApolloError(`Failed in GetDeleteStudentPayload: ${error.message}`, 'DELETE_STUDENT_PAYLOAD_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Builds a payload for removing a student's ID from a school's 'students' array.
 * @param {object} args - The arguments for building the payload.
 * @param {string} args.schoolId - The ID of the school to update.
 * @param {string} args.studentId - The ID of the student to remove.
 * @returns {object} An object containing 'filter' and 'update' properties for a MongoDB $pull operation.
 */
function BuildPullStudentFromSchoolPayload({ schoolId, studentId }) {
  return {
    filter: { _id: schoolId },
    update: { $pull: { students: studentId } },
  };
}

// *************** EXPORT MODULE ***************
module.exports = {
  GetCreateStudentPayload,
  GetUpdateStudentPayload,
  GetDeleteStudentPayload,
};
