## Purpose

Cuentas y acceso: permite que una persona cree su cuenta en FlowSync, entre y salga de ella, y consulte su perfil. Es la puerta de entrada al resto del sistema: solo quien tiene una sesión iniciada puede ver contenido privado, y quien ya la tiene no necesita volver a identificarse al recargar la página.

## Requirements

### Requirement: Cualquier persona puede crear una cuenta con nombre opcional, email, contraseña y confirmación
El sistema SHALL permitir el registro con un email, una contraseña y su confirmación, y un nombre completo opcional. El email SHALL ser una dirección válida de hasta 254 caracteres que no esté ya registrada. La contraseña SHALL tener entre 8 y 32 caracteres y la confirmación SHALL coincidir con ella. El nombre completo no tiene longitud máxima. Si el nombre se deja vacío o con solo espacios, la cuenta SHALL crearse sin nombre.

#### Scenario: Registro con todos los datos correctos
- **WHEN** una persona sin cuenta envía un nombre, un email que no está registrado, una contraseña de 8 a 32 caracteres y la misma contraseña como confirmación
- **THEN** el sistema crea la cuenta, inicia sesión con ella de inmediato y lleva a la persona a su perfil sin pedirle que entre de nuevo

#### Scenario: Registro sin nombre
- **WHEN** una persona deja el nombre vacío (o solo con espacios) y rellena correctamente el resto de campos
- **THEN** el sistema crea la cuenta sin nombre

#### Scenario: Email ya registrado
- **WHEN** una persona intenta registrarse con un email que ya pertenece a otra cuenta
- **THEN** el sistema no crea la cuenta y le indica bajo el campo del email que ese email ya está registrado y que inicie sesión en su lugar

#### Scenario: Emails que solo difieren en mayúsculas
- **WHEN** una persona se registra con `Ada@correo.com` y ya existe una cuenta con `ada@correo.com`
- **THEN** el sistema las trata como emails distintos y crea la cuenta nueva

#### Scenario: Email con formato inválido
- **WHEN** una persona se registra con un email que no es una dirección válida o que supera los 254 caracteres
- **THEN** el sistema no crea la cuenta y le indica bajo el campo del email que introduzca una dirección válida o que no puede superar los 254 caracteres

#### Scenario: Contraseña demasiado corta o demasiado larga
- **WHEN** una persona se registra con una contraseña de menos de 8 o de más de 32 caracteres
- **THEN** el sistema no crea la cuenta y le indica bajo el campo de la contraseña el mínimo o el máximo de caracteres permitido

#### Scenario: La confirmación no coincide con la contraseña
- **WHEN** una persona escribe una confirmación distinta de la contraseña
- **THEN** el sistema no crea la cuenta y le indica bajo el campo de confirmación que las contraseñas no coinciden, sin necesidad de consultar al servidor

#### Scenario: Falta un dato obligatorio
- **WHEN** una persona envía el registro sin email, sin contraseña o sin confirmación
- **THEN** el sistema no crea la cuenta y le indica bajo ese campo que falta rellenarlo

### Requirement: Una persona con cuenta puede iniciar sesión con su email y contraseña
El sistema SHALL iniciar sesión cuando el email y la contraseña corresponden a una cuenta existente, y SHALL llevar a la persona a la lista de tareas del equipo. El email SHALL compararse tal cual se escribió, distinguiendo mayúsculas de minúsculas. Cuando el email no existe o la contraseña es incorrecta, el sistema SHALL responder con el mismo mensaje en ambos casos, de modo que no revele cuál de los dos falló. El sistema SHALL NOT limitar el número de intentos fallidos de inicio de sesión.

#### Scenario: Credenciales correctas
- **WHEN** una persona con cuenta introduce su email y su contraseña correctos
- **THEN** el sistema inicia sesión y la lleva a la lista de tareas del equipo

#### Scenario: Contraseña incorrecta
- **WHEN** una persona introduce un email registrado con una contraseña que no es la suya
- **THEN** el sistema no inicia sesión y muestra el aviso "El email o la contraseña no son correctos."

#### Scenario: Email que no existe
- **WHEN** una persona introduce un email que no pertenece a ninguna cuenta
- **THEN** el sistema no inicia sesión y muestra el mismo aviso "El email o la contraseña no son correctos."

#### Scenario: Email con distinta capitalización
- **WHEN** una persona registrada como `ada@correo.com` intenta entrar escribiendo `Ada@correo.com`
- **THEN** el sistema no inicia sesión y muestra el aviso "El email o la contraseña no son correctos."

#### Scenario: Datos con formato inválido o ausentes
- **WHEN** una persona intenta entrar con un email que no es una dirección válida, o deja el email o la contraseña vacíos
- **THEN** el sistema no inicia sesión y le indica bajo el campo correspondiente qué debe corregir

#### Scenario: Intentos fallidos repetidos
- **WHEN** una persona falla su contraseña muchas veces seguidas y después introduce la correcta
- **THEN** el sistema inicia sesión con normalidad, sin bloqueos ni esperas

### Requirement: Cada inicio de sesión abre una sesión propia que no caduca por tiempo
El sistema SHALL crear una sesión independiente cada vez que una persona se registra o inicia sesión. Una sesión SHALL permanecer válida hasta que se cierre de forma explícita; no caduca por el paso del tiempo. Cerrar una sesión SHALL NOT afectar a las demás sesiones de la misma cuenta.

#### Scenario: Sesión en dos dispositivos
- **WHEN** una persona inicia sesión desde dos navegadores distintos y cierra la sesión en uno
- **THEN** la sesión del otro navegador sigue activa

#### Scenario: Sesión antigua
- **WHEN** una persona vuelve a la aplicación días o semanas después de haber iniciado sesión, sin haberla cerrado
- **THEN** el sistema sigue reconociendo su sesión y no le pide identificarse de nuevo

### Requirement: El perfil muestra los datos de la cuenta de quien tiene sesión
El sistema SHALL mostrar a la persona con sesión iniciada su nombre completo (o "Sin nombre" si no tiene), su email, sus iniciales y la fecha desde la que es miembro, escrita en español con el formato "día de mes de año". Las iniciales SHALL calcularse así: si hay nombre de dos o más palabras, la primera letra de las dos primeras palabras; si el nombre es de una sola palabra, sus dos primeras letras; si no hay nombre, la primera letra de lo que va antes de la `@` del email y la primera letra de lo que va después. Las iniciales SHALL mostrarse en mayúsculas.

#### Scenario: Perfil de una cuenta con nombre de dos palabras
- **WHEN** entra a su perfil una persona registrada como "Ada Lovelace" con el email `ada@correo.com`
- **THEN** el sistema muestra "Ada Lovelace", `ada@correo.com`, las iniciales "AL" y su fecha de alta

#### Scenario: Nombre de más de dos palabras
- **WHEN** entra a su perfil una persona registrada como "Ada Byron Lovelace"
- **THEN** el sistema muestra las iniciales "AB"

#### Scenario: Nombre de una sola palabra
- **WHEN** entra a su perfil una persona registrada como "Ada"
- **THEN** el sistema muestra las iniciales "AD"

#### Scenario: Cuenta sin nombre
- **WHEN** entra a su perfil una persona que se registró sin nombre con el email `ada@correo.com`
- **THEN** el sistema muestra "Sin nombre" como nombre y las iniciales "AC"

#### Scenario: Datos sensibles
- **WHEN** el sistema devuelve los datos de una cuenta
- **THEN** nunca incluye la contraseña

### Requirement: Solo quien tiene sesión válida accede a las pantallas privadas
El sistema SHALL permitir ver el perfil y la lista de tareas únicamente a quien tiene una sesión válida y SHALL llevar a la pantalla de inicio de sesión a quien no la tiene. A quien ya tiene sesión, el sistema SHALL llevarle a la lista de tareas si intenta abrir la pantalla de inicio de sesión, y al perfil si intenta abrir la de registro. Cualquier dirección desconocida SHALL llevar al perfil (y de ahí a inicio de sesión si no hay sesión). Mientras el sistema comprueba una sesión guardada, SHALL mostrar un indicador de carga ("Cargando…") y no redirigir.

#### Scenario: Acceso al perfil sin sesión
- **WHEN** una persona sin sesión abre la pantalla del perfil
- **THEN** el sistema la lleva a la pantalla de inicio de sesión

#### Scenario: Acceso a login o registro con sesión
- **WHEN** una persona con sesión iniciada abre la pantalla de inicio de sesión o la de registro
- **THEN** el sistema la lleva a la lista de tareas si abrió la de inicio de sesión, y a su perfil si abrió la de registro

#### Scenario: Dirección desconocida
- **WHEN** una persona abre una dirección que no existe
- **THEN** el sistema la lleva al perfil, y si no tiene sesión, a la pantalla de inicio de sesión

#### Scenario: Recarga de página con sesión guardada
- **WHEN** una persona con sesión iniciada recarga la página del perfil o la de la lista de tareas
- **THEN** el sistema muestra un indicador de carga mientras comprueba la sesión y, al validarla, le muestra esa misma página sin echarla a la pantalla de inicio de sesión

### Requirement: La sesión iniciada se conserva en el navegador y se valida al volver
El sistema SHALL guardar la sesión en el navegador al registrarse o iniciar sesión, y SHALL comprobar que sigue siendo válida cada vez que se abre la aplicación con una sesión guardada. Si el sistema rechaza la sesión guardada, SHALL eliminarla y avisar con el mensaje "Tu sesión ha caducado. Vuelve a iniciar sesión.". Si la comprobación falla por un corte de conexión o un error del servidor, SHALL dejar a la persona sin sesión activa y avisar del motivo, pero SHALL conservar la sesión guardada para poder recuperarla.

#### Scenario: Sesión guardada válida
- **WHEN** una persona abre la aplicación con una sesión guardada que el sistema reconoce
- **THEN** el sistema restaura su sesión y puede ver su perfil sin identificarse de nuevo

#### Scenario: Sesión guardada rechazada
- **WHEN** una persona abre la aplicación con una sesión guardada que el sistema ya no reconoce (por ejemplo, porque se cerró desde otro sitio)
- **THEN** el sistema elimina la sesión guardada, la lleva a la pantalla de inicio de sesión y le muestra "Tu sesión ha caducado. Vuelve a iniciar sesión."

#### Scenario: Servidor caído al recuperar la sesión
- **WHEN** una persona abre la aplicación con una sesión guardada y el servidor no responde o falla
- **THEN** el sistema la deja en la pantalla de inicio de sesión con un aviso que explica que no se pudo conectar o que algo ha ido mal, y no elimina la sesión guardada

#### Scenario: Recuperación tras un corte
- **WHEN** una persona que quedó sin sesión activa por un corte del servidor recarga la página cuando el servidor ya funciona
- **THEN** el sistema restaura su sesión sin pedirle identificarse de nuevo

#### Scenario: Aviso de sesión perdida sustituido por un error nuevo
- **WHEN** una persona está en la pantalla de inicio de sesión con el aviso de sesión perdida y envía credenciales incorrectas
- **THEN** el sistema muestra el aviso de las credenciales incorrectas en lugar del aviso de sesión perdida

### Requirement: Una persona con sesión puede cerrarla
El sistema SHALL permitir cerrar la sesión desde el perfil. Al cerrarla, la sesión SHALL dejar de ser válida en el sistema y SHALL eliminarse del navegador. La sesión local SHALL cerrarse siempre, aunque el servidor no pueda confirmarlo o ya no reconozca la sesión. Tras cerrar sesión, la persona SHALL ser llevada a la pantalla de inicio de sesión sin ningún aviso de error.

#### Scenario: Cierre de sesión normal
- **WHEN** una persona con sesión pulsa "Cerrar sesión" en su perfil
- **THEN** el sistema invalida su sesión, la elimina del navegador y la lleva a la pantalla de inicio de sesión

#### Scenario: Reutilizar una sesión cerrada
- **WHEN** se intenta consultar el perfil con una sesión que ya fue cerrada
- **THEN** el sistema rechaza la petición por falta de sesión válida

#### Scenario: Cierre con el servidor caído
- **WHEN** una persona pulsa "Cerrar sesión" y el servidor no responde
- **THEN** el sistema cierra igualmente la sesión en el navegador y la lleva a la pantalla de inicio de sesión

#### Scenario: Cierre con una sesión que el servidor ya no reconoce
- **WHEN** una persona pulsa "Cerrar sesión" y la sesión ya había sido cerrada desde otro sitio
- **THEN** el sistema la lleva a la pantalla de inicio de sesión sin mostrar ningún error

### Requirement: Los errores de acceso se explican en castellano y junto al campo afectado
El sistema SHALL mostrar los errores de registro e inicio de sesión en castellano. Cuando el error corresponde a un campo visible en pantalla, SHALL mostrarse bajo ese campo; cuando corresponde a un campo que la pantalla no muestra, o no es de un campo concreto, SHALL mostrarse como aviso general en la parte superior del formulario. Mientras se envía un formulario, el botón de envío SHALL quedar deshabilitado y mostrar el progreso ("Creando cuenta…" o "Entrando…"). Si no se puede contactar con el servidor, el sistema SHALL avisar de ello.

#### Scenario: Error de un campo visible
- **WHEN** una persona se registra con una contraseña de 5 caracteres
- **THEN** el sistema muestra el error bajo el campo de la contraseña y no muestra aviso general

#### Scenario: Error sin campo asociado
- **WHEN** una persona introduce credenciales incorrectas al iniciar sesión
- **THEN** el sistema muestra un aviso general en la parte superior del formulario

#### Scenario: Servidor inalcanzable al enviar un formulario
- **WHEN** una persona envía el registro o el inicio de sesión y el servidor no está disponible
- **THEN** el sistema muestra un aviso de que no se pudo conectar con el servidor y el formulario vuelve a poder enviarse

#### Scenario: Envío en curso
- **WHEN** una persona envía el formulario de inicio de sesión
- **THEN** el botón queda deshabilitado con el texto "Entrando…" hasta que llega la respuesta

### Requirement: El perfil enlaza con la lista de tareas
El sistema SHALL ofrecer en el perfil un enlace para ir a la lista de tareas del equipo, de modo que tras registrarse (que lleva al perfil) se pueda llegar a la lista sin escribir ninguna dirección.

#### Scenario: Del registro a la lista
- **WHEN** una persona se acaba de registrar, está en su perfil y pulsa el enlace a la lista de tareas
- **THEN** el sistema le muestra la lista de tareas del equipo

## Parte B: las 3 listas

### Requisitos
- 8, 1

### Incoherencias
- frontend/src/pages/register-page.tsx: la password dice que tiene que tener entre 8 y 32 caracteres pero solo contrl longitud mínima, la máxima la ataja el backend.

### Comportamiento intencional?
- El tratamiento de las iniciales según el nombre registrado/email es un tanto llamativo
