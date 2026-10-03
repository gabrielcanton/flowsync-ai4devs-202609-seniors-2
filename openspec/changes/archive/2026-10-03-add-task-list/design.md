# Design

## Context

Ver `proposal.md` para el motivo y el alcance. Estado actual relevante:

- Backend: AdonisJS 7 + Lucid 22 + SQLite. El esquema de modelos **se genera** desde las migraciones (`database/schema.ts`, no se edita); los modelos solo añaden relaciones y lógica. Todas las respuestas pasan por `serialize()` con un transformer, y las rutas viven bajo `/api/v1` con `.use(middleware.auth())` en el grupo protegido. Los controladores se referencian vía `#generated/controllers`.
- Frontend: `lib/api.ts` es el único punto de contacto con el backend (traduce errores de VineJS a castellano con `ApiError.fieldErrors`); `auth/` gestiona la sesión; `routes/` tiene `ProtectedRoute` y `PublicOnlyRoute`. En `components/ui/` solo existen `alert`, `button`, `card`, `input` y `label`.
- El login y el registro llegan hoy a `/profile` porque `PublicOnlyRoute` rebota a toda persona autenticada a esa ruta.
- No existe ninguna tabla ni código de tareas. No hay runner de tests y este change no lo añade.

## Goals / Non-Goals

**Goals:**
- Tres operaciones autenticadas (listar, crear, actualizar estado) y una página `/tasks` que las usa.
- Exponer del responsable solo su nombre.
- Que el límite del título sea un parámetro de configuración y no un literal repetido en backend y frontend.

**Non-Goals:**
- Fecha de vencimiento en cualquier capa (columna, campo, transformer, tipo del frontend).
- Ordenación, agrupación, paginación, filtros o refresco automático.
- Componentes de UI nuevos (`select`, `badge`, `dialog`…), `npx shadcn add` o dependencias.
- Tests de cualquier tipo.

## Decisions

### D1. Modelo de datos: `tasks(id, title, status, assignee_id, created_at, updated_at)`

Una migración nueva crea `tasks` con `title` como `text` (no `string(255)`), `status` como `string` no nulo con valor por defecto `pending`, y `assignee_id` como clave foránea no nula a `users.id`. `created_at`/`updated_at` siguen la convención del proyecto (como `users`), pero **no se exponen** en el transformer ni en los tipos del frontend. El modelo `Task` extiende `TaskSchema` generado y declara solo la relación `belongsTo` hacia `User` como `assignee`.

- **Por qué `text`**: el límite del título es configurable; acoplar la columna a un `varchar(N)` obligaría a una migración cada vez que cambie y en SQLite no se aplica de todos modos. El límite se hace cumplir en el validador.
- **Por qué `assignee_id` y no `creator_id`**: ningún requisito pide recordar quién creó la tarea, y "responsable" es lo que se muestra. Añadir `creator_id` sería dejar preparado algo que no se pide.
- **Alternativa descartada**: guardar el estado como entero o como tabla de estados. Contradice que el conjunto sea cerrado y que viaje como `pending|in_progress|done`.

### D2. Estados: una constante, usada por validador y frontend sin duplicar

`app/models/task_status.ts` exporta `TASK_STATUSES = ['pending', 'in_progress', 'done'] as const`. El validador de actualización usa `vine.enum(TASK_STATUSES)`, que rechaza cualquier otro valor con 422. En el frontend, `lib/types.ts` declara el tipo `TaskStatus` con los mismos tres literales y un mapa `TASK_STATUS_LABELS` (`Pendiente`, `En curso`, `Hecho`). Los valores en castellano nunca son identificadores.

- **Alternativa descartada**: generar el tipo del frontend desde el registro Tuyau de `.adonisjs/client/registry/`. Es más fino, pero el frontend hoy no lo consume y adoptarlo es otro change; se mantiene el espejo manual que ya usa `lib/types.ts` con `User`.

### D3. API: tres rutas, un controlador, sin lectura individual

En `start/routes.ts`, dentro del grupo `/api/v1` y con `middleware.auth()`:

| Método | Ruta | Acción |
|---|---|---|
| GET | `/api/v1/tasks` | `TasksController.index` |
| POST | `/api/v1/tasks` | `TasksController.store` |
| PATCH | `/api/v1/tasks/:id` | `TasksController.update` |

Se registran las tres a mano (no `router.resource`, que crearía `show` y `destroy`). Sin `show`, sin `destroy`, sin rutas de equipo.

- `index`: `Task.query().preload('assignee')` **sin `orderBy`**, serializado con `TaskTransformer`. La falta de orden es deliberada (proposal, punto abierto PA-3); queda un comentario breve en el controlador para que nadie "arregle" la omisión.
- `store`: valida `{ title }` con `createTaskValidator`; crea con `status: 'pending'` y `assigneeId: auth.user.id`. El validador solo declara `title`, así que `status` y `assigneeId` del cuerpo se descartan (VineJS elimina las claves no declaradas). Responde con la tarea creada, con su responsable precargado.
- `update`: `Task.findOrFail(params.id)` (404 si no existe), valida `{ status }` con `updateTaskStatusValidator` y guarda solo ese campo; título y responsable del cuerpo se descartan igual que arriba. Cualquier persona autenticada puede actualizar cualquier tarea: no hay comprobación de propiedad.
- Todas las respuestas usan `serialize(TaskTransformer.transform(...))`.

### D4. El responsable sale como `assignee: { fullName }`, nada más

`TaskTransformer.toObject()` devuelve `id`, `title`, `status` y `assignee: { fullName: string | null }`. **No reutiliza `UserTransformer`**, que incluye email, `createdAt` e `initials`; el responsable se proyecta con un transformer propio de una sola propiedad (o un `pick` de `fullName`). Una vez que el cliente consume un campo, ya no se puede recortar sin romperlo (nota de E3-1), así que se parte del mínimo. El `id` de la tarea sí sale (hace falta para el PATCH); el `id` del responsable, no. El frontend pinta `assignee.fullName ?? 'Sin nombre'`.

### D5. Título: validador con recorte, longitud mínima 1 y máximo configurable

```
title: vine.string().trim().minLength(1).maxLength(config.maxTitleLength)
```

- `trim()` antes de las longitudes hace que "   " cuente como vacío (minLength) y que el máximo se mida sin espacios de los extremos. Un campo ausente o vacío (el bodyparser convierte `""` en `null`) cae en `required`.
- Un título largo devuelve 422 `maxLength`; **nunca se trunca**.
- **Límite configurable (`MAX_TITLE_LENGTH`)**: variable de entorno de tipo número, añadida con `node ace env:add` (que actualiza `.env`, `.env.example` y el esquema de `start/env.ts`), leída en un nuevo `config/tasks.ts` (`{ maxTitleLength }`) y consumida por el validador. El valor concreto lo aporta ese fichero de configuración y no se decide en este change. `.env.example` lleva un valor de muestra solo para que el arranque funcione.
- **El frontend no conoce el número**: el mensaje se construye con `meta.max` del propio error 422 (ya lo hace `translate` en `lib/api.ts`). Así hay una única fuente de verdad y no se duplica el límite.
- **Alternativa descartada**: constante literal en el validador. Contradice la instrucción de que el valor llegue por fichero de configuración.

### D6. Frontend: `lib/api.ts` crece con tres funciones y tres retoques de traducción

- `request` admite el método `PATCH`.
- Nuevas funciones `listTasks(token)`, `createTask(token, { title })` y `updateTaskStatus(token, id, status)`, todas desenvolviendo `{ data }`.
- `FIELD_LABELS` añade `title: 'el título'`.
- En `translate`, para `field === 'title'`: `required` y `minLength` producen "Falta rellenar el título."; `maxLength` produce "El título no puede superar los N caracteres." (con `meta.max`). Sin este caso, `minLength` diría "el título debe tener al menos 1 caracteres".
- `toApiError` ya traduce 401 a "Tu sesión ha caducado…", y cualquier otro estado (incluido 404) al mensaje genérico de servidor; se reutiliza sin cambios.

### D7. Frontend: página `/tasks` con el patrón del login

- Ruta `/tasks` dentro de `<ProtectedRoute>` en `routes/app-routes.tsx`.
- `pages/tasks-page.tsx` reúne la lista y el formulario, usando `Card`, `Input`, `Label`, `Button` y `Alert` existentes, el mismo marco visual (`bg-muted/40`, tarjeta centrada) y `FullScreenLoader` mientras carga. El estado de carga/error de la lista es local a la página (`useState` + `useEffect`), igual que `AuthProvider`; no se introduce librería de datos.
- **Formulario de creación**: un único `Input` de título y un botón "Añadir". Reutiliza `useAuthForm(['title'])` para el estado de envío y el reparto de errores (campo vs. aviso general), con la misma marca `aria-invalid`/`FieldError`. Al crear, la tarea devuelta se añade a la lista en memoria y el campo se vacía; sin recarga.
- **Estado vacío**: si la lista llega sin tareas, se muestra un texto que explica qué es la lista y que el formulario de arriba sirve para crear la primera. El formulario está siempre visible, así que la invitación apunta a él (sin lista vacía "a secas").
- **Fila de tarea**: título, `assignee.fullName ?? 'Sin nombre'` y un **grupo de tres `Button`** (`size="xs"`, `variant="default"` el activo, `outline` los demás, `aria-pressed`) con "Pendiente", "En curso", "Hecho". Un clic = un cambio, sin diálogo ni confirmación, y los únicos destinos son los tres. No se renderiza ninguna fecha ni marca de vencida.
- **Cambio de estado optimista**: al pulsar, se actualiza la fila de inmediato y se lanza el PATCH; si falla, se restaura el estado anterior y se muestra un `Alert` con el mensaje del `ApiError`. Elegir el estado actual no dispara petición.
- **Orden**: la lista se pinta en el orden en que llega; no hay `sort` en el cliente.
- **Alternativa descartada**: un `<select>` nativo por fila. Cuesta dos interacciones (abrir y elegir) frente a una, y el estilo propio de shadcn `select` exigiría un componente nuevo. Tampoco un `Select` de shadcn: se prohíbe un componente nuevo.

### D8. Navegación tras login y registro

`PublicOnlyRoute` recibe una prop `to` (por defecto `/profile`). En `app-routes.tsx` se envuelven `/login` y `/register` en guards distintos: `/login` con `to="/tasks"` y `/register` con `to="/profile"`. Con esto, al iniciar sesión el guard redirige a `/tasks` por sí mismo (si el login navegase a mano, el guard ganaría la carrera al cambiar el estado a autenticado). El registro conserva su comportamiento. `pages/profile-page.tsx` añade un `Button` con `asChild` y un `Link` a `/tasks` ("Ver las tareas del equipo"). El comodín `*` sigue llevando a `/profile`.

## Risks / Trade-offs

- **Lista sin orden** → El orden real será el de inserción en SQLite, sin garantía. Aceptado y declarado como punto abierto PA-3; en cuanto se decida, se añade `orderBy` en un solo sitio (`index`).
- **Sin regla de transiciones y sin confirmación** → Marcar "Hecho" por error es un clic y deshacerlo es otro clic. Es lo que piden las historias (PA-7 abierto); no se compensa con confirmaciones, que contradicen CA-1 de E2-4.
- **Cualquier persona cambia cualquier tarea** → Sin roles ni propiedad por diseño; el riesgo es de producto, no técnico.
- **Último gana en cambios simultáneos** → Dos personas cambiando la misma tarea a la vez dejan el último estado; sin refresco automático (E3-2) una vista puede quedar desfasada hasta recargar. Aceptado en este alcance.
- **Optimismo + fallo** → Si el PATCH falla, la fila vuelve atrás y se avisa; si dos cambios rápidos de la misma fila se solapan, una respuesta tardía podría pisar la otra. Mitigación: deshabilitar los botones de esa fila mientras su petición está en vuelo.
- **Sesión caducada durante el uso** → Un 401 en una llamada de tareas muestra el mensaje de sesión caducada pero no cierra la sesión local; el siguiente refresco la limpia. Aceptable ahora; unificarlo sería otro change.
- **Cambio de aterrizaje del login** → Rompe el escenario "login lleva al perfil" de `auth`; queda reflejado en el delta MODIFIED.
- **Sin tests** → Por instrucción. La verificación de cada tarea es con typecheck, lint, build y comprobación manual contra la API y la pantalla.

## Migration Plan

1. Ejecutar `node ace migration:run`: crea `tasks` y regenera `database/schema.ts`; commitear el diff generado, junto con `.adonisjs/`.
2. Añadir `MAX_TITLE_LENGTH` a `.env` local (el comando `env:add` lo hace) antes de arrancar; sin ella la validación del entorno falla al bootear.
3. Despliegue: backend primero (rutas nuevas, sin romper nada existente), después frontend.
4. Rollback: `node ace migration:rollback` elimina `tasks`; revertir el frontend devuelve el aterrizaje del login al perfil. No hay datos previos que migrar.
