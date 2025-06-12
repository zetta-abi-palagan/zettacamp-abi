// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');

// *************** QUERY ***************


// *************** MUTATION ***************
async function CreateBlockHelper(input) {
    const {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    } = input;

    // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
    const createdByUserId = '6846e5769e5502fce150eb67';

    const blockData = {
        name: name,
        description: description,
        evaluation_type: evaluation_type.toUpperCase(),
        block_type: block_type.toUpperCase(),
        connected_block: connected_block,
        is_counted_in_final_transcript: is_counted_in_final_transcript,
        block_status: block_status.toUpperCase(),
        created_by: createdByUserId,
        updated_by: createdByUserId
    }

    try {
        return await BlockModel.create(blockData)
    } catch (error) {
        throw new ApolloError('Failed to create school', 'SCHOOL_CREATION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************


// *************** EXPORT MODULE ***************
module.exports = {
    CreateBlockHelper
}