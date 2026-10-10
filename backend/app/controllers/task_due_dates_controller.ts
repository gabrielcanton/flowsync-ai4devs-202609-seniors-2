import Task from '#models/task'
import { setTaskDueDateValidator, toCalendarDay } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import { ApiBearerAuth, ApiBody, ApiResponse } from '@foadonis/openapi/decorators'
import { ErrorResponse, SetTaskDueDateBody, TaskDetailResponse } from '#openapi/schemas'
import TaskDetailTransformer from '#transformers/task_detail_transformer'

@ApiBearerAuth()
export default class TaskDueDatesController {
  /**
   * Fijar, cambiar y retirar la fecha de vencimiento son la misma operación, y
   * por eso comparten endpoint: quitar la fecha no es borrar un recurso, es
   * poner el valor «sin fecha», que es un valor legítimo del campo.
   *
   * Endpoint propio en vez de un update genérico de la tarea, por el mismo
   * motivo que el estado: por ahí se colarían el título y el responsable, que
   * este change no permite tocar.
   *
   * Cualquiera con sesión puede cambiar la fecha de cualquier tarea, igual que
   * el estado. No se comprueba quién es el responsable.
   */
  @ApiBody({ type: SetTaskDueDateBody })
  @ApiResponse({
    status: 200,
    description: 'La tarea ya actualizada y resuelta contra `today`',
    type: TaskDetailResponse,
  })
  @ApiResponse({ status: 401, description: 'Falta el token o no es válido', type: ErrorResponse })
  @ApiResponse({ status: 404, description: 'La tarea no existe', type: ErrorResponse })
  @ApiResponse({
    status: 422,
    description: '`today` o `dueDate` ausentes o no son una fecha válida',
    type: ErrorResponse,
  })
  async update({ params, request, serialize }: HttpContext) {
    const task = await Task.findOrFail(params.id)
    const { today, dueDate } = await request.validateUsing(setTaskDueDateValidator)

    // El `DateTime` del validador se queda aquí: hacia dentro, una fecha de
    // vencimiento es un día en texto y nunca un instante.
    task.dueDate = dueDate === null ? null : toCalendarDay(dueDate)
    await task.save()
    await task.load('assignee')

    // Se devuelve ya resuelta contra el día de quien pide, para que aplazar una
    // tarea vencida deje de mostrarla vencida en esta misma respuesta.
    return serialize(TaskDetailTransformer.transform(task, toCalendarDay(today)))
  }
}
