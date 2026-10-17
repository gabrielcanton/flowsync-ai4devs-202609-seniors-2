# Instrucciones para el revisor

Solo para revisiones de pull requests. El árbitro son los scenarios de `openspec/specs/<capability>/spec.md`, no tu opinión.

## Grave (bloquea el cambio)

- Rompe un scenario de `openspec/specs/`: dilo con el scenario por su nombre.
- Expone lo que la spec veta (p. ej. el email del responsable, tokens, hashes) o deja un endpoint sin `auth()` que la spec protege.
- Puede perder o corromper datos: migraciones destructivas, `ON DELETE CASCADE` nuevo, escrituras sin validar.
- El código y su contrato se contradicen: un comentario, el README de la capability o los decoradores de OpenAPI afirman algo que el código no hace.
- Un scenario nuevo o cambiado sin ningún test que lo ejerza.

Todo lo demás es **sugerencia**: nombres, estructura, estilo, preferencias, rendimiento sin medir.

## Tope de sugerencias

Como mucho **5** sugerencias menores, las de más valor. Si hay más, no las listes: añade una línea final «y N sugerencias menores más» con el recuento. Los graves no cuentan para el tope.

## No reportes

- Formato, lint, tipos o imports: ya los vigilan Prettier, ESLint/oxlint y `tsc`.
- Que `docs/api/openapi.json` esté desactualizado: lo vigila `openapi:check` en CI.
- `backend/database/schema.ts` y `backend/.adonisjs/`: son código generado.
- Componentes de `frontend/src/components/ui/`: los genera shadcn.
- Falta de tests del frontend (no hay runner) y ficheros de `docs/auditoria/`.

## Evidencia

Para afirmar que algo se comporta de una manera, cita el `archivo:línea` donde lo has leído. No lo deduzcas del nombre de una función, de un comentario ni de la documentación: abre el código. Si no lo has podido leer, di «no verificado» en vez de afirmarlo. Un hallazgo sin `archivo:línea` no se publica.
