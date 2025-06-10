// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const mongoose = require('mongoose');
const validator = require('validator');

// *************** IMPORT MODULE *************** 
const StudentModel = require('./student.model');
const SchoolModel = require('../school/school.model');

// *************** QUERY ***************
/**
 * Fetches all active students from the database.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of active student objects.
 */
async function GetAllStudents() {
    try {
        return await StudentModel.find({ student_status: 'ACTIVE' });
    } catch (error) {
        throw new ApolloError(`Failed to fetch students: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single active student by their unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the student to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found student object.
 */
async function GetOneStudent(_, { id }) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    try {
        const student = await StudentModel.findOne({ _id: id, student_status: 'ACTIVE' })
        if (!student) {
            throw new ApolloError("User not found", "NOT_FOUND");
        }

        return student;
    } catch (error) {
        throw new ApolloError(`Failed to fetch student: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

// *************** MUTATION ***************
/**
 * Creates a new student with the provided input data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {object} args.input - The data for the new student.
 * @returns {Promise<object>} - A promise that resolves to the newly created student object.
 */
async function CreateStudent(_, { input }) {
    const {
        first_name,
        last_name,
        email,
        date_of_birth,
        profile_picture,
        student_status,
        school
    } = input;

    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!first_name || validator.isEmpty(first_name, { ignore_whitespace: true })) {
        throw new ApolloError('First name is required.', 'BAD_USER_INPUT', {
            field: 'first_name'
        });
    }

    if (!last_name || validator.isEmpty(last_name, { ignore_whitespace: true })) {
        throw new ApolloError('Last name is required.', 'BAD_USER_INPUT', {
            field: 'last_name'
        });
    }

    if (!email || !validator.isEmail(email)) {
        throw new ApolloError('A valid email address is required.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    const studentExisted = await StudentModel.findOne({ email: email });
    if (studentExisted) {
        throw new ApolloError('The email address is already used.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    if (!(date_of_birth instanceof Date ? !isNaN(date_of_birth.getTime()) : !isNaN(new Date(date_of_birth).getTime()))) {
        throw new ApolloError('A valid date of birth format is required.', 'BAD_USER_INPUT', {
            field: 'date_of_birth'
        });
    }

    if (profile_picture && !validator.isURL(profile_picture)) {
        throw new ApolloError('Profile picture must be a valid URL.', 'BAD_USER_INPUT', {
            field: 'profile_picture'
        });
    }

    if (!student_status || !validator.isIn(student_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`Student status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'student_status'
        });
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(school);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${school}`, "BAD_USER_INPUT");
    }

    const schoolCheck = await SchoolModel.findOne({ _id: school, school_status: 'ACTIVE' });
    if (!schoolCheck) {
        throw new ApolloError('School not found', 'NOT_FOUND', {
            field: 'school'
        });
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const createdByUserId = '6846e5769e5502fce150eb67';

        const studentData = {
            first_name: first_name,
            last_name: last_name,
            email: email,
            // *************** Using dummy password for now
            password: 'password123',
            date_of_birth: date_of_birth,
            profile_picture: profile_picture,
            student_status: student_status.toUpperCase(),
            created_by: createdByUserId,
            updated_by: createdByUserId,
            school: school
        }

        // *************** Create new student data in the MongoDB
        const newStudent = await StudentModel.create(studentData);

        // *************** Add the new student to the associated active school
        await SchoolModel.updateOne({ _id: school, school_status: 'ACTIVE' }, { $addToSet: { students: newStudent._id } });

        return newStudent;
    } catch (error) {
        throw new ApolloError('Failed to create student:', 'STUDENT_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Updates an existing student's information.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the student to update.
 * @param {object} args.input - The new data to update for the student.
 * @returns {Promise<object>} - A promise that resolves to the updated student object.
 */
async function UpdateStudent(_, { id, input }) {
    const {
        first_name,
        last_name,
        email,
        date_of_birth,
        profile_picture,
        student_status,
        school
    } = input;

    const validStatus = ['ACTIVE', 'INACTIVE'];

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    if (!first_name || validator.isEmpty(first_name, { ignore_whitespace: true })) {
        throw new ApolloError('First name is required.', 'BAD_USER_INPUT', {
            field: 'first_name'
        });
    }

    if (!last_name || validator.isEmpty(last_name, { ignore_whitespace: true })) {
        throw new ApolloError('Last name is required.', 'BAD_USER_INPUT', {
            field: 'last_name'
        });
    }

    if (!email || !validator.isEmail(email)) {
        throw new ApolloError('A valid email address is required.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    const studentExisted = await StudentModel.findOne({ email: email });
    if (studentExisted.id ==! id) {
        throw new ApolloError('The email address is already used.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    if (!(date_of_birth instanceof Date ? !isNaN(date_of_birth.getTime()) : !isNaN(new Date(date_of_birth).getTime()))) {
        throw new ApolloError('A valid date of birth format is required.', 'BAD_USER_INPUT', {
            field: 'date_of_birth'
        });
    }

    if (profile_picture && !validator.isURL(profile_picture)) {
        throw new ApolloError('Profile picture must be a valid URL.', 'BAD_USER_INPUT', {
            field: 'profile_picture'
        });
    }

    if (!student_status || !validator.isIn(student_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`Student status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'student_status'
        });
    }

    const isValidSchoolId = mongoose.Types.ObjectId.isValid(school);
    if (!isValidSchoolId) {
        throw new ApolloError(`Invalid ID: ${school}`, "BAD_USER_INPUT");
    }

    const schoolCheck = await SchoolModel.findOne({ _id: school, school_status: 'ACTIVE' });
    if (!schoolCheck) {
        throw new ApolloError('School not found', 'NOT_FOUND', {
            field: 'school'
        });
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        // *************** Check if student data is already in database
        const existingStudent = await StudentModel.findOne({ _id: id, student_status: 'ACTIVE' });
        if (!existingStudent) {
            throw new ApolloError('Student not found', 'NOT_FOUND', {
                field: 'student'
            });
        }

        // *************** Determine if school has changed
        const hasSchoolChanged = String(existingStudent.school) !== school;

        // *************** If student change school, remove student data from old school
        if (hasSchoolChanged) {
            await SchoolModel.updateOne(
                { _id: existingStudent.school },
                { $pull: { students: id } }
            );
        }

        const studentData = {
            first_name: first_name,
            last_name: last_name,
            email: email,
            date_of_birth: date_of_birth,
            profile_picture: profile_picture,
            student_status: student_status.toUpperCase(),
            updated_by: updatedByUserId,
            school: school
        }

        // *************** Update the student data
        const updatedStudent = await StudentModel.findOneAndUpdate({ _id: id, student_status: 'ACTIVE' }, studentData, { new: true });

        // *************** If student change school, add student data to new school
        if (hasSchoolChanged) {
            await SchoolModel.updateOne({ _id: school, school_status: 'ACTIVE' }, { $addToSet: { students: updatedStudent._id } });
        }

        return updatedStudent;
    } catch (error) {
        throw new ApolloError('Failed to update student:', 'STUDENT_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Deletes a student by changing their status to 'DELETED'.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the student to delete.
 * @returns {Promise<object>} - A promise that resolves to the student object with a 'DELETED' status.
 */
async function DeleteStudent(_, { id }) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const deletedByUserId = '6846e5769e5502fce150eb67';

        const student = await StudentModel.findById(id);
        if (!student) {
            throw new ApolloError(`Student not found with ID: ${id}`, "NOT_FOUND");
        }

        const studentData = {
            student_status: 'DELETED',
            deleted_by: deletedByUserId,
            deleted_at: Date.now()
        }
        const deletedStudent = await StudentModel.findOneAndUpdate({ _id: id }, studentData)

        if (student.school) {
            await SchoolModel.updateOne({ _id: student.school }, { $pull: { students: id } });
        }

        return deletedStudent;
    } catch (error) {
        throw new ApolloError('Failed to delete student:', 'STUDENT_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************
/**
 * Loads the school associated with a student using a DataLoader.
 * @param {object} parent - The parent student object.
 * @param {string} parent.school - The ID of the school to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the school object.
 */
async function SchoolLoader(parent, _, context) {
    try {
        return await context.dataLoaders.SchoolLoader.load(parent.school);
    } catch (error) {
        throw new ApolloError(`Failed to fetch school: ${error.message}`, 'SCHOOL_FETCH_FAILED');
    }
}

/**
 * Loads the user who created the record using a DataLoader.
 * @param {object} parent - The parent student object.
 * @param {string} parent.created_by - The ID of the user to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(parent, _, context) {
    try {
    return await context.dataLoaders.UserLoader.load(parent.created_by);
  } catch (error) {
    throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
  }
}

/**
 * Loads the user who last updated the record using a DataLoader.
 * @param {object} parent - The parent student object.
 * @param {string} parent.updated_by - The ID of the user to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(parent, _, context) {
    try {
    return await context.dataLoaders.UserLoader.load(parent.updated_by);
  } catch (error) {
    throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllStudents,
        GetOneStudent
    },

    Mutation: {
        CreateStudent,
        UpdateStudent,
        DeleteStudent
    },

    Student: {
        school: SchoolLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader
    }
}