# Tasks

> Sin tests por decisión del change: ninguna tarea los crea ni monta runner. Cada verificación usa `npm run typecheck`, `npm run lint`, `npm run build`, `curl` contra la API o `git diff`. Los comandos de backend se ejecutan desde `backend/` y los de frontend desde `frontend/`. Los datos de prueba que se creen en `tmp/db.sqlite3` se borran al terminar.

## 1. Preparación

- [ ] 1.1 Crear la rama `feat/add-task-due-date` desde la rama de trabajo antes de tocar código (regla del CLAUDE.md) y verificar con `git branch --show-current`

## 2. Backend: datos y regla de vencimiento

- [x] 2.1 Crear la migración que añade `due_date` nullable de tipo fecha a `tasks` (sin ninguna columna `is_overdue`), con `down()` que la elimina, y verificar con `node ace migration:run` que se aplica sobre la base existente, que las tareas previas siguen válidas con `due_date` nulo, y con `node ace migration:rollback` seguido de `migration:run` que el reverso deja el esquema como estaba
- [x] 2.2 Comprobar que `database/schema.ts` se regeneró con `dueDate` y que viaja como la cadena `YYYY-MM-DD` (si el generador lo mapea a `DateTime`, añadir la regla en `database/schema_rules.ts` para que sea `string` y regenerar); verificar con `npm run typecheck`
- [x] 2.3 Añadir a `app/models/task.ts` el método `isOverdueOn(today: string): boolean` (`dueDate` presente, `dueDate < today` comparando cadenas y `status !== 'done'`) sin leer el reloj y sin columna ni job asociado; verificar con `npm run typecheck` y con un script `node ace repl` de una línea por caso que los bordes (ayer, hoy, mañana, sin fecha y `done` con fecha pasada) dan `true`, `false`, `false`, `false`, `false`

## 3. Backend: validación y API

- [x] 3.1 Crear `app/validators/calendar_date.ts` con el builder `calendarDate()` (cadena `YYYY-MM-DD` que sea un día real, validada con luxon que ya trae el proyecto, sin dependencias nuevas) y verificar con `npm run typecheck`
- [x] 3.2 En `app/validators/task.ts`, añadir `dueDate` (`calendarDate().nullable().optional()`) a `createTaskValidator`, sustituir `updateTaskStatusValidator` por `updateTaskValidator` con `status` y `dueDate` opcionales y la regla de que al menos uno venga (cuidando que `dueDate: null` cuente como presente), y añadir `todayValidator` para la query `today` opcional; verificar con `npm run typecheck`
- [x] 3.3 Cambiar `app/transformers/task_transformer.ts` para recibir el día de referencia (`constructor(resource, today)`) y devolver además `dueDate` e `isOverdue: resource.isOverdueOn(today)`; verificar con `npm run typecheck`
- [x] 3.4 En `app/controllers/tasks_controller.ts`, leer y validar `today` en `index`, `store` y `update` (por defecto el día UTC del servidor) y pasarlo al transformer; guardar `dueDate` en `store` si viene; aplicar en `update` solo los campos presentes (`status` y/o `dueDate`); y añadir `show` (`findOrFail`, precarga `assignee`); verificar con `npm run typecheck`
- [x] 3.5 Registrar `GET /tasks/:id` en `start/routes.ts` dentro del grupo autenticado y verificar con `node ace list:routes` que existen `GET /tasks`, `GET /tasks/:id`, `POST /tasks` y `PATCH /tasks/:id`, y ninguna ruta de borrado ni de equipo; arrancar el servidor para regenerar `.adonisjs/` y dejar su diff en el árbol
- [x] 3.6 Verificar la regla con `curl` contra `npm run dev`, enviando `?today=` fijo: tarea pendiente con fecha el día anterior da `isOverdue: true`, con fecha igual a `today` da `false`, con fecha posterior da `false`, sin fecha da `false`, y en `done` con fecha pasada da `false`; pasar a `done` conserva la fecha; volver a `pending` con fecha pasada vuelve a `true`; la misma tarea leída con `today` de un día después y de un día antes da veredictos distintos; sin `today` no falla; con `today=2026-02-30` y `today=hoy` da 422 sobre `today`
- [x] 3.7 Verificar la fecha con `curl`: `POST` con y sin `dueDate`; `POST` con fecha pasada se acepta y nace vencida; `PATCH` que pone, cambia y quita la fecha (con `null` y con cadena vacía); `PATCH` solo con `status` conserva la fecha; `PATCH` solo con `dueDate` conserva el estado; `PATCH` con `{}` da 422; fechas `2026-02-30`, `2026-12`, `31/12/2026` y texto dan 422 sobre `dueDate` sin alterar la tarea; `isOverdue` enviado en `POST` y en `PATCH` se ignora; título y `assigneeId` en `PATCH` se ignoran
- [x] 3.8 Verificar `GET /tasks/:id` con `curl`: devuelve título, estado, `assignee.fullName`, `dueDate` e `isOverdue`; 404 con un id inexistente; 401 sin token; `GET /tasks` sigue devolviendo todas las tareas con `dueDate` e `isOverdue` y sin `ORDER BY`; `DELETE /tasks/1` sigue sin existir
- [x] 3.9 Ejecutar `npm run lint` y `npm run typecheck` en `backend/` y verificar que pasan sin errores nuevos

## 4. Frontend: capa de acceso a la API

- [x] 4.1 En `lib/types.ts`, añadir `dueDate: string | null` e `isOverdue: boolean` a `Task` y el tipo de la actualización parcial (`status` y/o `dueDate`), y verificar con `npm run build`
- [x] 4.2 En `lib/api.ts`, añadir `localToday()` (día local `YYYY-MM-DD` con `getFullYear/getMonth/getDate`, no `toISOString`) y hacer que `listTasks`, `createTask` y `updateTaskStatus` envíen `?today=`; verificar con `npm run build` y revisando que una petición de `listTasks` lleva el parámetro con el día local
- [x] 4.3 En `lib/api.ts`, añadir `getTask` y `updateTaskDueDate` (enviando `null` para quitar la fecha), la etiqueta `dueDate` en `FIELD_LABELS` y el mensaje en castellano de fecha inválida en `translate`; verificar con `npm run build`
- [x] 4.4 Ejecutar `npm run lint` y `npm run build` en `frontend/` y verificar que pasan, y con `git diff --stat -- src/pages src/components` que `tasks-page.tsx` y `task-item.tsx` no cambian

## 5. Cierre

- [x] 5.1 Comprobar con `git diff --stat` que el change no añade dependencias, componentes en `components/ui/`, ficheros de test, columnas de `isOverdue` ni jobs
- [ ] 5.2 Cerrar según el CLAUDE.md: usar `/commit`, abrir el PR con `gh pr create` con la descripción completa de los cambios, pasar el subagente `adversarial-reviewer` sobre el PR y responder solo con la URL del PR
