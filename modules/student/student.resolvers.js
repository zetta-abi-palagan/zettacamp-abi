// *************** IMPORT CORE ***************
const studentModel = require('./student.model');
const schoolModel = require('../school/school.model');

const studentResolvers = {
    Query: {
        /**
         * Fetches a list of all active students.
         * @returns {Promise<Array<Object>>} A promise that resolves to an array of student objects.
         * @throws {Error} If fetching students fails.
         */
        GetAllStudents: async () => {
            try {
                return await studentModel.findActive();
            } catch (error) {
                throw new Error(`Failed to fetch students: ${error.message}`);
            }
        },

        /**
         * Fetches a single student by their ID.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {string} args.id - The ID of the student to fetch.
         * @returns {Promise<Object>} A promise that resolves to the student object.
         * @throws {Error} If the student is not found or fetching fails.
         */
        GetOneStudent: async (_, { id }) => {
            try {
                const student = await studentModel.findById(id);
                if (!student || student.deleted_at) {
                    throw new Error('Student not found');
                }
                return student;
            } catch (error) {
                throw new Error(`Failed to fetch student: ${error.message}`);
            }
        },
    },

    Mutation: {
        /**
         * Creates a new student.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {Object} args.input - The input object for creating a student.
         * @param {string} args.input.school_id - The ID of the school the student belongs to.
         * @returns {Promise<Object>} A promise that resolves to the newly created student object.
         * @throws {Error} If the associated school is not found, email already exists, or student creation fails.
         */
        CreateStudent: async (_, { input }) => {
            try {
                const school = await schoolModel.findById(input.school_id);
                if (!school || school.deleted_at) {
                    throw new Error('School not found');
                }

                const student = new studentModel(input);
                return await student.save();
            } catch (error) {
                if (error.code === 11000) {
                    throw new Error('Email already exists');
                }
                throw new Error(`Failed to create student: ${error.message}`);
            }
        },

        /**
         * Updates an existing student.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {string} args.id - The ID of the student to update.
         * @param {Object} args.input - The input object with fields to update.
         * @param {string} [args.input.school_id] - Optional. The new ID of the school if the student's school is being updated.
         * @returns {Promise<Object>} A promise that resolves to the updated student object.
         * @throws {Error} If the student or associated school is not found, email already exists, or update fails.
         */
        UpdateStudent: async (_, { id, input }) => {
            try {
                const student = await studentModel.findById(id);
                if (!student || student.deleted_at) {
                    throw new Error('Student not found');
                }

                if (input.school_id) {
                    const school = await schoolModel.findById(input.school_id);
                    if (!school || school.deleted_at) {
                        throw new Error('School not found');
                    }
                }

                Object.assign(student, input);
                return await student.save();
            } catch (error) {
                if (error.code === 11000) {
                    throw new Error('Email already exists');
                }
                throw new Error(`Failed to update student: ${error.message}`);
            }
        },

        /**
         * Soft deletes a student by their ID.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {string} args.id - The ID of the student to delete.
         * @returns {Promise<Object>} A promise that resolves to the soft-deleted student object.
         * @throws {Error} If the student is not found or deletion fails.
         */
        DeleteStudent: async (_, { id }) => {
            try {
                const student = await studentModel.findById(id);
                if (!student || student.deleted_at) {
                    throw new Error('Student not found');
                }

                return await student.softDelete();
            } catch (error) {
                throw new Error(`Failed to delete student: ${error.message}`);
            }
        }
    }
};

// *************** EXPORT MODULE ***************
module.exports = studentResolvers;