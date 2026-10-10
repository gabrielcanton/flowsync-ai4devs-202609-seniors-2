# 2. Los tests de integración como única fuente de verdad ejecutable

## Estado

Propuesta, redactada como escenario a un año vista: aún no es una decisión tomada ni tiene fecha. Reemplaza al [ADR 0001](0001-openspec-como-fuente-de-verdad.md), que pasa a constar como reemplazado. Lo que se afirma del futuro se presenta como condición, no como hecho; lo que se afirma del presente está comprobado en el repositorio a fecha 2026-10-10.

## Contexto

El ADR 0001 hizo de las specs de `openspec/specs/` la fuente de verdad. Su propia sección de consecuencias anticipaba el problema que este ADR recoge: la spec solo es cierta mientras alguien la mantiene a mano, y nada comprueba que describa el sistema. Lo que hay hoy:

- **La spec ya difiere del código y nada lo detectó.** La spec exige `422` en `GET /api/v1/tasks?status=archivado`, pero `listTasksValidator` acepta cualquier cadena y responde `200` con lista vacía. La spec habla de «nombre» del responsable y la API expone `fullName`. Se vio al contrastarlas a mano.
- **Los tests existentes son pocos.** Hay tests functional de `auth` (`backend/tests/functional/auth/`) y `tasks/assignee.spec.ts`. No hay `tests/unit/` y los tres changes archivados declaran que no escriben tests. El frontend no tiene runner de tests.
- **La infraestructura para tests tipados ya existe.** `tests/bootstrap.ts` engancha el registro Tuyau al `apiClient` de Japa, así que las rutas y sus payloads están tipados en los tests functional.
- **Las suites functional usan la misma base SQLite que el servidor de desarrollo** (`config/database.ts` no tiene override por entorno), por lo que escribir tests de tareas exige aislarlos con los hooks de `testUtils.db()`.

El escenario es que, dentro de un año, mantener dos descripciones del comportamiento (la spec en prosa y el código) resulte más caro que su valor, y que la única descripción que se compruebe sola sea la de los tests.

## Decisión

Dejamos de mantener las specs de OpenSpec. La fuente de verdad sobre qué hace el sistema pasa a ser la suite de tests de integración, que se ejecuta y falla cuando el comportamiento cambia.

1. `openspec/` se congela como archivo histórico: no se añaden changes ni se modifica `openspec/specs/`. Lo que ya está queda como registro de lo que se creía y de por qué se decidió.
2. Cada comportamiento que antes se escribía como *scenario* WHEN/THEN se expresa como un test functional que lleva el mismo título. Un cambio de comportamiento sin test que lo cubra no se considera hecho.
3. Si código y test discrepan, el test manda hasta que se cambie a propósito en el mismo cambio.
4. Las decisiones de producto y los porqués que la spec y los `design.md` recogían se guardan en ADRs y en comentarios de los tests, no en un segundo documento de requisitos.

Condición previa: esta decisión no debe adoptarse hasta que los scenarios que importan (como mínimo los de `tasks`, que hoy no tienen tests) estén cubiertos. Congelar la spec antes dejaría el sistema sin ninguna fuente de verdad.

## Consecuencias

**Lo que ganamos**

- La verdad se comprueba sola: un test que falla es una discrepancia detectada, que es justo lo que la spec no ofrecía.
- Se elimina la doble escritura: un solo sitio que cambiar, y la deriva entre documento y código deja de ser posible por construcción.
- Los tests tipados con el registro de rutas hacen que un cambio de contrato rompa la compilación de los tests.

**Lo que nos cuesta**

- **Los tests solo dicen lo que alguien escribió.** Hoy cubrirían auth y el responsable de las tareas; el resto de lo que la spec exige quedaría sin fuente de verdad hasta escribirlo. El coste de entrada es alto.
- **Se pierde la intención.** Un test dice qué ocurre, no por qué ni qué se descartó. Los *requirements* con su justificación y los `design.md` desaparecerían como lectura, salvo que se trasladen a ADRs, y eso es trabajo y disciplina nuevos.
- **La interfaz queda fuera.** Los scenarios de pantalla (lista, filtro, señal de vencida, accesibilidad por teclado) son la mayor parte de la spec de `tasks`, y no hay runner de tests en el frontend. Esos requisitos no tendrían fuente de verdad ejecutable salvo que se monte un runner de interfaz, lo que no se ha decidido.
- **Un test es una fuente de verdad frágil si es incorrecto.** Si un test fija un comportamiento erróneo, lo legitima. La spec al menos era revisable como texto de producto por quien no lee código.
- **Peor lectura para quien no programa.** Producto pierde el documento que podía leer y discutir.
- **Aislamiento de datos.** Mientras tests y servidor compartan fichero SQLite, una suite que sea la fuente de verdad puede contaminar o ser contaminada por el estado de desarrollo; hay que resolverlo antes.
- **La documentación OpenAPI no sale de los tests.** Se genera de los decoradores de los controladores, así que seguiría necesitando su propio mantenimiento y podría derivar igual que la spec.
- **Hay que decidir qué hacemos con `openspec/`:** congelarlo evita borrar historia, pero deja una carpeta que parece vigente y no lo es. Habría que marcarla claramente.

**Qué haría falta para que esta decisión sea buena**

- Cobertura de los scenarios de `tasks` antes de congelar la spec, y un criterio explícito de qué se verifica con test y qué no.
- Un sitio decidido para el porqué (ADRs) y para los requisitos de interfaz.
