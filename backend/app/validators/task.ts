import tasksConfig from '#config/tasks'
import { TASK_STATUSES } from '#models/task_status'
import vine from '@vinejs/vine'

/**
 * Validator to use when creating a task: the title is the only input.
 */
export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(tasksConfig.maxTitleLength),
})

/**
 * Validator to use when updating a task: only its status can change.
 */
export const updateTaskStatusValidator = vine.create({
  status: vine.enum(TASK_STATUSES),
})
