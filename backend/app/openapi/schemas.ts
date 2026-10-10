import { ApiProperty } from '@foadonis/openapi/decorators'
import { TASK_STATUSES } from '#models/task'

/**
 * Esquemas del documento OpenAPI que se repiten entre operaciones. Cada clase
 * se publica una vez en `components.schemas` y las respuestas la referencian.
 *
 * Describen lo que el código ya devuelve (ver `app/transformers/` y
 * `app/validators/task.ts`); no son una segunda fuente de verdad, solo su
 * retrato para el documento.
 */

export class TaskAssignee {
  @ApiProperty({ type: 'integer' })
  declare id: number

  /** Nulo si la cuenta se registró sin nombre; las iniciales llegan igualmente. */
  @ApiProperty({ type: 'string', nullable: true })
  declare fullName: string | null

  @ApiProperty({ type: 'string' })
  declare initials: string
}

/** Tarea tal como la devuelven la lista y el alta: sin vencimiento. */
export class Task {
  @ApiProperty({ type: 'integer' })
  declare id: number

  @ApiProperty({ type: 'string' })
  declare title: string

  @ApiProperty({ type: 'string', enum: [...TASK_STATUSES] })
  declare status: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare createdAt: string

  @ApiProperty({ type: 'string', format: 'date-time' })
  declare updatedAt: string

  @ApiProperty({ type: () => TaskAssignee })
  declare assignee: TaskAssignee
}

/** Tarea suelta: añade la fecha de vencimiento y si está vencida para el día pedido. */
export class TaskDetail extends Task {
  /** Día del calendario `AAAA-MM-DD`, sin hora ni huso; nulo si no tiene fecha. */
  @ApiProperty({ type: 'string', format: 'date', nullable: true })
  declare dueDate: string | null

  @ApiProperty({ type: 'boolean' })
  declare isOverdue: boolean
}

export class TaskResponse {
  @ApiProperty({ type: () => Task })
  declare data: Task
}

export class TaskListResponse {
  @ApiProperty({ type: () => [Task] })
  declare data: Task[]
}

export class TaskDetailResponse {
  @ApiProperty({ type: () => TaskDetail })
  declare data: TaskDetail
}

export class ApiError {
  @ApiProperty({ type: 'string' })
  declare message: string

  @ApiProperty({ type: 'string', required: false })
  declare rule?: string

  @ApiProperty({ type: 'string', required: false })
  declare field?: string
}

/** Formato de error de la API: `{ errors: [...] }`, con `field` en los 422 de validación. */
export class ErrorResponse {
  @ApiProperty({ type: () => [ApiError] })
  declare errors: ApiError[]
}

export class CreateTaskBody {
  @ApiProperty({
    type: 'string',
    minLength: 1,
    maxLength: 200,
    description: 'Se recortan los espacios de los extremos. Cualquier otro campo se ignora.',
  })
  declare title: string
}

export class UpdateTaskStatusBody {
  @ApiProperty({ type: 'string', enum: [...TASK_STATUSES] })
  declare status: string
}

export class SetTaskDueDateBody {
  @ApiProperty({
    type: 'string',
    format: 'date',
    description: 'Día de referencia `AAAA-MM-DD` de quien pide; obligatorio.',
  })
  declare today: string

  @ApiProperty({
    type: 'string',
    format: 'date',
    nullable: true,
    description: 'Nueva fecha `AAAA-MM-DD`, o `null` para retirarla.',
  })
  declare dueDate: string | null
}
