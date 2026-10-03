import type Task from '#models/task'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class TaskTransformer extends BaseTransformer<Task> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'status']),
      // Solo el nombre: ni email, ni id, ni nada más de la cuenta.
      assignee: { fullName: this.resource.assignee.fullName },
    }
  }
}
