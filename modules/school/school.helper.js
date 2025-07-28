// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model');

// *************** IMPORT UTILITES ***************
const CommonHelper = require('../../shared/helper/index');

// *************** IMPORT VALIDATOR ***************
const SchoolValidator = require('./school.validator');
const CommonValidator = require('../../shared/validator/index');

/**
 * Processes and transforms raw school input into a structured data payload for a create operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.createSchoolInput - The raw input object containing the new school's properties.
 * @param {string} args.userId - The ID of the user creating the school.
 * @returns {object} A processed data payload suitable for a database create operation.
 */
function GetCreateSchoolPayload({ createSchoolInput, userId }) {
  CommonValidator.ValidateInputTypeObject(createSchoolInput);
  CommonValidator.ValidateObjectId(userId);
  SchoolValidator.ValidateSchoolInput({ schoolInput: createSchoolInput });

  const { commercial_name, legal_name, address, city, country, zipcode, logo, school_status } = createSchoolInput;

  return {
    commercial_name,
    legal_name,
    address,
    city,
    country,
    zipcode,
    logo,
    school_status: school_status.toUpperCase(),
    created_by: userId,
    updated_by: userId,
  };
}

/**
 * Processes and transforms raw school input into a structured data payload for a partial update operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.updateSchoolInput - The raw input object containing the school's properties to update.
 * @param {string} args.userId - The ID of the user updating the school.
 * @returns {object} A processed data payload suitable for a partial database update operation.
 */
function GetUpdateSchoolPayload({ updateSchoolInput, userId }) {
  CommonValidator.ValidateInputTypeObject(updateSchoolInput);
  CommonValidator.ValidateObjectId(userId);
  SchoolValidator.ValidateSchoolInput({ schoolInput: updateSchoolInput, isUpdate: true });

  const { commercial_name, legal_name, address, city, country, zipcode, logo, school_status } = updateSchoolInput;

  const payload = {};

  if (commercial_name !== undefined && commercial_name !== null) payload.commercial_name = commercial_name;
  if (legal_name !== undefined && legal_name !== null) payload.legal_name = legal_name;
  if (address !== undefined && address !== null) payload.address = address;
  if (city !== undefined && city !== null) payload.city = city;
  if (country !== undefined && country !== null) payload.country = country;
  if (zipcode !== undefined && zipcode !== null) payload.zipcode = zipcode;
  if (logo !== undefined && logo !== null) payload.logo = logo;
  if (school_status !== undefined && school_status !== null) payload.school_status = school_status.toUpperCase();

  payload.updated_by = userId;

  return payload;
}

/**
 * Generates a payload for a cascading soft delete of a school and its associated students.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.schoolId - The unique identifier of the school to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for the delete operations.
 */
async function GetDeleteSchoolPayload({ schoolId, userId }) {
  try {
    CommonValidator.ValidateObjectId(schoolId);
    CommonValidator.ValidateObjectId(userId);

    const deletionTimestamp = Date.now();

    const school = await SchoolModel.findOne({ _id: schoolId, school_status: { $ne: 'DELETED' } });
    if (!school) {
      throw new ApolloError('School not found', 'SCHOOL_NOT_FOUND');
    }

    studentIds = school.students || [];

    const deleteSchoolPayload = {
      school: CommonHelper.BuildDeletePayload({
        ids: [schoolId],
        statusKey: 'school_status',
        timestamp: deletionTimestamp,
        userId: userId,
      }),
      students: null,
    };

    if (studentIds.length) {
      deleteSchoolPayload.students = HandleDeleteStudent({
        studentIds,
        userId,
        timestamp: deletionTimestamp,
      });
    }

    return deleteSchoolPayload;
  } catch (error) {
    throw new ApolloError(`Failed in GetDeleteSchoolPayload: ${error.message}`, 'DELETE_SCHOOL_PAYLOAD_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Handles the processing of student IDs for deletion and creates the corresponding payload.
 * @param {object} args - The arguments for handling student deletion.
 * @param {Array<string>} args.studentIds - An array of student IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {object} An object containing the 'filter' and 'update' payload for students.
 */
function HandleDeleteStudent({ studentIds, userId, timestamp }) {
  CommonValidator.ValidateObjectIdArray(studentIds, 'INVALID_STUDENT_ID');

  return CommonHelper.BuildDeletePayload({
    ids: studentIds,
    statusKey: 'student_status',
    timestamp,
    userId,
  });
}

// *************** EXPORT MODULE ***************
module.exports = {
  GetCreateSchoolPayload,
  GetUpdateSchoolPayload,
  GetDeleteSchoolPayload,
};
