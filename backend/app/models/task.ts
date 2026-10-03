import { TaskSchema } from '#database/schema'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Task extends TaskSchema {
  @belongsTo(() => User, { foreignKey: 'assigneeId' })
  declare assignee: BelongsTo<typeof User>

  /**
   * Única regla de vencimiento: tiene fecha, la fecha es anterior a `today`
   * (el día de quien mira, `YYYY-MM-DD`) y no está hecha. Compara cadenas de
   * calendario, sin construir fechas con huso, para que "hoy" nunca cuente como
   * anterior a hoy. No lee el reloj ni se guarda en ninguna columna.
   */
  isOverdueOn(today: string): boolean {
    return this.dueDate !== null && this.dueDate < today && this.status !== 'done'
  }
}
