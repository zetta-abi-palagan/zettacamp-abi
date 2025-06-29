// *************** IMPORT MODULE ***************
const ValidateObjectId = require('./mongoose_object_id');
const ValidateObjectIdArray = require('./mongoose_object_id_array');
const ValidateInputTypeObject = require('./object');

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateObjectId,
    ValidateObjectIdArray,
    ValidateInputTypeObject
}