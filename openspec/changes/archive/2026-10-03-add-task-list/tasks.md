# Tasks

> Sin tests por decisión del change: ninguna tarea los crea ni monta runner. Cada verificación usa `npm run typecheck`, `npm run lint`, `npm run build`, la API con `curl` o la pantalla. Los comandos de backend se ejecutan desde `backend/` y los de frontend desde `frontend/`.

## 1. Preparación

- [ ] 1.1 Crear la rama `feat/add-task-list` desde la rama de trabajo antes de tocar código (regla del CLAUDE.md) y verificar con `git branch --show-current`
- [x] 1.2 Añadir `MAX_TITLE_LENGTH` con `node ace env:add` (tipo número, con un valor de muestra) y verificar que aparece en `.env`, `.env.example` y en el esquema de `start/env.ts`, y que `node ace list:routes` sigue arrancando
- [x] 1.3 Crear `config/tasks.ts` exportando `maxTitleLength` desde `env.get('MAX_TITLE_LENGTH')` y verificar con `npm run typecheck`

## 2. Backend: datos y estados

- [x] 2.1 Crear la migración de `tasks` (`title` text no nulo, `status` string no nulo con defecto `pending`, `assignee_id` FK no nula a `users.id`, `created_at`/`updated_at`), sin ninguna columna de fecha de vencimiento, y verificar con `node ace migration:run` que se aplica y `database/schema.ts` se regenera con `TaskSchema`
- [x] 2.2 Crear `app/models/task_status.ts` con `TASK_STATUSES = ['pending', 'in_progress', 'done'] as const` y su tipo, y verificar con `npm run typecheck`
- [x] 2.3 Crear `app/models/task.ts` extendiendo `TaskSchema` con solo la relación `belongsTo` `assignee` hacia `User`, y verificar con `npm run typecheck`

## 3. Backend: API de tareas

- [x] 3.1 Crear `app/validators/task.ts` con `createTaskValidator` (`title`: `trim`, `minLength(1)`, `maxLength` desde `config/tasks.ts`) y `updateTaskStatusValidator` (`status`: `vine.enum(TASK_STATUSES)`), y verificar con `npm run typecheck`
- [x] 3.2 Crear `app/transformers/task_transformer.ts` que devuelva `id`, `title`, `status` y `assignee: { fullName }` (sin reutilizar `UserTransformer`, sin email, sin id del responsable, sin fechas), y verificar con `npm run typecheck`
- [x] 3.3 Crear `app/controllers/tasks_controller.ts` con `index` (precarga `assignee`, sin `orderBy`, con comentario que remite a PA-3), `store` (estado `pending` y responsable el usuario autenticado, ignorando lo demás del cuerpo) y `update` (`findOrFail`, solo cambia `status`), todos con `serialize`, y verificar con `npm run typecheck`
- [x] 3.4 Registrar en `start/routes.ts`, dentro del grupo autenticado de `/api/v1`, solo `GET /tasks`, `POST /tasks` y `PATCH /tasks/:id` (sin `router.resource`), y verificar con `node ace list:routes` que existen exactamente esas tres y ninguna `show` ni `destroy`; commitear el diff regenerado de `.adonisjs/`
- [x] 3.5 Verificar la API con `curl` contra `npm run dev`: sin token los tres endpoints dan 401; con token, `POST` con solo `title` devuelve la tarea `pending` a nombre del usuario; `POST` con título vacío, solo espacios y de `MAX_TITLE_LENGTH + 1` caracteres dan 422; `POST` con `status`/`assigneeId` en el cuerpo los ignora; `PATCH` con `pending`, `in_progress` y `done` funciona entre cualesquiera estados, con `pendiente` da 422 y con id inexistente da 404; `GET` devuelve el responsable solo con `fullName`; `GET /tasks/1` y `DELETE /tasks/1` no son operaciones disponibles
- [x] 3.6 Ejecutar `npm run lint` y `npm run typecheck` en `backend/` y verificar que pasan sin errores nuevos

## 4. Frontend: cliente de API y tipos

- [x] 4.1 En `lib/types.ts` añadir `TaskStatus` (`'pending' | 'in_progress' | 'done'`), `TASK_STATUS_LABELS` (Pendiente, En curso, Hecho) y el tipo `Task` (`id`, `title`, `status`, `assignee: { fullName: string | null }`, sin fechas), y verificar con `npm run build`
- [x] 4.2 En `lib/api.ts` admitir `PATCH` en `request`; añadir `listTasks`, `createTask` y `updateTaskStatus`; añadir `title` a `FIELD_LABELS`; y en `translate` hacer que para `title` `required`/`minLength` den "Falta rellenar el título." y `maxLength` dé "El título no puede superar los N caracteres." con `meta.max`; verificar con `npm run build`

## 5. Frontend: página de tareas

- [x] 5.1 Crear `pages/tasks-page.tsx` con la carga de la lista al montar (`FullScreenLoader` y `Alert` de error), el formulario de un único campo de título con `useAuthForm(['title'])` y el botón "Añadir", reutilizando `Card`, `Input`, `Label`, `Button` y `Alert`; verificar con `npm run dev` que crear con título añade la fila sin recargar y vacía el campo
- [x] 5.2 Pintar cada fila con título, `assignee.fullName ?? 'Sin nombre'` y un grupo de tres `Button` (`xs`, `aria-pressed`) para Pendiente, En curso y Hecho, sin ninguna fecha ni marca de vencida y sin ordenar en el cliente; verificar en pantalla que un responsable sin nombre se ve como "Sin nombre" y nunca aparece email ni id
- [x] 5.3 Implementar el cambio de estado optimista (actualiza al pulsar, deshabilita los botones de esa fila mientras dura la petición, restaura el estado y muestra `Alert` si falla, sin petición si se elige el estado actual); verificar en pantalla cambiando el estado de una tarea de otra persona y, con el backend parado, que la fila vuelve atrás y avisa
- [x] 5.4 Implementar el estado vacío (texto que explica qué es la lista y remite al formulario para crear la primera, sin lista vacía a secas); verificar con la base sin tareas y que desaparece al crear la primera
- [ ] 5.5 Verificar los errores del formulario en pantalla: título vacío y solo espacios muestran "Falta rellenar el título." bajo el campo, y uno de `MAX_TITLE_LENGTH + 1` muestra el aviso de longitud sin crear la tarea

## 6. Frontend: rutas y aterrizaje

- [x] 6.1 Añadir la prop `to` (por defecto `/profile`) a `routes/public-only-route.tsx`, y en `routes/app-routes.tsx` registrar `/tasks` bajo `ProtectedRoute` y separar `/login` (`to="/tasks"`) y `/register` (`to="/profile"`) en guards distintos; verificar con `npm run build`
- [x] 6.2 Añadir en `pages/profile-page.tsx` un `Button asChild` con `Link` a `/tasks` ("Ver las tareas del equipo"); verificar en pantalla que desde el perfil se llega a la lista
- [ ] 6.3 Verificar el recorrido completo en pantalla: iniciar sesión lleva a `/tasks`; registrarse lleva a `/profile` y de ahí a la lista; con sesión, `/login` lleva a `/tasks` y `/register` a `/profile`; sin sesión, `/tasks` lleva a `/login`; recargar `/tasks` con sesión muestra el cargador y luego la lista; una dirección desconocida sigue llevando a `/profile`
- [x] 6.4 Ejecutar `npm run lint` y `npm run build` en `frontend/` y verificar que pasan sin errores nuevos

## 7. Cierre

- [ ] 7.1 Verificar con dos cuentas distintas en dos navegadores que ven la misma lista, que lo creado por una aparece a la otra, que cada tarea nueva nace `Pendiente` y a nombre de su creadora, y que un cambio de estado de una se ve en la otra al recargar
- [ ] 7.2 Comprobar con `git diff --stat` que el change no añade dependencias, componentes en `components/ui/`, ficheros de test, columnas ni campos de fecha de vencimiento
- [ ] 7.3 Cerrar según el CLAUDE.md: usar `/commit`, abrir el PR con `gh pr create` con la descripción completa de los cambios, pasar el subagente `adversarial-reviewer` sobre el PR y responder solo con la URL del PR
