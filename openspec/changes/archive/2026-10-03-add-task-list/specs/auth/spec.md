# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: El perfil enlaza con la lista de tareas
El sistema SHALL ofrecer en el perfil un enlace para ir a la lista de tareas del equipo, de modo que tras registrarse (que lleva al perfil) se pueda llegar a la lista sin escribir ninguna dirección.

#### Scenario: Del registro a la lista
- **WHEN** una persona se acaba de registrar, está en su perfil y pulsa el enlace a la lista de tareas
- **THEN** el sistema le muestra la lista de tareas del equipo
