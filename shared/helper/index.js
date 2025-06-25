// *************** IMPORT MODULE ***************
const BuildDeletePayload = require('./build_delete_payload');
const HandleDeleteSubjects = require('./handle_delete_subjects');
const HandleDeleteTests = require('./handle_delete_tests');
const HandleDeleteStudentTestResults = require('./handle_delete_student_test_results');
const HandleDeleteTasks = require('./handle_delete_tasks');

// *************** EXPORT MODULE ***************
module.exports = {
    BuildDeletePayload,
    HandleDeleteSubjects,
    HandleDeleteTests,
    HandleDeleteStudentTestResults,
    HandleDeleteTasks
}