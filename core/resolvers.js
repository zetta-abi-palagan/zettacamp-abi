// *************** IMPORT LIBRARY ***************
const { mergeResolvers } = require('@graphql-tools/merge');

// *************** IMPORT MODULE *************** 
const userResolvers = require('../modules/user/user.resolvers');
const studentResolvers = require('../modules/student/student.resolvers');
const schoolResolvers = require('../modules/school/school.resolvers');
const blockResolvers = require('../modules/block/block.resolvers');
const subjectResolvers = require('../modules/subject/subject.resolvers');
const testResolvers = require('../modules/test/test.resolvers');
const studentTestResultResolvers = require('../modules/studentTestResult/student_test_result.resolvers');
const taskResolvers = require('../modules/task/task.resolvers');

// *************** EXPORT MODULE ***************
module.exports = mergeResolvers([userResolvers, schoolResolvers, studentResolvers, blockResolvers, subjectResolvers, testResolvers, studentTestResultResolvers, taskResolvers]);