// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model');

/**
 * Creates a new DataLoader for batch-loading school data.
 * This function is used to solve the N+1 problem by collecting individual school ID requests
 * and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching schools by ID.
 */
function SchoolLoader() {
  return new DataLoader(async (schoolIds) => {
    try {
      const schools = await SchoolModel.find({
        _id: { $in: schoolIds },
      });

      const schoolsById = new Map(schools.map((school) => [String(school._id), school]));

      return schoolIds.map((schoolId) => schoolsById.get(String(schoolId)));
    } catch (error) {
      console.error('Error batch fetching schools:', error);
      throw new ApolloError(`Failed to batch fetch schools: ${error.message}`, 'USER_BATCH_FETCH_FAILED');
    }
  });
}

// *************** EXPORT MODULE ***************
module.exports = SchoolLoader;
