/**
 * Applies soft-delete logic to an already fetched Mongoose document instance
 * by setting its 'deleted_at' field and then saving it.
 * @param {import('mongoose').Document} document - The fetched Mongoose document instance.
 * @returns {Promise<{document: import('mongoose').Document}>} The saved document with `deleted_at` updated.
 * @throws {Error} If the save operation fails.
 */
async function SoftDelete(document) {
    document.deleted_at = new Date();

    try {
        return await document.save();
    } catch (error) {
        console.error(`Error saving soft-deleted document ${document.id}:`, error);
        throw error;
    }
}

// *************** EXPORT MODULE *************** 
module.exports = { SoftDelete };