import Task from '#models/task'
import TaskTransformer from '#transformers/task_transformer'
import { createTaskValidator, todayValidator, updateTaskValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'

/**
 * El día de quien mira, para decidir el vencimiento. Llega en `?today=`; si
 * falta se usa el día UTC del servidor, y si es inválido se rechaza con 422.
 */
async function referenceDay(request: HttpContext['request']) {
  const { today } = await request.validateUsing(todayValidator)

  return today ?? DateTime.utc().toISODate()
}

export default class TasksController {
  async index({ request, serialize }: HttpContext) {
    const today = await referenceDay(request)
    // Sin orderBy a propósito: no hay regla de orden decidida (PA-3).
    const tasks = await Task.query().preload('assignee')

    return serialize(TaskTransformer.transform(tasks, today))
  }

  async show({ params, request, serialize }: HttpContext) {
    const today = await referenceDay(request)
    const task = await Task.query().where('id', params.id).preload('assignee').firstOrFail()

    return serialize(TaskTransformer.transform(task, today))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const today = await referenceDay(request)
    const { title, dueDate } = await request.validateUsing(createTaskValidator)

    const task = await Task.create({
      title,
      status: 'pending',
      assigneeId: auth.getUserOrFail().id,
      dueDate: dueDate ?? null,
    })
    await task.load('assignee')

    return serialize(TaskTransformer.transform(task, today))
  }

  async update({ params, request, serialize }: HttpContext) {
    const today = await referenceDay(request)
    const task = await Task.findOrFail(params.id)
    const { status, dueDate } = await request.validateUsing(updateTaskValidator)

    if (status === undefined && dueDate === undefined) {
      throw new errors.E_VALIDATION_ERROR([
        {
          message: 'The status or dueDate field must be defined',
          rule: 'required',
          field: 'status',
        },
      ])
    }

    // Solo se aplica lo que viene: una clave ausente no se toca, y una fecha
    // explícitamente vacía (`null`) la quita.
    if (status !== undefined) task.status = status
    if (dueDate !== undefined) task.dueDate = dueDate
    await task.save()
    await task.load('assignee')

    return serialize(TaskTransformer.transform(task, today))
  }
}
