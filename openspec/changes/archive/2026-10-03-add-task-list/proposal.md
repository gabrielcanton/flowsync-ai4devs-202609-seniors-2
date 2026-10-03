# Proposal

## Why

FlowSync tiene hoy cuentas y acceso, pero ninguna tarea: no hay nada que el equipo pueda mirar para saber en qué anda cada uno. Este change da de alta la capability de tareas con el mínimo que hace útil el producto: una lista única y compartida, crear una tarea con solo el título y mantener su estado al día con un gesto desde la propia fila. Cubre cinco historias del backlog (E3-1, E2-1, E2-2, E2-3, E2-4), de las que la lista compartida es el sustrato de las demás.

## What Changes

- **Backend (AdonisJS)**: tabla, modelo, validadores y transformer de `Task`, y tres operaciones autenticadas bajo `/api/v1/tasks`: listar todas, crear y actualizar el estado. No hay lectura individual, borrado ni endpoints de equipo.
- **Estados**: conjunto cerrado `pending`, `in_progress`, `done` como identificadores de API; en pantalla, "Pendiente", "En curso" y "Hecho". Cualquier otro valor se rechaza con 422.
- **Creación**: el título es lo único que se pide. La tarea nace en `pending` y con quien la crea como responsable. El título se recorta de espacios; uno vacío o en blanco se rechaza; uno que supera el límite `MAX_TITLE_LENGTH` se rechaza con aviso, nunca se guarda recortado.
- **Lista**: una sola lista idéntica para todas las personas con sesión, con título, responsable (por nombre; "Sin nombre" si no lo tiene) y estado en cada fila. Sin fechas, sin marcas de vencida, sin presencia. Estado vacío que explica qué es y ofrece crear la primera.
- **Cambio de estado**: desde la fila, con un gesto y sin confirmación, sobre cualquier tarea sea de quien sea. Se admite cualquier transición entre los tres estados.
- **Frontend (React 19)**: nueva página `/tasks` protegida, con el patrón de páginas y rutas del login y los componentes que ya hay en `components/ui/`. Sin dependencias nuevas.
- **Cambio en el acceso**: tras iniciar sesión se aterriza en la lista de tareas (antes, en el perfil). Registrarse sigue llevando al perfil, que gana un enlace a la lista.
- **BREAKING (comportamiento observable)**: el destino tras el login y de `/login` con sesión activa pasa de `/profile` a `/tasks`.

### Fuera de alcance (restricciones del change)

- Fecha de vencimiento: no se añade ni se deja preparada (ni columna, ni campo, ni marca en la lista).
- Tests: este change no monta base de pruebas ni los escribe.
- Reasignar responsable, editar título, borrar, filtrar, abrir el detalle y refresco automático (`E3-2`) son historias distintas.

### Puntos abiertos

- **Orden de la lista (PA-3).** No hay regla de orden decidida. No se ordena explícitamente: la API devuelve las tareas sin `ORDER BY` y el frontend las pinta en el orden recibido, sin inventar criterio. Ese orden no es una garantía de producto y puede cambiar. Tampoco se agrupa por persona, así que CA-5 de E3-1 ("enumerar el trabajo de cada persona") no queda garantizada con volumen.
- **Límite del título (PA-9).** El valor concreto de `MAX_TITLE_LENGTH` no se decide aquí: se lee de un fichero de configuración.
- **Transiciones y vuelta atrás desde "Hecho" (PA-7).** Sin grafo decidido, se permite cualquier destino desde cualquier estado.
- **Tareas "En curso" por persona (PA-4)** y **tarea que cambia de manos bajo los pies (PA-8)**: sin tratar.

### Supuestos registrados

- Abrir `/login` con sesión activa lleva a la lista; abrir `/register` con sesión activa sigue llevando al perfil. Las direcciones desconocidas siguen llevando al perfil.
- El endpoint de actualización acepta solo el estado; cualquier otro campo se ignora (reasignar queda para `us-reasignar-responsable`).
- Cualquier persona con sesión puede actualizar cualquier tarea; no hay roles.

## Capabilities

### New Capabilities
- `tasks`: lista única y compartida de tareas del equipo, creación con solo título (obligatorio) que nace pendiente y a nombre de quien la crea, y cambio de estado entre los tres estados fijos desde la propia lista.

### Modified Capabilities
- `auth`: el inicio de sesión aterriza en la lista de tareas en lugar de en el perfil, y `/login` con sesión activa lleva a la lista. El registro y el resto de redirecciones no cambian.

## Impact

- **Backend**: nueva migración (`tasks`), `app/models/task.ts`, `app/validators/task.ts`, `app/transformers/task_transformer.ts`, `app/controllers/tasks_controller.ts`, rutas en `start/routes.ts`, `config/tasks.ts` y variable de entorno `MAX_TITLE_LENGTH` (`node ace env:add`). `database/schema.ts` y `.adonisjs/` se regeneran y se commitean.
- **Frontend**: `lib/api.ts`, `lib/types.ts`, `routes/app-routes.tsx`, `routes/public-only-route.tsx`, `pages/profile-page.tsx`, y nuevas `pages/tasks-page.tsx` y componentes de tarea.
- **API**: tres endpoints nuevos; el cliente expone del responsable solo su nombre.
- **Dependencias**: ninguna.
