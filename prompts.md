# Prompts

## Prompt 1

**Modelo:** Sonnet 5.5 Medium
**Herramienta:** Claude Code

```
Vamos a hacer una auditoría de las reglas de proceso documentadas al final de @CLAUDE.md. Revisa los últimos 15 commits y los archivos del proyecto, y determina:
  - Qué pide la regla. Resúmela en una frase. Si necesitas varias frases, puede que estés mezclando más de una regla.
  - Qué se revisó para comprobarla. Indica el comando ejecutado o el archivo consultado. Sin esta información no hay forma de saber en qué se apoya el veredicto.
  - Veredicto. Solo puede ser se cumple, no se cumple o no se puede comprobar con la información disponible. Este último caso también es un resultado válido. Significa que la regla no deja suficiente evidencia para verificarla.
  - Evidencia. Escríbela en una línea. Si la regla no se cumple, indica dónde se incumple. Si no se puede comprobar, explica qué información falta.
    Crea una tabla con las reglas como filas y los puntos a determinar como columnas, agregándola en la sección '## Realidad' de @docs/auditoria/gc.md.
    NO hagas cambios en ningún otro archivo. Solo estamos auditando.
    Cuando una regla se cumpla en algunos casos y no en otros, el criterio es que no se cumple (para considerar que se cumple, se debe cumplir siempre).
```

