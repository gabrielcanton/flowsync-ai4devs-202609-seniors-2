/**
 * Espejo de `UserTransformer` del backend (app/transformers/user_transformer.ts).
 */
export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string
}

/**
 * Respuesta de `POST /auth/signup` y `POST /auth/login`, ya sin el envoltorio `{ data }`.
 */
export type AuthResult = {
  user: User
  token: string
}

export type SignupPayload = {
  /** El backend lo declara `.nullable()`: la clave debe viajar siempre, aunque valga `null`. */
  fullName: string | null
  email: string
  password: string
  passwordConfirmation: string
}

export type LoginPayload = {
  email: string
  password: string
}

/** Los tres estados de una tarea tal como viajan por la API. */
export type TaskStatus = 'pending' | 'in_progress' | 'done'

/** Cómo se pintan los estados en pantalla. Nunca se usan como identificadores. */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  done: 'Hecho',
}

/**
 * Espejo de `TaskTransformer` del backend (app/transformers/task_transformer.ts).
 * Del responsable solo viaja el nombre.
 */
export type Task = {
  id: number
  title: string
  status: TaskStatus
  /** Fecha de calendario `YYYY-MM-DD`, sin hora; `null` si no tiene. */
  dueDate: string | null
  /** Veredicto del backend contra el día local enviado; el cliente no lo calcula. */
  isOverdue: boolean
  assignee: { fullName: string | null }
}

export type CreateTaskPayload = {
  title: string
}

/**
 * Actualización parcial de una tarea: al menos una de las dos claves. Una clave
 * ausente no se toca; `dueDate: null` quita la fecha.
 */
export type UpdateTaskPayload = {
  status?: TaskStatus
  dueDate?: string | null
}
