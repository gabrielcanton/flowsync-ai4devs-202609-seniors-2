# Spec Delta

## Purpose

Tareas del equipo: una única lista compartida donde cualquier miembro anota en qué anda con solo escribir un título, y donde todos ven de un vistazo qué trabajo hay, quién lo lleva y en qué estado está, y pueden mantener ese estado al día con un gesto.

## ADDED Requirements

### Requirement: La lista de tareas es única, la misma para todas las personas con sesión
El sistema SHALL ofrecer una sola lista con todas las tareas del espacio, idéntica para todas las personas con sesión iniciada. El sistema SHALL NOT permitir tareas privadas ni ofrecer una vista "mis tareas" separada de la lista del equipo. Ver la lista SHALL NOT requerir ningún permiso especial ni depender de un rol. Consultar la lista SHALL NOT modificar ninguna tarea. Quien no tiene sesión iniciada SHALL NOT ver ninguna tarea.

#### Scenario: Dos personas ven lo mismo
- **WHEN** dos personas distintas con sesión abren la lista sin tocar nada
- **THEN** ambas ven exactamente el mismo conjunto de tareas

#### Scenario: La tarea de otra persona está en la lista
- **WHEN** una persona crea una tarea (que nace a su nombre) y otra persona abre la lista
- **THEN** la segunda persona ve esa tarea en la lista

#### Scenario: No existe una vista personal
- **WHEN** una persona con sesión recorre la aplicación buscando otras vistas de tareas
- **THEN** no encuentra ninguna vista "mis tareas" ni forma de crear una tarea que los demás no vean

#### Scenario: Acceso sin sesión
- **WHEN** una persona sin sesión intenta abrir la lista de tareas
- **THEN** el sistema la lleva a la pantalla de inicio de sesión y no le muestra ninguna tarea

#### Scenario: Petición de tareas sin sesión válida
- **WHEN** se pide el listado de tareas sin una sesión válida
- **THEN** el sistema rechaza la petición por falta de sesión y no devuelve ninguna tarea

#### Scenario: Mirar no cambia nada
- **WHEN** una persona abre la lista y la recorre con tareas en varios estados
- **THEN** ninguna tarea cambia de estado ni de responsable

### Requirement: Cada fila de la lista muestra título, responsable y estado
El sistema SHALL mostrar en la lista, para cada tarea, su título, el nombre de su responsable y su estado, de modo que no haga falta abrir ninguna para conocerlos. El responsable SHALL identificarse por su nombre; si no tiene nombre, el sistema SHALL mostrar "Sin nombre" y SHALL NOT mostrar en su lugar su email ni ningún identificador interno. Los estados SHALL mostrarse como "Pendiente", "En curso" y "Hecho". Del responsable, el sistema SHALL exponer únicamente su nombre. La lista SHALL NOT mostrar fechas, marcas de vencida ni señales de presencia (quién está conectado o actividad por persona). El sistema SHALL NOT aplicar ningún criterio de orden ni de agrupación a la lista.

#### Scenario: Una tarea con responsable con nombre
- **WHEN** hay una tarea "Preparar la demo" a cargo de "Ada Lovelace" en estado "En curso" y una persona abre la lista
- **THEN** la fila muestra "Preparar la demo", "Ada Lovelace" y "En curso"

#### Scenario: Responsable sin nombre
- **WHEN** hay una tarea cuyo responsable se registró sin nombre y una persona abre la lista
- **THEN** la fila muestra "Sin nombre" como responsable y no aparece ni su email ni ningún identificador

#### Scenario: Qué datos del responsable salen del sistema
- **WHEN** el sistema devuelve el listado de tareas
- **THEN** de cada responsable solo incluye el nombre, sin email, contraseña ni identificador de la cuenta

#### Scenario: Enumerar el trabajo sin abrir nada
- **WHEN** el equipo tiene tareas repartidas entre varias personas y alguien recorre la lista
- **THEN** puede leer en cada fila quién la lleva y en qué estado está, sin abrir ninguna tarea

#### Scenario: La lista no muestra fechas ni vencimientos
- **WHEN** una persona abre la lista
- **THEN** no ve ninguna fecha ni ninguna marca de vencida en las filas

#### Scenario: La lista no muestra presencia
- **WHEN** otras personas del equipo están usando la aplicación a la vez que quien mira la lista
- **THEN** la lista no muestra quién está en línea ni actividad por persona

#### Scenario: Sin criterio de orden
- **WHEN** el sistema devuelve o muestra las tareas
- **THEN** no aplica ningún criterio de ordenación explícito y no las agrupa por persona ni por estado

### Requirement: El espacio sin tareas explica qué es y ofrece crear la primera
El sistema SHALL, cuando no exista ninguna tarea, mostrar en lugar de una lista vacía un texto que explique para qué sirve la lista y SHALL ofrecer crear la primera tarea.

#### Scenario: Todavía no hay tareas
- **WHEN** una persona con sesión abre la lista y no se ha creado ninguna tarea en el espacio
- **THEN** el sistema le explica qué es la lista y le ofrece crear la primera, sin mostrar una lista vacía sin más

#### Scenario: Se crea la primera tarea
- **WHEN** una persona crea la primera tarea desde el espacio vacío
- **THEN** la explicación desaparece y la lista muestra esa tarea

### Requirement: Una tarea se crea escribiendo únicamente su título
El sistema SHALL permitir crear una tarea indicando solo su título. El flujo de creación SHALL NOT pedir, ofrecer ni sugerir responsable, estado, fecha ni ningún otro dato. La tarea recién creada SHALL aparecer en la lista de inmediato, sin recargar ni navegar a otra parte. El título SHALL guardarse sin los espacios del principio y del final.

#### Scenario: Crear con un título
- **WHEN** una persona con sesión escribe un título y crea la tarea desde la lista
- **THEN** la tarea queda creada y aparece en la lista sin que haya tenido que rellenar nada más

#### Scenario: El formulario solo pide el título
- **WHEN** una persona recorre el flujo de creación de una tarea
- **THEN** el título es lo único que se le pide y no se le ofrece ni sugiere indicar responsable, estado ni fecha

#### Scenario: La tarea aparece sin recargar
- **WHEN** una persona acaba de crear una tarea
- **THEN** la ve ya en la lista, sin recargar ni navegar a ninguna otra parte, y el campo del título queda vacío para anotar otra

#### Scenario: Espacios alrededor del título
- **WHEN** una persona crea una tarea con el título "  Revisar presupuesto  "
- **THEN** la tarea se guarda y se muestra como "Revisar presupuesto"

#### Scenario: Petición de creación sin sesión válida
- **WHEN** se intenta crear una tarea sin una sesión válida
- **THEN** el sistema rechaza la petición por falta de sesión y no crea ninguna tarea

### Requirement: Una tarea nueva nace pendiente y a nombre de quien la crea
El sistema SHALL asignar a toda tarea nueva el estado "Pendiente" y como responsable a la persona que la crea, sin que esta elija ninguno de los dos. Si la petición de creación trae un estado o un responsable, el sistema SHALL ignorarlos.

#### Scenario: Responsable por defecto
- **WHEN** "Ada Lovelace" crea una tarea indicando solo el título
- **THEN** la tarea aparece en la lista con "Ada Lovelace" como responsable, sin que haya seleccionado a nadie

#### Scenario: Estado por defecto
- **WHEN** una persona crea una tarea indicando solo el título
- **THEN** la tarea aparece en estado "Pendiente", sin que haya elegido el estado

#### Scenario: Creador sin nombre
- **WHEN** una persona que se registró sin nombre crea una tarea
- **THEN** la tarea aparece con "Sin nombre" como responsable

#### Scenario: Intento de fijar estado o responsable al crear
- **WHEN** una petición de creación incluye un estado distinto de pendiente o un responsable distinto de quien la envía
- **THEN** la tarea se crea igualmente en "Pendiente" y a nombre de quien la envía

### Requirement: El título de una tarea es obligatorio y tiene una longitud máxima
El sistema SHALL rechazar la creación de una tarea sin título, y SHALL tratar un título compuesto solo por espacios como si estuviera vacío. El sistema SHALL rechazar un título más largo que el límite configurado y SHALL avisar de ello, en ningún caso guardar una versión recortada. El límite se mide sobre el título ya sin espacios al principio ni al final. Cuando se rechaza, el aviso SHALL mostrarse junto al propio campo, en lenguaje corriente, y la tarea SHALL NOT crearse ni aparecer en la lista.

#### Scenario: Crear sin título
- **WHEN** una persona intenta crear una tarea sin haber escrito ningún título
- **THEN** no se crea ninguna tarea y se le indica junto al campo que falta rellenar el título

#### Scenario: Título en blanco
- **WHEN** una persona escribe solo espacios como título e intenta crear la tarea
- **THEN** se rechaza igual que si el campo estuviera vacío y no aparece en la lista ninguna fila sin texto

#### Scenario: Título justo en el límite
- **WHEN** una persona crea una tarea con un título de exactamente la longitud máxima configurada
- **THEN** la tarea se crea con el título completo

#### Scenario: Título que supera el límite
- **WHEN** una persona intenta crear una tarea con un título una letra más largo que el máximo configurado
- **THEN** no se crea la tarea y se le avisa junto al campo de que el título no puede superar ese número de caracteres, sin guardar una versión recortada

#### Scenario: El límite no cuenta los espacios de los extremos
- **WHEN** una persona crea una tarea con un título de la longitud máxima configurada rodeado de espacios
- **THEN** la tarea se crea con el título completo

### Requirement: El estado de una tarea solo puede ser Pendiente, En curso o Hecho
El sistema SHALL admitir únicamente los tres estados "Pendiente", "En curso" y "Hecho", identificados en la API como `pending`, `in_progress` y `done`. El conjunto SHALL ser cerrado: el sistema SHALL NOT ofrecer ninguna forma de añadir, renombrar ni eliminar estados, y SHALL rechazar con un error de validación cualquier otro valor. Toda tarea SHALL estar siempre en exactamente uno de los tres.

#### Scenario: Solo hay tres estados
- **WHEN** una persona busca en cualquier punto del producto la forma de añadir, renombrar o eliminar un estado
- **THEN** no existe ninguna y los únicos estados disponibles son "Pendiente", "En curso" y "Hecho"

#### Scenario: Valor de estado desconocido
- **WHEN** se pide cambiar el estado de una tarea a un valor distinto de `pending`, `in_progress` y `done` (por ejemplo, `pendiente` o `blocked`)
- **THEN** el sistema rechaza la petición con un error de validación y la tarea conserva su estado

#### Scenario: Estado ausente
- **WHEN** se pide actualizar una tarea sin indicar el estado
- **THEN** el sistema rechaza la petición con un error de validación y la tarea no cambia

### Requirement: Cualquier persona con sesión puede cambiar el estado de cualquier tarea desde la lista
El sistema SHALL permitir cambiar el estado de una tarea desde su propia fila, con un solo gesto, sin abrir la tarea, sin diálogo de confirmación y sin rellenar ningún campo. Los únicos destinos ofrecidos SHALL ser "Pendiente", "En curso" y "Hecho". El nuevo estado SHALL reflejarse en la vista de inmediato. El cambio SHALL aplicarse igual sobre cualquier tarea, sea o no de quien lo hace, sin permisos especiales ni advertencias. El sistema SHALL permitir pasar de cualquier estado a cualquier otro, incluida la vuelta atrás desde "Hecho". La actualización SHALL cambiar únicamente el estado: no modifica el título ni el responsable.

#### Scenario: Cambiar el estado desde la fila
- **WHEN** una persona con sesión elige "En curso" en la fila de una tarea "Pendiente"
- **THEN** la fila muestra "En curso" de inmediato, sin haber abierto la tarea ni confirmado ni rellenado nada

#### Scenario: Cambiar el estado de la tarea de otra persona
- **WHEN** una persona cambia el estado de una tarea cuyo responsable es otra persona
- **THEN** el cambio se aplica igual que en una tarea propia, sin pedir permiso ni mostrar advertencia, y el responsable sigue siendo el mismo

#### Scenario: Los destinos ofrecidos
- **WHEN** una persona mira cómo cambiar el estado de una tarea desde la lista
- **THEN** los únicos destinos ofrecidos son "Pendiente", "En curso" y "Hecho", y la tarea queda en exactamente uno de ellos

#### Scenario: Volver atrás desde Hecho
- **WHEN** una persona cambia a "Pendiente" una tarea que estaba en "Hecho"
- **THEN** el sistema acepta el cambio y la fila muestra "Pendiente"

#### Scenario: Volver a elegir el estado actual
- **WHEN** una persona elige para una tarea el mismo estado que ya tiene
- **THEN** la tarea sigue en ese estado y no se muestra ningún error

#### Scenario: El cambio llega a los demás
- **WHEN** una persona cambia el estado de una tarea y otra persona abre después la lista
- **THEN** la segunda ve la tarea con el nuevo estado

#### Scenario: El cambio falla
- **WHEN** una persona cambia el estado de una tarea y el servidor no puede aplicarlo
- **THEN** la fila vuelve a mostrar el estado anterior y se le avisa de que no se pudo guardar el cambio

#### Scenario: Tarea que no existe
- **WHEN** se pide cambiar el estado de una tarea que no existe
- **THEN** el sistema responde que no existe y no crea ninguna tarea

#### Scenario: Actualización sin sesión válida
- **WHEN** se intenta cambiar el estado de una tarea sin una sesión válida
- **THEN** el sistema rechaza la petición por falta de sesión y la tarea no cambia

#### Scenario: Campos distintos del estado
- **WHEN** una petición de actualización incluye, además del estado, un nuevo título o un nuevo responsable
- **THEN** el sistema aplica solo el estado y el título y el responsable permanecen como estaban

### Requirement: La API de tareas ofrece solo listar, crear y actualizar
El sistema SHALL ofrecer exactamente tres operaciones sobre tareas: listar todas, crear una y actualizar una existente. El sistema SHALL NOT ofrecer lectura individual de una tarea, borrado ni operaciones sobre el equipo. Las tres operaciones SHALL exigir una sesión válida.

#### Scenario: Lectura individual
- **WHEN** se intenta leer una única tarea por su identificador
- **THEN** el sistema no ofrece esa operación

#### Scenario: Borrado
- **WHEN** se intenta borrar una tarea
- **THEN** el sistema no ofrece esa operación y la tarea sigue existiendo

#### Scenario: Operaciones de equipo
- **WHEN** se intenta consultar, crear o modificar un equipo
- **THEN** el sistema no ofrece esas operaciones
