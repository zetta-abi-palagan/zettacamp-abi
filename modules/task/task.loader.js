// *************** IMPORT CORE ***************
const DataLoader = require('dataloader');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const TaskModel = require('./task.model');

/**
 * Creates a new DataLoader for batch-loading non-deleted task data by their IDs.
 * This function is used to solve the N+1 problem by collecting individual task ID
 * requests and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching tasks by their unique ID.
 */
function TaskLoader() {
    return new DataLoader(async (taskIds) => {
        try {
            const tasks = await TaskModel.find({
                _id: { $in: taskIds }
            }).lean();

            const tasksById = new Map(tasks.map(task => [String(task._id), task]));

            return taskIds.map(taskId => tasksById.get(String(taskId)) || null);
        } catch (error) {
            console.error("Error batch fetching tasks:", error);
            throw new ApolloError(`Failed to batch fetch tasks: ${error.message}`, 'TASK_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = TaskLoader;