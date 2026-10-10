# Capability `tasks`

La lista de trabajo compartida del equipo: una sola lista con todas las tareas del espacio, donde cada tarea muestra su título, su responsable y su estado, y puede tener una fecha de vencimiento opcional. Sirve para responder «¿en qué anda cada uno?» sin preguntar.

**Las reglas de negocio no se repiten aquí.** Están en [`openspec/specs/tasks/spec.md`](../../../openspec/specs/tasks/spec.md), que es la única fuente; este README solo dice dónde vive cada cosa y cómo probarla. Ten presente que la spec y el código pueden diferir (ver [Diferencias conocidas](#diferencias-conocidas)).

## Qué hace

- Crear una tarea escribiendo solo el título; nace a nombre de quien la crea y en estado `pending`.
- Ver la lista compartida y acotarla por estado.
- Cambiar el estado de cualquier tarea.
- Ver una tarea suelta y fijar, cambiar o retirar su fecha de vencimiento.
- En el frontend: pantalla de la lista (`/tasks`) y pantalla de una tarea (`/tasks/:id`), ambas con sesión.

## Endpoints

Todos bajo `/api/v1/tasks`, con `Authorization: Bearer <token>` (token de `POST /api/v1/auth/login`). Rutas en `backend/start/routes.ts`; el contrato detallado (parámetros, cuerpos, respuestas y códigos) está en el documento OpenAPI que sirve el backend en `/api.json`, con interfaz en `/api`.

| Método | Ruta | Controlador | Para qué |
|---|---|---|---|
| GET | `/api/v1/tasks` | `TasksController.index` | Lista; `?status=` opcional |
| POST | `/api/v1/tasks` | `TasksController.store` | Crear con `{ title }` |
| GET | `/api/v1/tasks/:id` | `TasksController.show` | Una tarea; exige `?today=AAAA-MM-DD` |
| PATCH | `/api/v1/tasks/:id/status` | `TaskStatusesController.update` | Cambiar el estado |
| PUT | `/api/v1/tasks/:id/due-date` | `TaskDueDatesController.update` | Fijar o retirar la fecha |

Las respuestas llevan el envoltorio `{ data: ... }` y los errores `{ errors: [...] }`.

## Reglas de negocio: dónde mirar

Cada fila nombra un requisito de la [spec](../../../openspec/specs/tasks/spec.md) y el sitio del código que lo implementa. El texto de la regla está solo en la spec.

| Requisito de la spec | Dónde vive en el código |
|---|---|
| Creación con solo el título; Ninguna tarea sin título; título demasiado largo | `createTaskValidator` en `backend/app/validators/task.ts`; `TasksController.store` |
| Una sola lista compartida; Acotar la lista por estado | `TasksController.index`; `DEFAULT_LIST_STATUSES` en `backend/app/models/task.ts` |
| Tres estados fijos; Cambio de estado | `TASK_STATUSES` en el modelo; `updateTaskStatusValidator`; `TaskStatusesController` |
| Lo que cada tarea muestra de su responsable | `TaskAssigneeTransformer`; relación `assignee` en el modelo |
| Cuándo una tarea está vencida | `Task.isOverdueOn()` en el modelo (única definición) |
| El día de referencia lo pone quien mira | `taskReferenceDayValidator` y `setTaskDueDateValidator` |
| La lista no lleva el vencimiento | `TaskTransformer` (lista) frente a `TaskDetailTransformer` (suelta) |
| Las tareas exigen sesión | `middleware.auth()` en el grupo de `tasks` de `start/routes.ts` |
| Requisitos de interfaz (lista, filtro, pantalla de tarea) | `frontend/src/pages/tasks-page.tsx`, `task-page.tsx`, `components/task-filter.tsx`, `components/task-item.tsx`; llamadas en `frontend/src/lib/api.ts` |

Datos: tabla `tasks` (migraciones `create_tasks_table` y `add_due_date_to_tasks_table`); el esquema de `database/schema.ts` se regenera, no se edita.

## Cómo probarla en local

Los comandos se ejecutan desde `backend/` o `frontend/`, no desde la raíz.

```bash
# Backend (primera vez)
cd backend
npm install
cp .env.example .env && node ace generate:key
node ace migration:run
npm run dev            # http://localhost:3333

# Frontend, en otra terminal
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Prueba manual por API (necesita una cuenta: regístrala con `POST /api/v1/auth/signup`):

```bash
TOKEN=$(curl -s localhost:3333/api/v1/auth/login -H 'content-type: application/json' \
  -d '{"email":"tu@email.com","password":"tu-clave"}' | jq -r .data.token)

curl -s localhost:3333/api/v1/tasks -H "Authorization: Bearer $TOKEN"
curl -s localhost:3333/api/v1/tasks -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"title":"Revisar el informe"}'
curl -s "localhost:3333/api/v1/tasks/1?today=2026-10-10" -H "Authorization: Bearer $TOKEN"
```

Tests automáticos (Japa, desde `backend/`):

```bash
npm test
node ace test --files=assignee
```

Hoy solo hay un fichero de tests de esta capability, `backend/tests/functional/tasks/assignee.spec.ts` (el responsable de la tarea). El resto de requisitos de la spec no tienen tests y se verifican a mano.

**Cuidado con la base de datos:** los tests usan el mismo fichero SQLite que el servidor de desarrollo (`backend/tmp/db.sqlite3`). El test existente aísla con `testUtils.db().withGlobalTransaction()`; haz lo mismo en los que añadas. El frontend no tiene runner de tests: se comprueba con `npm run build` (typecheck) y `npm run lint`.

## Diferencias conocidas

Al escribir este README, spec y código discrepan en dos puntos (comprobados en `backend/app/validators/task.ts` y los transformers):

- La spec exige `422` para un `status` inexistente en `GET /api/v1/tasks`; `listTasksValidator` acepta cualquier cadena y devuelve `200` con lista vacía.
- La spec habla del «nombre» del responsable; la API lo devuelve como `fullName`.
