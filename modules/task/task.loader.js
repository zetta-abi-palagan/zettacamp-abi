// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const TaskModel = require('./task.model');


function TaskLoader() {
    return new DataLoader(async (taskIds) => {
        try {
            const tasks = await TaskModel.find({
                _id: { $in: taskIds },
                task_status: 'ACTIVE',
            });

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