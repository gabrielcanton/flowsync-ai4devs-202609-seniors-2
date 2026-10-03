import type Task from '#models/task'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class TaskTransformer extends BaseTransformer<Task> {
  /**
   * `today` es el día de quien mira (`YYYY-MM-DD`): el veredicto de vencimiento
   * se calcula en cada lectura contra ese día.
   */
  constructor(
    resource: Task,
    protected today: string
  ) {
    super(resource)
  }

  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'title', 'status', 'dueDate']),
      isOverdue: this.resource.isOverdueOn(this.today),
      // Solo el nombre: ni email, ni id, ni nada más de la cuenta.
      assignee: { fullName: this.resource.assignee.fullName },
    }
  }
}
