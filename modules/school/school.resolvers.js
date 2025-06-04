// *************** IMPORT CORE ***************
const schoolModel = require('./school.model');

const schoolResolvers = {
  Query: {
    /**
     * Fetches a list of all active schools, populating their associated students.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of school objects, with 'students' field populated.
     * @throws {Error} If fetching schools fails.
     */
    GetAllSchools: async () => {
      try {
        return await schoolModel.findActive().populate('students');
      } catch (error) {
        throw new Error(`Failed to fetch schools: ${error.message}`);
      }
    },

    /**
     * Fetches a single school by its ID, populating its associated students.
     * @param {Object} _ - The root object, not used in this resolver.
     * @param {Object} args - The arguments passed to the resolver.
     * @param {string} args.id - The ID of the school to fetch.
     * @returns {Promise<Object>} A promise that resolves to the school object, with 'students' field populated.
     * @throws {Error} If the school is not found or fetching fails.
     */
    GetOneSchool: async (_, { id }) => {
      try {
        const school = await schoolModel.findById(id).populate('students');
        if (!school || school.deleted_at) {
          throw new Error('School not found');
        }
        return school;
      } catch (error) {
        throw new Error(`Failed to fetch school: ${error.message}`);
      }
    },
  },

  Mutation: {
    /**
     * Creates a new school.
     * @param {Object} _ - The root object, not used in this resolver.
     * @param {Object} args - The arguments passed to the resolver.
     * @param {Object} args.input - The input object for creating a school.
     * @returns {Promise<Object>} A promise that resolves to the newly created school object.
     * @throws {Error} If school creation fails.
     */
    CreateSchool: async (_, { input }) => {
      try {
        const school = new schoolModel(input);
        return await school.save();
      } catch (error) {
        throw new Error(`Failed to create school: ${error.message}`);
      }
    },

    /**
     * Updates an existing school.
     * @param {Object} _ - The root object, not used in this resolver.
     * @param {Object} args - The arguments passed to the resolver.
     * @param {string} args.id - The ID of the school to update.
     * @param {Object} args.input - The input object with fields to update.
     * @returns {Promise<Object>} A promise that resolves to the updated school object.
     * @throws {Error} If the school is not found or update fails.
     */
    UpdateSchool: async (_, { id, input }) => {
      try {
        const school = await schoolModel.findById(id);
        if (!school || school.deleted_at) {
          throw new Error('School not found');
        }

        Object.assign(school, input);
        return await school.save();
      } catch (error) {
        throw new Error(`Failed to update school: ${error.message}`);
      }
    },

    /**
     * Soft deletes a school by its ID.
     * @param {Object} _ - The root object, not used in this resolver.
     * @param {Object} args - The arguments passed to the resolver.
     * @param {string} args.id - The ID of the school to delete.
     * @returns {Promise<Object>} A promise that resolves to the soft-deleted school object.
     * @throws {Error} If the school is not found or deletion fails.
     */
    DeleteSchool: async (_, { id }) => {
      try {
        const school = await schoolModel.findById(id);
        if (!school || school.deleted_at) {
          throw new Error('School not found');
        }

        return await school.softDelete();
      } catch (error) {
        throw new Error(`Failed to delete school: ${error.message}`);
      }
    },
  }
};

// *************** EXPORT MODULE ***************
module.exports = schoolResolvers;