// *************** IMPORT MODULE ***************
const UserLoader = require('../modules/user/user.loader');
const StudentLoader = require('../modules/student/student.loader');
const SchoolLoader = require('../modules/school/school.loader');
const BlockLoader = require('../modules/block/block.loader');
const SubjectLoader = require('../modules/subject/subject.loader');
const TestLoader = require('../modules/test/test.loader');
const StudentTestResultLoader = require('../modules/studentTestResult/student_test_result.loader');
const TaskLoader = require('../modules/task/task.loader');

/**
 * Creates and returns an object containing all DataLoader instances.
 * This function centralizes the instantiation of all data loaders, which can then be
 * added to the GraphQL context for each request.
 * @returns {object} An object with initialized DataLoader instances for User, Student, School, Block, Subject, Test, Student Test Result, and Task.
 */
function CreateLoaders() {
  return {
    UserLoader: UserLoader(),
    StudentLoader: StudentLoader(),
    SchoolLoader: SchoolLoader(),
    BlockLoader: BlockLoader(),
    SubjectLoader: SubjectLoader(),
    TestLoader: TestLoader(),
    StudentTestResultLoader: StudentTestResultLoader(),
    TaskLoader: TaskLoader(),
  };
}

// *************** EXPORT MODULE ***************
module.exports = CreateLoaders;
