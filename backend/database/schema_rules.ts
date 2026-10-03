import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

export default {
  tables: {
    tasks: {
      columns: {
        // Fecha de calendario sin hora: viaja y se compara como `YYYY-MM-DD`.
        // Con `DateTime` (luxon) cargaría un huso y podría correr el día.
        due_date: { tsType: 'string', decorators: [{ name: '@column' }] },
      },
    },
  },
} satisfies SchemaRules
