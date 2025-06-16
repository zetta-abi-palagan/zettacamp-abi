// *************** IMPORT LIBRARY ***************
const { mergeTypeDefs } = require('@graphql-tools/merge');

// *************** IMPORT MODULE *************** 
const userTypeDefs = require('../modules/user/user.typedef');
const studentTypeDefs = require('../modules/student/student.typedef');
const schoolTypeDefs = require('../modules/school/school.typedef');
const blockTypeDefs = require('../modules/block/block.typedef');
const subjectTypeDefs = require('../modules/subject/subject.typedef');

// *************** EXPORT MODULE *************** 
module.exports = mergeTypeDefs([userTypeDefs, studentTypeDefs, schoolTypeDefs, blockTypeDefs, subjectTypeDefs]);