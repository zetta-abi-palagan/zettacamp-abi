// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model');
const SchoolModel = require('../school/school.model');

// *************** IMPORT HELPER FUNCTION ***************
const StudentHelper = require('./student.helper');

// *************** IMPORT VALIDATOR ***************
const StudentValidator = require('./student.validator');
const CommonValidator = require('../../shared/validator/index');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch a paginated, sorted, and filtered list of students using an aggregation pipeline.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {object} [args.filter] - Optional. An object containing fields to filter the student list, including nested filters for related documents.
 * @param {object} [args.sort] - Optional. An object specifying the sorting field and order ('ASC' or 'DESC').
 * @param {number} [args.page=1] - Optional. The page number for pagination.
 * @param {number} [args.limit=10] - Optional. The number of students per page.
 * @returns {Promise<object>} - A promise that resolves to an object containing the paginated 'data' and the total 'countDocuments'.
 */
async function GetAllStudents(_, { filter, sort, page = 1, limit = 10 }) {
  try {
    StudentValidator.ValidateGetAllStudentsInput({ filter, sort, page, limit });

    const pipeline = [];
    const matchStage = {};

    if ((filter && filter.school) || (sort && sort.field.startsWith('school.'))) {
      pipeline.push({
        $lookup: {
          from: 'schools',
          localField: 'school',
          foreignField: '_id',
          as: 'schoolInfo',
        },
      });
      pipeline.push({ $unwind: { path: '$schoolInfo', preserveNullAndEmptyArrays: true } });
    }

    if ((filter && filter.created_by) || (sort && sort.field.startsWith('created_by.'))) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'created_by',
          foreignField: '_id',
          as: 'creatorInfo',
        },
      });
      pipeline.push({ $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true } });
    }

    if ((filter && filter.updated_by) || (sort && sort.field.startsWith('updated_by.'))) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'updated_by',
          foreignField: '_id',
          as: 'updaterInfo',
        },
      });
      pipeline.push({ $unwind: { path: '$updaterInfo', preserveNullAndEmptyArrays: true } });
    }

    if (filter) {
      if (filter.first_name) matchStage.first_name = { $regex: filter.first_name, $options: 'i' };
      if (filter.last_name) matchStage.last_name = { $regex: filter.last_name, $options: 'i' };
      if (filter.email) matchStage.email = { $regex: filter.email, $options: 'i' };
      if (filter.student_status) matchStage.student_status = filter.student_status;

      if (filter.school) {
        if (filter.school.commercial_name)
          matchStage['schoolInfo.commercial_name'] = { $regex: filter.school.commercial_name, $options: 'i' };
        if (filter.school.legal_name) matchStage['schoolInfo.legal_name'] = { $regex: filter.school.legal_name, $options: 'i' };
        if (filter.school.city) matchStage['schoolInfo.city'] = { $regex: filter.school.city, $options: 'i' };
        if (filter.school.country) matchStage['schoolInfo.country'] = { $regex: filter.school.country, $options: 'i' };
        if (filter.school.school_status) matchStage['schoolInfo.school_status'] = filter.school.school_status;
      }
      if (filter.created_by) {
        if (filter.created_by.first_name) matchStage['creatorInfo.first_name'] = { $regex: filter.created_by.first_name, $options: 'i' };
        if (filter.created_by.last_name) matchStage['creatorInfo.last_name'] = { $regex: filter.created_by.last_name, $options: 'i' };
      }
      if (filter.updated_by) {
        if (filter.updated_by.first_name) matchStage['updaterInfo.first_name'] = { $regex: filter.updated_by.first_name, $options: 'i' };
        if (filter.updated_by.last_name) matchStage['updaterInfo.last_name'] = { $regex: filter.updated_by.last_name, $options: 'i' };
      }
    }

    if (!filter || !filter.student_status) {
      matchStage.student_status = { $ne: 'DELETED' };
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    const sortStage = {};
    if (sort && sort.field && sort.order) {
      const sortOrder = sort.order === 'DESC' ? -1 : 1;
      if (sort.field.startsWith('school.')) {
        sortStage[`schoolInfo.${sort.field.split('.')[1]}`] = sortOrder;
      } else if (sort.field.startsWith('created_by.')) {
        sortStage[`creatorInfo.${sort.field.split('.')[1]}`] = sortOrder;
      } else if (sort.field.startsWith('updated_by.')) {
        sortStage[`updaterInfo.${sort.field.split('.')[1]}`] = sortOrder;
      } else {
        sortStage[sort.field] = sortOrder;
      }
    } else {
      sortStage.created_at = -1;
    }
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        countDocuments: [{ $count: 'count' }],
      },
    });

    const results = await StudentModel.aggregate(pipeline);
    return {
      data: results[0].data,
      countDocuments: results[0].countDocuments.length > 0 ? results[0].countDocuments[0].count : 0,
    };
  } catch (error) {
    console.error('Unexpected error in GetAllStudents:', error);

    throw new ApolloError(`Failed to fetch students: ${error.message}`, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * GraphQL resolver to fetch a single student by their unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the student to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found student object.
 */
async function GetOneStudent(_, { id }) {
  try {
    CommonValidator.ValidateObjectId(id);

    const student = await StudentModel.findById(id).lean();
    if (!student) {
      throw new ApolloError('Student not found', 'NOT_FOUND');
    }

    return student;
  } catch (error) {
    console.error('Unexpected error in GetOneStudent:', error);

    throw new ApolloError(`Failed to fetch student: ${error.message}`, 'INTERNAL_SERVER_ERROR');
  }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new student and associate them with a school.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.createStudentInput - An object containing the details for the new student.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the newly created student object.
 */
async function CreateStudent(_, { createStudentInput }, context) {
  try {
    const userId = context && context.user && context.user._id;
    if (!userId) {
      throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
    }

    CommonValidator.ValidateInputTypeObject(createStudentInput);

    const emailExist = await StudentModel.exists({ email: createStudentInput.email });

    StudentValidator.ValidateStudentInput({ studentInput: createStudentInput, isEmailUnique: !emailExist });

    const createStudentPayload = await StudentHelper.GetCreateStudentPayload({ createStudentInput, userId, isEmailUnique: !emailExist });

    const newStudent = await StudentModel.create(createStudentPayload);
    if (!newStudent) {
      throw new ApolloError('Failed to create student', 'STUDENT_CREATION_FAILED');
    }

    const updatedSchool = await SchoolModel.updateOne({ _id: createStudentInput.school }, { $addToSet: { students: newStudent._id } });
    if (!updatedSchool.nModified) {
      throw new ApolloError('Failed to update school with new student', 'SCHOOL_UPDATE_FAILED');
    }

    return newStudent;
  } catch (error) {
    console.error('Unexpected error in CreateStudent:', error);

    throw new ApolloError('Failed to create student', 'STUDENT_CREATION_FAILED', {
      error: error.message,
    });
  }
}

/**
 * GraphQL resolver to update an existing student's details, with logic to handle school changes.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the student to update.
 * @param {object} args.updateStudentInput - An object containing the fields to be updated.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the updated student object.
 */
async function UpdateStudent(_, { id, updateStudentInput }, context) {
  try {
    const userId = context && context.user && context.user._id;
    if (!userId) {
      throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
    }

    CommonValidator.ValidateObjectId(id);
    CommonValidator.ValidateInputTypeObject(updateStudentInput);

    let isEmailUnique = true;
    if (updateStudentInput.email) {
      const emailExists = await StudentModel.exists({ email: updateStudentInput.email, _id: { $ne: id } });
      isEmailUnique = !emailExists;
    }

    StudentValidator.ValidateStudentInput({ studentInput: updateStudentInput, isEmailUnique, isUpdate: true });

    const student = await StudentModel.findOne({ _id: id, student_status: { $ne: 'DELETED' } })
      .select({ school: 1 })
      .lean();
    if (!student) {
      throw new ApolloError('Student not found', 'NOT_FOUND');
    }

    const updateStudentPayload = await StudentHelper.GetUpdateStudentPayload({ updateStudentInput, userId, isEmailUnique });

    const updatedStudent = await StudentModel.findOneAndUpdate({ _id: id }, { $set: updateStudentPayload }, { new: true });

    if (!updatedStudent) {
      throw new ApolloError('Student not found or update failed', 'STUDENT_UPDATE_FAILED');
    }

    const hasSchoolChanged = String(existingStudent.school) !== updateStudentInput.school;
    if (hasSchoolChanged) {
      const oldSchoolUpdate = await SchoolModel.updateOne({ _id: existingStudent.school }, { $pull: { students: id } });
      if (!oldSchoolUpdate.nModified) {
        throw new ApolloError('Failed to remove student from old school', 'SCHOOL_UPDATE_FAILED');
      }

      const newSchoolUpdate = await SchoolModel.updateOne({ _id: updateStudentInput.school }, { $addToSet: { students: id } });
      if (!newSchoolUpdate.nModified) {
        throw new ApolloError('Failed to add student to new school', 'SCHOOL_UPDATE_FAILED');
      }
    }

    return updatedStudent;
  } catch (error) {
    console.error('Unexpected error in UpdateStudent:', error);

    throw new ApolloError('Failed to update student:', 'STUDENT_UPDATE_FAILED', {
      error: error.message,
    });
  }
}

/**
 * GraphQL resolver to soft-delete a student and remove their reference from the parent school.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the student to delete.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the student object as it was before being soft-deleted.
 */
async function DeleteStudent(_, { id }, context) {
  try {
    const userId = context && context.user && context.user._id;
    if (!userId) {
      throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
    }

    CommonValidator.ValidateObjectId(id);

    const { student, school } = await StudentHelper.GetDeleteStudentPayload({ studentId: id, userId });

    const deletedStudent = await StudentModel.findOneAndUpdate(student.filter, student.update);
    if (!deletedStudent) {
      throw new ApolloError('Student deletion failed', 'STUDENT_DELETION_FAILED');
    }

    const updatedSchool = await SchoolModel.updateOne(school.filter, school.update);
    if (!updatedSchool.nModified) {
      throw new ApolloError('Failed to update school (remove student)', 'SCHOOL_UPDATE_FAILED');
    }

    return deletedStudent;
  } catch (error) {
    console.error('Unexpected error in DeleteStudent:', error);

    throw new ApolloError('Failed to delete student:', 'STUDENT_DELETION_FAILED', {
      error: error.message,
    });
  }
}

// *************** LOADER ***************
/**
 * Loads the school associated with a student using a DataLoader.
 * @param {object} student - The parent student object.
 * @param {string} student.school - The ID of the school to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the school object.
 */
async function SchoolLoader(student, _, context) {
  try {
    StudentValidator.ValidateSchoolLoaderInput(student, context);

    const school = await context.dataLoaders.SchoolLoader.load(student.school);

    return school;
  } catch (error) {
    throw new ApolloError(`Failed to fetch school: ${error.message}`, 'SCHOOL_FETCH_FAILED');
  }
}

/**
 * Loads the user who created the student using a DataLoader.
 * @param {object} student - The parent student object.
 * @param {string} student.created_by - The ID of the user who created the student.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(student, _, context) {
  try {
    StudentValidator.ValidateUserLoaderInput(student, context, 'created_by');

    const createdBy = await context.dataLoaders.UserLoader.load(student.created_by);

    return createdBy;
  } catch (error) {
    throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
      error: error.message,
    });
  }
}

/**
 * Loads the user who last updated the student using a DataLoader.
 * @param {object} student - The parent student object.
 * @param {string} student.updated_by - The ID of the user who last updated the student.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(student, _, context) {
  try {
    StudentValidator.ValidateUserLoaderInput(student, context, 'updated_by');

    const updatedBy = await context.dataLoaders.UserLoader.load(student.updated_by);

    return updatedBy;
  } catch (error) {
    throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
      error: error.message,
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  Query: {
    GetAllStudents,
    GetOneStudent,
  },

  Mutation: {
    CreateStudent,
    UpdateStudent,
    DeleteStudent,
  },

  Student: {
    school: SchoolLoader,
    created_by: CreatedByLoader,
    updated_by: UpdatedByLoader,
  },
};
