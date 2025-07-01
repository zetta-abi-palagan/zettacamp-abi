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
            field: 'block_status'
        });
    }
}

/**
 * Validates the input object for creating or updating a block using a rule-based approach.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.blockInput - An object containing the block's properties to be validated.
 * @param {string} [args.blockInput.name] - The name of the block.
 * @param {string} [args.blockInput.description] - The description of the block.
 * @param {string} [args.blockInput.evaluation_type] - The evaluation method (e.g., 'COMPETENCY').
 * @param {string} [args.blockInput.block_type] - The type of block (e.g., 'REGULAR').
 * @param {string} [args.blockInput.connected_block] - Optional. The ID of a related block.
 * @param {boolean} [args.blockInput.is_counted_in_final_transcript] - Flag for final transcript inclusion.
 * @param {string} [args.blockInput.block_status] - Optional. The status of the block (e.g., 'ACTIVE').
 * @param {object} [args.blockInput.block_passing_criteria] - Optional. The criteria for passing the block.
 * @param {boolean} [args.isUpdate=false] - Optional flag to indicate if this is an update operation, which allows for partial data.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateBlockInput({ blockInput, isUpdate = false }) {
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
        validateBlockPassingCriteria({ criteria: blockInput.block_passing_criteria });
    }
}

/**
 * Recursively validates a nested structure defining the passing criteria for a block.
 * A criteria object can be a logical group of other criteria or a single rule.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.criteria - The criteria object or sub-object to validate.
 * @param {string} [args.path='block_passing_criteria'] - The dot-notation path to the current criteria object, used for clear error messages.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function validateBlockPassingCriteria({ criteria, path = 'block_passing_criteria' }) {
    const validCriteriaType = ['MARK', 'AVERAGE'];
    const validComparisonOperator = ['GTE', 'LTE', 'GT', 'LT', 'E'];
    const validLogicalOperator = ['AND', 'OR'];

    const isGroup = Array.isArray(criteria.conditions);

    if (isGroup) {
        if (
            typeof criteria.logical_operator !== 'string' ||
            !validLogicalOperator.includes(criteria.logical_operator.toUpperCase())
        ) {
            throw new ApolloError(
                `Field '${path}.logical_operator' must be a string and one of: ${validLogicalOperator.join(', ')}.`,
                'BAD_USER_INPUT'
            );
        }

        if (!criteria.conditions.length) {
            throw new ApolloError(
                `Field '${path}.conditions' must be a non-empty array.`,
                'BAD_USER_INPUT'
            );
        }

        criteria.conditions.forEach((condition, index) => {
            validateBlockPassingCriteria({
                criteria: condition,
                path: `${path}.conditions[${index}]`
            });
        });
    } else {
        if (
            typeof criteria.criteria_type !== 'string' ||
            !validCriteriaType.includes(criteria.criteria_type.toUpperCase())
        ) {
            throw new ApolloError(
                `Field '${path}.criteria_type' must be a string and one of: ${validCriteriaType.join(', ')}.`,
                'BAD_USER_INPUT'
            );
        }

        if (criteria.criteria_type.toUpperCase() === 'MARK') {
            if (
                !criteria.subject ||
                typeof criteria.subject !== 'string' ||
                !mongoose.Types.ObjectId.isValid(criteria.subject)
            ) {
                throw new ApolloError(
                    `Field '${path}.subject' must be a valid ObjectId string when 'criteria_type' is 'MARK'.`,
                    'BAD_USER_INPUT'
                );
            }
        }

        if (
            typeof criteria.comparison_operator !== 'string' ||
            !validComparisonOperator.includes(criteria.comparison_operator.toUpperCase())
        ) {
            throw new ApolloError(
                `Field '${path}.comparison_operator' must be a string and one of: ${validComparisonOperator.join(', ')}.`,
                'BAD_USER_INPUT'
            );
        }

        if (typeof criteria.mark !== 'number' || criteria.mark < 0) {
            throw new ApolloError(
                `Field '${path}.mark' must be a number ≥ 0.`,
                'BAD_USER_INPUT'
            );
        }
    }
}

/**
 * Validates the inputs for the SubjectLoader resolver.
 * @param {object} block - The parent block object, which must contain a 'subjects' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured SubjectLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSubjectLoaderInput(block, context) {
    if (!block || typeof block !== 'object' || block === null) {
        throw new ApolloError('Input error: block must be a valid object.', 'BAD_USER_INPUT', {
            field: 'block'
        });
    }

    if (!Array.isArray(block.subjects)) {
        throw new ApolloError('Input error: block.subjects must be an array.', 'BAD_USER_INPUT', {
            field: 'block.subjects'
        });
    }

    for (const subjectId of block.subjects) {
        if (!mongoose.Types.ObjectId.isValid(subjectId)) {
            throw new ApolloError(`Invalid subject ID found in subjects array: ${subjectId}`, 'BAD_USER_INPUT', {
                field: 'block.subjects'
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

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.UserLoader ||
        typeof context.dataLoaders.UserLoader.load !== 'function'
    ) {
        throw new ApolloError(
            'Server configuration error: UserLoader not found on context.',
            'INTERNAL_SERVER_ERROR'
        );
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
    ValidateUserLoaderInput
};