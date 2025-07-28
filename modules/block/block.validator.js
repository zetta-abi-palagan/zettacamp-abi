// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the input for fetching all blocks.
 * @param {string} block_status - The status of the blocks to filter by (optional).
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateBlockStatusFilter(block_status) {
  const validStatus = ['ACTIVE', 'INACTIVE'];

  if (!block_status) {
    return;
  }

  if (typeof block_status !== 'string' || !validStatus.includes(block_status.toUpperCase())) {
    throw new ApolloError(`Block status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
      field: 'block_status',
    });
  }
}

/**
 * Validates the input object for creating or updating a block using a rule-based approach.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.blockInput - An object containing the block's properties to be validated.
 * @param {string} [args.blockInput.name] - The name of the block.
 * @param {string} [args.blockInput.description] - The description of the block.
 * @param {string} [args.blockInput.evaluation_type] - The evaluation method.
 * @param {string} [args.blockInput.block_type] - The type of block.
 * @param {string} [args.blockInput.connected_block] - Optional. The ID of a related block.
 * @param {boolean} [args.blockInput.is_counted_in_final_transcript] - Flag for final transcript inclusion.
 * @param {string} [args.blockInput.block_status] - Optional. The status of the block.
 * @param {object} [args.blockInput.block_passing_criteria] - Optional. The criteria for passing the block.
 * @param {Array<object>} [args.subjects] - The existing subjects of the block, required for validating passing criteria.
 * @param {boolean} [args.isUpdate=false] - Optional flag to indicate if this is an update operation, which allows for partial data.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateBlockInput({ blockInput, subjects, isUpdate = false }) {
  const validEvaluationType = ['COMPETENCY', 'SCORE'];
  const validBlockType = ['REGULAR', 'COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'SPECIALIZATION', 'TRANSVERSAL', 'RETAKE'];
  const validStatus = ['ACTIVE', 'INACTIVE'];
  const competencyBlockTypes = ['COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'RETAKE'];
  const scoreBlockTypes = ['REGULAR', 'TRANSVERSAL', 'SPECIALIZATION', 'RETAKE'];

  const validationRules = [
    {
      field: 'name',
      required: true,
      validate: (val) => typeof val === 'string' && val.trim() !== '',
      message: 'Name is required.',
    },
    {
      field: 'description',
      required: true,
      validate: (val) => typeof val === 'string' && val.trim() !== '',
      message: 'Description is required.',
    },
    {
      field: 'evaluation_type',
      required: true,
      validate: (val) => typeof val === 'string' && validEvaluationType.includes(val.toUpperCase()),
      message: `Evaluation type must be one of: ${validEvaluationType.join(', ')}.`,
    },
    {
      field: 'block_type',
      required: true,
      validate: (val) => typeof val === 'string' && validBlockType.includes(val.toUpperCase()),
      message: `Block type must be one of: ${validBlockType.join(', ')}.`,
    },
    {
      field: 'block_status',
      required: false,
      validate: (val) => typeof val === 'string' && validStatus.includes(val.toUpperCase()),
      message: `Block status must be one of: ${validStatus.join(', ')}.`,
    },
    {
      field: 'is_counted_in_final_transcript',
      required: true,
      validate: (val) => typeof val === 'boolean',
      message: 'is_counted_in_final_transcript must be a boolean.',
    },
    {
      field: 'connected_block',
      required: false,
      validate: (val) => mongoose.Types.ObjectId.isValid(val),
      message: (val) => `Invalid connected_block ID: ${val}`,
    },
  ];

  for (const rule of validationRules) {
    const value = blockInput[rule.field];
    if ((!isUpdate && rule.required) || value !== undefined) {
      if (!rule.validate(value)) {
        const message = typeof rule.message === 'function' ? rule.message(value) : rule.message;
        throw new ApolloError(message, 'BAD_USER_INPUT', { field: rule.field });
      }
    }
  }

  const { evaluation_type, block_type, connected_block } = blockInput;

  if (evaluation_type && block_type) {
    const evalUpper = evaluation_type.toUpperCase();
    const typeUpper = block_type.toUpperCase();

    const isCompetencyMismatch = evalUpper === 'COMPETENCY' && !competencyBlockTypes.includes(typeUpper);
    const isScoreMismatch = evalUpper === 'SCORE' && !scoreBlockTypes.includes(typeUpper);

    if (isCompetencyMismatch || isScoreMismatch) {
      throw new ApolloError(
        `Invalid combination: ${evalUpper} evaluation cannot be used with ${typeUpper} block type.`,
        'LOGIC_SANITY_ERROR'
      );
    }
  }

  if (connected_block && block_type && block_type.toUpperCase() !== 'RETAKE') {
    throw new ApolloError('Block type must be RETAKE to have a connected block.', 'BAD_USER_INPUT', { field: 'connected_block' });
  }

  if (blockInput.block_passing_criteria) {
    if (!subjects || !subjects.length) {
      throw new ApolloError("Cannot set 'block_passing_criteria' because the block has no subjects.", 'BAD_USER_INPUT');
    }

    validateBlockPassingCriteriaInput({
      blockPassingCriteria: blockInput.block_passing_criteria,
      subjects: subjects,
    });
  }
}

/**
 * Validates the top-level structure of a block's passing criteria object.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.blockPassingCriteria - The passing criteria object to validate.
 * @param {Array<object>} args.subjects - An array of the block's subjects to validate against.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function validateBlockPassingCriteriaInput({ blockPassingCriteria, subjects }) {
  const { pass_criteria, fail_criteria } = blockPassingCriteria;

  if (!pass_criteria && !fail_criteria) {
    throw new ApolloError(
      "Field 'block_passing_criteria' must contain at least one of 'pass_criteria' or 'fail_criteria'.",
      'BAD_USER_INPUT'
    );
  }

  const availableSubjectIds = new Set(subjects.map(String));

  if (pass_criteria) {
    validateCriteriaGroups({
      criteriaGroups: pass_criteria.block_criteria_groups,
      availableSubjectIds: availableSubjectIds,
      path: 'block_passing_criteria.pass_criteria.block_criteria_groups',
    });
  }

  if (fail_criteria) {
    validateCriteriaGroups({
      criteriaGroups: fail_criteria.block_criteria_groups,
      availableSubjectIds: availableSubjectIds,
      path: 'block_passing_criteria.fail_criteria.block_criteria_groups',
    });
  }
}

/**
 * Validates an array of criteria groups.
 * @param {object} args - The arguments for the validation.
 * @param {Array<object>} args.criteriaGroups - The array of criteria groups to validate.
 * @param {Set<string>} args.availableSubjectIds - A Set of subject IDs that are valid for this block.
 * @param {string} args.path - The dot-notation path to the current groups array, used for error messages.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function validateCriteriaGroups({ criteriaGroups, availableSubjectIds, path }) {
  if (!Array.isArray(criteriaGroups) || !criteriaGroups.length) {
    throw new ApolloError(`Field '${path}' must be a non-empty array of criteria groups.`, 'BAD_USER_INPUT');
  }

  criteriaGroups.forEach((group, groupIndex) => {
    const groupPath = `${path}[${groupIndex}]`;
    if (!Array.isArray(group.conditions) || !group.conditions.length) {
      throw new ApolloError(`Field '${groupPath}.conditions' must be a non-empty array.`, 'BAD_USER_INPUT');
    }

    group.conditions.forEach((condition, condIndex) => {
      const conditionPath = `${groupPath}.conditions[${condIndex}]`;
      validateSingleCondition({
        condition,
        availableSubjectIds,
        path: conditionPath,
      });
    });
  });
}

/**
 * Validates a single, atomic condition object within a criteria group.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.condition - The single condition object to validate.
 * @param {Set<string>} args.availableSubjectIds - A Set of valid subject IDs to check against if criteria type is 'MARK'.
 * @param {string} args.path - The dot-notation path to the current condition, used for error messages.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function validateSingleCondition({ condition, availableSubjectIds, path }) {
  const validCriteriaType = ['MARK', 'AVERAGE'];
  const validComparisonOperator = ['GTE', 'LTE', 'GT', 'LT', 'E'];

  if (typeof condition.criteria_type !== 'string' || !validCriteriaType.includes(condition.criteria_type.toUpperCase())) {
    throw new ApolloError(
      `Field '${path}.criteria_type' is required and must be one of: ${validCriteriaType.join(', ')}.`,
      'BAD_USER_INPUT'
    );
  }

  if (typeof condition.comparison_operator !== 'string' || !validComparisonOperator.includes(condition.comparison_operator.toUpperCase())) {
    throw new ApolloError(
      `Field '${path}.comparison_operator' is required and must be one of: ${validComparisonOperator.join(', ')}.`,
      'BAD_USER_INPUT'
    );
  }

  if (typeof condition.mark !== 'number' || condition.mark < 0) {
    throw new ApolloError(`Field '${path}.mark' is required and must be a number ≥ 0.`, 'BAD_USER_INPUT');
  }

  if (condition.criteria_type.toUpperCase() === 'MARK') {
    if (typeof condition.subject !== 'string' || !mongoose.Types.ObjectId.isValid(condition.subject)) {
      throw new ApolloError(
        `Field '${path}.subject' is required and must be a valid ObjectId when 'criteria_type' is 'MARK'.`,
        'BAD_USER_INPUT'
      );
    }
    // Check if the subject from the criteria is actually part of the block
    if (!availableSubjectIds.has(condition.subject)) {
      throw new ApolloError(
        `Subject with ID "${condition.subject}" in '${path}.subject' is not associated with this block.`,
        'BAD_USER_INPUT'
      );
    }
  }
}

/**
 * Validates the inputs for the SubjectLoader resolver.
 * @param {object} parent - The parent object, which must contain a 'subjects' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured SubjectLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSubjectLoaderInput(parent, context) {
  if (!parent || typeof parent !== 'object' || parent === null) {
    throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT', {
      field: 'parent',
    });
  }

  if (!Array.isArray(parent.subjects)) {
    throw new ApolloError('Input error: parent.subjects must be an array.', 'BAD_USER_INPUT', {
      field: 'parent.subjects',
    });
  }

  for (const subjectId of parent.subjects) {
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      throw new ApolloError(`Invalid subject ID found in subjects array: ${subjectId}`, 'BAD_USER_INPUT', {
        field: 'parent.subjects',
      });
    }
  }

  if (
    !context ||
    !context.dataLoaders ||
    !context.dataLoaders.SubjectLoader ||
    typeof context.dataLoaders.SubjectLoader.loadMany !== 'function'
  ) {
    throw new ApolloError(
      'Server configuration error: SubjectLoader with loadMany function not found on context.',
      'INTERNAL_SERVER_ERROR'
    );
  }
}

/**
 * Validates the inputs for resolvers that use the UserLoader.
 * @param {object} parent - The parent object.
 * @param {object} context - The GraphQL context, which must contain a configured UserLoader.
 * @param {string} fieldName - The name of the property on the block object that holds the user ID (e.g., 'created_by').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUserLoaderInput(parent, context, fieldName) {
  if (!parent || typeof parent !== 'object' || parent === null) {
    throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT');
  }

  if (!context || !context.dataLoaders || !context.dataLoaders.UserLoader || typeof context.dataLoaders.UserLoader.load !== 'function') {
    throw new ApolloError('Server configuration error: UserLoader not found on context.', 'INTERNAL_SERVER_ERROR');
  }

  const userId = parent[fieldName];

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApolloError(`Input error: If provided, parent.${fieldName} must be a valid ID.`, 'BAD_USER_INPUT');
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateBlockStatusFilter,
  ValidateBlockInput,
  ValidateSubjectLoaderInput,
  ValidateUserLoaderInput,
};
