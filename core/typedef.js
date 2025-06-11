// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');

// *************** IMPORT MODULE *************** 
const userTypeDefs = require('../modules/user/user.typedef');
const studentTypeDefs = require('../modules/student/student.typedef');
const schoolTypeDefs = require('../modules/school/school.typedef');

// *************** EXPORT MODULE *************** 
module.exports = mergeTypeDefs([userTypeDefs, studentTypeDefs, schoolTypeDefs]);