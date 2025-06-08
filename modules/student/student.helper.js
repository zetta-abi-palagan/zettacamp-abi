// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT UTILITIES *************** 
const { SoftDelete } = require('../../shared/utils/database.utils');

// *************** IMPORT VALIDATOR ***************
const { IsValidObjectId } = require('../../shared/validator/object_id');
const { IsEmailValid, IsEmailUnique } = require('../../shared/validator/email');
const { IsValidDate } = require('../../shared/validator/date');

// *************** QUERY ***************
/**
 * Retrieves all non-deleted students.
 * @param {any} _ - The parent object, not used.
 * @param {any} _ - The arguments object, not used.
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<Array<object>>} - An array of student objects.
 * @throws {ApolloError} If fetching students from the database fails.
 */
async function GetAllStudents(_, _, context) {
    try {
        const students = await context.models.Student.find({ deleted_at: null }).populate('school');
        return students;
    } catch (error) {
        throw new ApolloError(`Failed to fetch students: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Retrieves a single student by their ID.
 * @param {any} _ - The parent object, not used.
 * @param {{id: string}} args - An object containing the student's ID.
 * @param {object} context - The GraphQL context containing models.
 * @returns {object} - The requested student object.
 * @throws {Error} If the provided ID is not a valid ObjectId.
 * @throws {Error} If no student is found with the given ID.
 * @throws {Error} If fetching the student from the database fails.
 */
async function GetOneStudent(_, { id }, context) {
    if (!IsValidObjectId(id)) {
        throw new ApolloError(`Invalid ID: ${id}`, 'BAD_USER_INPUT');
    }

    try {
        const student = await context.models.Student.findById({ _id: id, deleted_at: null });
        if (!student || student.deleted_at) {
            throw new ApolloError('Student not found', 'NOT_FOUND');
        }
        console.log(student.date_of_birth);
        return student;
    } catch (error) {
        throw new ApolloError(`Failed to fetch student: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

// *************** MUTATION ***************
/**
 * Retrieves a single student by their ID.
 * @param {any} _ - The parent object, not used.
 * @param {{id: string}} args - An object containing the student's ID.
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<object>} - The requested student object.
 * @throws {ApolloError} If the provided ID is not a valid ObjectId.
 * @throws {ApolloError} If no student is found with the given ID.
 * @throws {ApolloError} If fetching the student from the database fails.
 */
async function CreateStudent(_, { input }, context) {
    const { first_name, last_name, email, date_of_birth, school_id } = input;

    if (!IsValidObjectId(school_id)) {
        throw new ApolloError(`Invalid school_id: ${id}`, 'BAD_USER_INPUT');
    }

    if (date_of_birth && !IsValidDate(date_of_birth)) {
        throw new ApolloError('Invalid date of birth format', 'BAD_USER_INPUT');
    }

    if (!IsEmailValid(email)) {
        throw new ApolloError('Invalid email format', 'BAD_USER_INPUT');
    }

    try {
        const isEmailUnique = await IsEmailUnique(email, context.models.Student);
        if (!isEmailUnique) {
            throw new ApolloError(`The email address '${email}' is already taken`, 'BAD_USER_INPUT');
        }

        const school = await context.models.School.findOne({ _id: school_id, deleted_at: null });
        if (!school) {
            throw new ApolloError('School not found', 'NOT_FOUND');
        }

        if (
            first_name === undefined ||
            last_name === undefined ||
            email === undefined ||
            school_id === undefined
        ) {
            throw new ApolloError(
                'The fields first_name, last_name, email, and school_id are required.',
                'BAD_USER_INPUT'
            );
        }

        const student = { first_name, last_name, email, date_of_birth, school_id };
        const newStudent = await context.models.Student.create(student);

        await context.models.School.updateOne({ _id: school_id }, { $push: { students: newStudent._id } });

        return newStudent;
    } catch (error) {
        console.error(`CreateStudent Resolver Error for email ${email}:`, error);
        throw new ApolloError(`Failed to create student: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}


/**
 * Updates an existing student's information.
 * @param {any} _ - The parent object, not used.
 * @param {{id: string, input: object}} args - An object containing the student's ID and the data to update.
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<object>} - The updated student object.
 * @throws {ApolloError} If the provided ID is not a valid ObjectId.
 * @throws {ApolloError} If the date of birth or email format is invalid.
 * @throws {ApolloError} If the email is already taken.
 * @throws {ApolloError} If updating the student fails.
 */
async function UpdateStudent(_, { id, input }, context) {
    const { first_name, last_name, email, date_of_birth, school_id } = input;

    if (!IsValidObjectId(id)) {
        throw new ApolloError(`Invalid ID: ${id}`, 'BAD_USER_INPUT');
    }

    if (date_of_birth && !IsValidDate(date_of_birth)) {
        throw new ApolloError('Invalid date of birth format', 'BAD_USER_INPUT');
    }

    if (email && !IsEmailValid(email)) {
        throw new ApolloError(`Invalid email format: ${email}`, 'BAD_USER_INPUT');
    }

    try {
        if (email) {
            const isEmailUnique = await IsEmailUnique(email, context.models.Student);
            if (!isEmailUnique) {
                throw new ApolloError(`The email address '${email}' is already taken`, 'BAD_USER_INPUT');
            }
        }

        const update = {};
        if (first_name !== undefined) update.first_name = first_name;
        if (last_name !== undefined) update.last_name = last_name;
        if (email !== undefined) update.email = email;
        if (date_of_birth !== undefined) update.date_of_birth = date_of_birth;
        if (school_id !== undefined) update.school_id = school_id;

        return await context.models.Student.findByIdAndUpdate(id, update, { new: true });
    } catch (error) {
        console.error(`UpdateStudent Resolver Error for email ${email}:`, error);
        throw new ApolloError(`Failed to update student: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}


/**
 * Soft-deletes a student by their ID.
 * @param {any} _ - The parent object, not used.
 * @param {{id: string}} args - An object containing the student's ID.
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<object>} - The soft-deleted student object.
 * @throws {ApolloError} If the provided ID is not a valid ObjectId.
 * @throws {ApolloError} If the student is not found.
 * @throws {ApolloError} If the soft-delete operation fails.
 */
async function DeleteStudent(_, { id }, context) {
    if (!IsValidObjectId(id)) {
        throw new ApolloError(`Invalid ID: ${id}`, 'BAD_USER_INPUT');
    }

    try {
        const student = await context.models.Student.findById(id);
        if (!student || student.deleted_at) {
            throw new ApolloError('User not found', 'NOT_FOUND');
        }

        return await SoftDelete(student);
    } catch (error) {
        throw new ApolloError(`Failed to delete student: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

module.exports = {
    GetAllStudents,
    GetOneStudent,
    CreateStudent,
    UpdateStudent,
    DeleteStudent  
};