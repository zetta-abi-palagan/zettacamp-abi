// *************** IMPORT LIBRARY ***************
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

// *************** Custom Date scalar
const dateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',

    // *************** Converts backend Date object to client-readable format (ISO string)
    serialize(value) {
        return value instanceof Date ? value.toISOString() : null;
    },

    // *************** Converts client variable input to backend Date object
    parseValue(value) {
        return new Date(value);
    },

    // *************** Converts client query literal to backend Date object
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});

// *************** EXPORT MODULE ***************
module.exports = dateScalar;