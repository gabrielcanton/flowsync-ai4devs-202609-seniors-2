import tasksConfig from '#config/tasks'
import { TASK_STATUSES } from '#models/task_status'
import { calendarDate } from '#validators/calendar_date'
import vine from '@vinejs/vine'

/**
 * Validator to use when creating a task: the title is the only required input.
 * The due date is optional and a past date is accepted.
 */
export const createTaskValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(tasksConfig.maxTitleLength),
  dueDate: calendarDate().nullable().optional(),
})

/**
 * Validator to use when updating a task: only its status and due date can
 * change. Each key is optional; that at least one is present is checked by the
 * controller, because `requiredIfMissing` treats an explicit `null` due date
 * (which removes it) as missing. An absent key leaves the field untouched.
 */
export const updateTaskValidator = vine.create({
  status: vine.enum(TASK_STATUSES).optional(),
  dueDate: calendarDate().nullable().optional(),
})

/**
 * Validator for the `today` query: the day of whoever is looking, used to
 * decide which tasks are overdue. Optional; the server falls back to its own.
 */
export const todayValidator = vine.create({
  today: calendarDate().optional(),
})
