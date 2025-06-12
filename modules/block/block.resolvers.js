// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const {
    ValidateCreateBlockInput
} = require('./block.validator');
const {
    CreateBlockHelper
} = require('./block.helper');

// *************** QUERY ***************


// *************** MUTATION ***************
async function CreateBlock(_, { input }) {
    ValidateCreateBlockInput(input)
    return await CreateBlockHelper(input);
}

// *************** LOADER ***************


// *************** EXPORT MODULE ***************
module.exports = {
    Mutation: {
        CreateBlock
    }
}