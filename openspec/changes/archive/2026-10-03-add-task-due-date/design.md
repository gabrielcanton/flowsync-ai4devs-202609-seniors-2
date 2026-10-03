# Design

## Context

Ver `proposal.md` para el motivo y el alcance. Estado actual relevante, ya implementado por `add-task-list`:

- `tasks(id, title, status, assignee_id, created_at, updated_at)`; el modelo `Task` extiende `TaskSchema` (generado, no se edita) y solo declara la relación `assignee`.
- `TasksController` con `index`, `store` y `update`; `TaskTransformer` devuelve `id`, `title`, `status` y `assignee: { fullName }`; `updateTaskStatusValidator` exige `status`.
- `BaseTransformer.transform(data, ...rest)` admite argumentos extra tras el recurso, que llegan al constructor del transformer: es el cauce para pasarle el día de referencia sin tocar el modelo.
- `PATCH /tasks/:id` ignora hoy cualquier campo que no sea `status` porque VineJS descarta las claves no declaradas.
- Frontend: `lib/api.ts` es el único punto de contacto con el backend; la lista (`tasks-page.tsx`, `task-item.tsx`) pinta título, responsable y estado.
- No hay tests ni runner, y este change no los añade.

## Goals / Non-Goals

**Goals:**
- Una única implementación de la regla de vencimiento, en el servidor, evaluable contra un día dado.
- Que el día de quien mira llegue al servidor sin que el cliente decida el veredicto.
- La superficie mínima de API que "abrir la tarea" necesita.

**Non-Goals:**
- Pantalla de detalle, editor de fecha, señal visual de vencida o cualquier cambio visible en la lista.
- Persistir `isOverdue`, jobs nocturnos o cualquier proceso que marque tareas.
- Ordenar o filtrar por fecha, notificaciones, recordatorios, recurrencia.
- Extender la lectura individual más allá de lo que la historia pide.

## Decisions

### D1. Columna `due_date` nullable, de tipo fecha (sin hora)

Una migración nueva añade `due_date` a `tasks` con `table.date('due_date').nullable()`. Las filas existentes quedan en `NULL`, es decir, sin fecha y nunca vencidas; el `down()` elimina la columna. No se añade ninguna columna `is_overdue`.

- **Por qué `date` y no `timestamp`**: la fecha es de calendario, sin hora. Un `timestamp` arrastraría un huso y reabriría la ambigüedad "¿hoy a qué hora?".
- **Riesgo conocido**: el generador de esquema de Lucid puede mapear `date` a `DateTime` (luxon), que convierte a un instante con huso y puede correr el día al serializar. Para que la fecha viaje y se compare como el literal `YYYY-MM-DD`, se fuerza el tipo `string` con una regla en `database/schema_rules.ts` (el mecanismo previsto para personalizar la generación). Si al aplicar la migración el esquema generado ya da un `string`, la regla no hace falta. Se comprueba al regenerar `database/schema.ts`, que no se edita a mano.
- **Alternativa descartada**: guardar `due_date` como texto libre. Pierde la garantía de formato en base de datos y no gana nada.

### D2. La regla de vencimiento vive en `Task`, evaluada contra un día dado

`Task` gana un único método de dominio, `isOverdueOn(today: string): boolean`, que devuelve verdadero solo si `dueDate !== null`, `dueDate < today` y `status !== 'done'`. Comparar dos cadenas `YYYY-MM-DD` es correcto lexicográficamente y evita construir fechas con huso, que es donde nace el error de "el día de más" (la fecha de hoy no es anterior a hoy). El método no lee el reloj: recibe el día, así que el mismo código sirve para dos personas con días distintos y para la lectura del día siguiente sin que nadie toque la tarea.

Nada más calcula el veredicto: ni el controlador, ni el transformer (solo llama al método), ni el frontend.

### D3. `isOverdue` y `dueDate` salen en toda representación de tarea

`TaskTransformer` pasa a recibir el día de referencia: `constructor(resource, today)`, usado como `TaskTransformer.transform(task, today)` o con la colección. `toObject()` añade `dueDate` (`string | null`) e `isOverdue: this.resource.isOverdueOn(today)`. Como el transformer es único, listar, leer, crear y actualizar devuelven los dos campos con la misma regla. `isOverdue` se calcula en cada lectura y no se persiste.

**El cliente no puede enviarlo**: ni `createTaskValidator` ni `updateTaskValidator` lo declaran, y VineJS descarta las claves no declaradas, igual que ya ocurre con `status` y `assigneeId` al crear.

### D4. El día de quien mira llega por `?today=YYYY-MM-DD`, opcional

Un validador de query compartido (`todayValidator`) acepta `today` como fecha de calendario opcional. Todas las acciones del controlador (`index`, `show`, `store`, `update`) lo leen con `request.validateUsing(todayValidator, { data: request.qs() })` o equivalente, y lo pasan al transformer. Si falta, se usa el día UTC del servidor; si es inválido, 422 con `field: 'today'`.

- **Por qué query y no cabecera**: es visible en la URL y en los registros, no necesita configuración CORS adicional para cabeceras personalizadas y se prueba con un `curl` directo. La petición es la misma sea cual sea el método.
- **Por qué opcional**: no rompe a ningún cliente actual; el frontend lo envía siempre, así que el comportamiento por defecto solo lo ve quien consuma la API sin él (punto abierto en el proposal).
- **Alternativa descartada: cabecera `X-Client-Date`.** Equivalente, pero menos descubrible y con preflight CORS innecesario para un valor que no es sensible.
- **Alternativa descartada: obligatorio.** Daría un veredicto que nunca depende del reloj del servidor, pero rompería la lista actual hasta que se despliegue el frontend nuevo; se prefiere desplegar en cualquier orden.
- **Alternativa descartada: que el cliente envíe su huso (IANA) y el servidor calcule el día.** Mueve la decisión del día al servidor con una tabla de husos; la restricción de este change deja claro que basta con que el cliente mande su día.

### D5. Validación de la fecha: un builder compartido de fecha de calendario

`app/validators/calendar_date.ts` exporta un builder `calendarDate()` que acepta una cadena `YYYY-MM-DD` y exige que sea un día real (el 30 de febrero falla), reutilizado por `today` y por `dueDate`, igual que el proyecto ya comparte `email()` y `password()`. La comprobación de "día real" usa la utilidad de fechas que ya trae el proyecto (luxon, con `DateTime.fromISO(..., { zone: 'utc' }).isValid`), sin dependencias nuevas. Un error cae en el 422 estándar del proyecto señalando el campo.

`dueDate` se declara `calendarDate().nullable().optional()`, de modo que se distinguen tres casos: clave ausente (no se toca), `null` o cadena vacía (se quita; el body parser ya convierte `""` en `null`) y valor (se pone). Aceptar una fecha pasada no requiere ninguna regla: simplemente no se valida contra hoy.

### D6. Creación y actualización

- `createTaskValidator` gana `dueDate` opcional. `store` lo guarda si viene; si no, la tarea queda sin fecha. Sigue sin aceptar `status`, `assigneeId` ni `isOverdue`.
- `updateTaskStatusValidator` se sustituye por `updateTaskValidator` con `status` y `dueDate`, ambos opcionales, y la regla de que **al menos uno** debe venir. La regla se expresa en el validador (por ejemplo con `requiredIfMissing` cruzado), cuidando que `dueDate: null` cuente como "presente"; si VineJS no lo permite sin ambigüedad, se hace una comprobación explícita en el controlador que lance el mismo error de validación. Se verifica con `curl` (cuerpo `{}` → 422, `{ "dueDate": null }` → 200).
- `update` aplica solo los campos presentes: `if (status !== undefined) task.status = status` y `if (dueDate !== undefined) task.dueDate = dueDate`. Título y responsable siguen sin poder cambiarse.

### D7. Lectura individual: `GET /api/v1/tasks/:id`

Se añade `show` a `TasksController` y la ruta en el grupo autenticado. Es una decisión de este change: la historia dice "al abrir la tarea", ese endpoint no existía (el change anterior lo excluyó expresamente) y es la superficie mínima para poder ver la fecha y el veredicto de una tarea concreta. Devuelve la misma representación que el resto (`TaskTransformer`), precargando el responsable, con 404 si no existe y sin comprobar propiedad.

**Punto abierto**: cuando llegue la pantalla de detalle, habrá que decidir si esta lectura basta o debe crecer (más datos de la tarea). No se anticipa nada. Y queda superada la restricción "solo listar, crear y actualizar" de `add-task-list`: la spec pasa a "solo listar, leer, crear y actualizar" (requisito renombrado en el delta). Borrado y operaciones de equipo siguen sin existir.

### D8. Frontend: solo la capa de acceso a la API

- `lib/types.ts`: `Task` gana `dueDate: string | null` e `isOverdue: boolean`; se añade el tipo de la actualización parcial.
- `lib/api.ts`:
  - Función `localToday()` que devuelve el día **local** en `YYYY-MM-DD` construido con `getFullYear/getMonth/getDate` (no con `toISOString`, que es UTC y reintroduciría el desfase de huso).
  - `listTasks`, `createTask` y `updateTaskStatus` añaden `?today=<localToday()>`, de modo que `isOverdue` ya llega calculado contra el día de la persona.
  - Nuevas `getTask(token, id)` y `updateTaskDueDate(token, id, dueDate | null)` (enviando `null` para quitar). Sin consumidores todavía: preparan el detalle sin construirlo.
  - `FIELD_LABELS` añade `dueDate` y `translate` da un mensaje en castellano para una fecha inválida, por si algún cliente la muestra; reutiliza el mecanismo de errores por campo existente.
- `tasks-page.tsx` y `task-item.tsx` **no se tocan**: ignoran `dueDate` e `isOverdue` y la lista no muestra fechas ni marcas.

## Risks / Trade-offs

- **El día de más (CA-5)** → La regla compara cadenas con `<` estricto y nunca parsea una fecha con huso, así que hoy no es anterior a hoy. Se verifica con `curl` los tres bordes: ayer, hoy y mañana.
- **Huso del servidor frente al del cliente** → Si el cliente no manda `today`, el veredicto usa UTC y puede diferir del día de la persona. Mitigación: el frontend lo manda siempre; queda anotado como punto abierto.
- **`localToday()` cruzando la medianoche con la página abierta** → El día se calcula en cada llamada, no al cargar, así que la siguiente lectura ya usa el día nuevo. La lista no se refresca sola; no es parte de este change.
- **El generador de esquema y las fechas** → Si mapea a `DateTime`, la fecha podría desplazarse un día al serializar. Mitigación: regla de esquema a `string` (D1) y comprobación con `curl` de que `2026-10-03` entra y sale idéntica.
- **"Al menos uno de los dos" en `PATCH`** → Un cuerpo vacío se rechaza, pero `{ "dueDate": null }` es una petición legítima (quitar la fecha). Hay que verificar ese borde explícitamente (D6).
- **Más superficie de API** → La lectura individual no tiene consumidor en la interfaz hasta que llegue el detalle. Aceptado por la restricción del change; es de solo lectura y mínima.
- **Cambios simultáneos de la fecha (PA-8)** → Gana el último; sin tratar.
- **Sin tests** → Por instrucción. La verificación es con `typecheck`, `lint`, `build` y `curl`.

## Migration Plan

1. `node ace migration:run`: añade `due_date` (nullable) y regenera `database/schema.ts`; commitear el diff generado junto con `.adonisjs/`. La base de desarrollo y la de pruebas son el mismo fichero, así que esto también migra el estado local.
2. Las tareas existentes quedan sin fecha; ninguna pasa a vencida.
3. Despliegue en cualquier orden: el backend acepta `today` opcional, así que el frontend viejo sigue funcionando y el nuevo manda su día.
4. Rollback: `node ace migration:rollback` elimina `due_date`; revertir el frontend quita la capa de acceso. No hay datos previos que migrar.
