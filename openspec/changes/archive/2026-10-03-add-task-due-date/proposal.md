# Proposal

## Why

Las tareas ya existen y se listan, pero no pueden comprometerse con un plazo ni avisar de que se ha pasado. La historia FS-118 pide poner, cambiar y quitar una fecha de vencimiento y saber si una tarea está vencida sin comparar fechas a mano. Este change entrega el lado de sistema de esa historia: la fecha, la regla de vencimiento decidida en el servidor y la lectura individual de una tarea, que es donde la historia dice que se ve ("al abrir la tarea").

## What Changes

- **Fecha de vencimiento**: las tareas ganan una fecha opcional **de calendario, sin hora** (formato `YYYY-MM-DD`). Se puede poner al crear y al actualizar, cambiar y quitar. Quitarla se hace enviándola explícitamente vacía (`null` o cadena vacía). Si la clave no viaja, la fecha no se toca. Una fecha anterior a hoy se acepta sin rechazarla: la tarea nace vencida. Una fecha que no existe o está incompleta se rechaza con 422 señalando `dueDate`.
- **Regla de vencimiento**: una tarea está vencida si y solo si tiene fecha, esa fecha es **anterior a hoy** y su estado **no es** `done`. Una tarea cuya fecha es hoy todavía no está vencida; lo estará mañana. Sin fecha no vence nunca, y una tarea `done` nunca está vencida.
- **`isOverdue`**: campo booleano en la representación de cada tarea (junto a `dueDate`). Lo calcula siempre el backend en cada lectura; no se persiste en ninguna columna, no hay jobs que lo marquen y, si el cliente lo envía, se ignora.
- **Día de referencia**: el vencimiento se decide según el día de quien mira. El cliente manda su día en la query `?today=YYYY-MM-DD` (opcional). Si falta, el servidor usa su propio día (UTC). Si es inválido, 422.
- **Lectura individual**: nueva operación `GET /api/v1/tasks/:id`, la superficie mínima que la historia necesita para "abrir la tarea". Es una decisión de este change (ver `design.md`). La pantalla de detalle completa no entra.
- **Actualización**: `PATCH /api/v1/tasks/:id` acepta `status`, `dueDate` o ambos (al menos uno). Título y responsable siguen sin poder cambiarse.
- **Frontend**: solo la capa de acceso a la API (`lib/api.ts`, `lib/types.ts`): tipos con `dueDate` e `isOverdue`, lectura individual, fijar o quitar la fecha, y el día local enviado en todas las llamadas de tareas. Ninguna pantalla nueva ni cambio visible.
- **La lista no cambia**: sigue mostrando título, responsable y estado, sin fecha y sin marca de vencida. Los campos nuevos viajan en la API, pero la interfaz de la lista los ignora.

### Fuera de alcance

- Pantalla de detalle de la tarea y todo lo que vive en ella: editor de fecha, señal visual de vencida, mensaje junto al campo, guardado sin botón. Quedan para el change que traiga el detalle.
- Notificaciones, recordatorios, recurrencia, ordenar o filtrar por fecha.
- Reasignar responsable (CA-18 se cumplirá por construcción cuando exista, porque la fecha es un campo independiente; hoy no hay operación que probar).
- Tests de cualquier tipo.

### Criterios de FS-118 y dónde quedan

| Criterios | Cobertura en este change |
|---|---|
| CA-1, CA-11, CA-12 | La creación en pantalla y la lista no cambian; no se añade ni se sugiere fecha. |
| CA-2, CA-3, CA-13, CA-14, CA-17 | Backend: fijar, cambiar, quitar, aceptar fecha pasada, rechazar fecha imposible, sin permisos por propiedad. La parte visual ("reflejada al instante", mensaje junto al campo) espera al detalle. |
| CA-5 a CA-10, CA-19, CA-20 | La regla de vencimiento y el día de quien mira, decididos en el servidor. |
| CA-4, CA-15, CA-16 | Dependen de la pantalla de detalle (señal visible, sin confirmación, guardado automático). Aplazados. |
| CA-18 | Aplazado hasta que exista reasignar. |

### Puntos abiertos

- **Lectura individual (decisión de este change).** Se añade `GET /tasks/:id` porque la historia dice "al abrir la tarea" y ese endpoint no existía. Lo abierto es si, cuando llegue el detalle, esta lectura basta o debe crecer (por ejemplo, con más datos de la tarea). No se anticipa nada más. Hay que revisar también la restricción anterior "solo listar, crear y actualizar", que este change supera.
- **Día de referencia sin `today`.** Si el cliente no lo manda, el servidor usa UTC, que puede no coincidir con el día de quien mira. Es aceptable mientras los clientes lo manden; se anota por si alguien consume la API sin él.
- **Vuelta atrás desde "Hecho" con fecha pasada (PA-7).** Con esta regla la tarea vuelve a estar vencida al reabrirla, por construcción. Si el producto decide otra cosa, cambia la regla.
- **Cambios simultáneos de la fecha (PA-8)**: sin tratar; gana el último.

### Supuestos registrados

- `PATCH` sin ningún campo (ni `status` ni `dueDate`) se rechaza con 422; antes se rechazaba por falta de `status`.
- `dueDate` solo admite el formato `YYYY-MM-DD` y una fecha real del calendario (el 30 de febrero se rechaza).
- No hay límite de lejanía de la fecha (pasada o futura).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities
- `tasks`: las tareas ganan fecha de vencimiento de calendario, la regla de vencimiento con `isOverdue` decidido por el servidor según el día del cliente, y la lectura individual; la actualización pasa a admitir estado y fecha, y la API pasa de tres a cuatro operaciones.

## Impact

- **Backend**: migración que añade `due_date` nullable a `tasks`; `Task` con la regla de vencimiento; validadores (fecha de calendario, día de referencia, creación y actualización); `TaskTransformer` con `dueDate`, `isOverdue` y el día de referencia; `TasksController` con `show` y `today` en todas las operaciones; ruta `GET /tasks/:id`. `database/schema.ts` y `.adonisjs/` se regeneran y se commitean.
- **Frontend**: `lib/types.ts` y `lib/api.ts`. `tasks-page.tsx` y `task-item.tsx` no se tocan.
- **API**: una operación nueva, un parámetro de query opcional y dos campos nuevos (`dueDate`, `isOverdue`) en cada tarea; `PATCH` acepta `dueDate`.
- **Datos**: las tareas existentes quedan sin fecha y, por tanto, nunca vencidas.
- **Dependencias**: ninguna.
