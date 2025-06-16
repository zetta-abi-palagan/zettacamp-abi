// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const BlockModel = require('./block.model');

/**
 * Creates a new DataLoader for batch-loading block data by their IDs.
 * This function is used to solve the N+1 problem by collecting individual block ID
 * requests and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching blocks by their unique ID.
 */
function BlockLoader() {
    return new DataLoader(async (blockIds) => {
        try {
            const blocks = await BlockModel.find({
                _id: { $in: blockIds },
            });

            const blocksById = new Map(blocks.map(block => [String(block._id), block]));

            return blockIds.map(blockId => blocksById.get(String(blockId)));
        } catch (error) {
            console.error('Error batch fetching blocks:', error);
            throw new ApolloError(`Failed to batch fetch blocks: ${error.message}`, 'BLOCK_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = BlockLoader;