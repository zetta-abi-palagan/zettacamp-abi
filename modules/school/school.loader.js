// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { keyBy } = require('lodash');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const SchoolModel = require('./school.model');

function SchoolLoader() {
    return new DataLoader(async function (schoolIds) {
        try {
            const schools = await SchoolModel.find({
                _id: { $in: schoolIds },
            });

            const schoolsById = keyBy(schools, function (school) {
                return school._id.toString();
            });

            return schoolIds.map(function (schoolId) {
                return schoolsById[schoolId.toString()]
            });
        } catch (error) {
            console.error('Error batch fetching schools:', error);
            throw new ApolloError(`Failed to batch fetch schools: ${error.message}`, 'USER_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = SchoolLoader;