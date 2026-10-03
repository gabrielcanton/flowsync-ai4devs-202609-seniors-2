import env from '#start/env'

const tasksConfig = {
  /**
   * Longitud máxima del título de una tarea, ya sin espacios en los extremos.
   */
  maxTitleLength: env.get('MAX_TITLE_LENGTH'),
}

export default tasksConfig
