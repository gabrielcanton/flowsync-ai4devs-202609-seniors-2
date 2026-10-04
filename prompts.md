# Prompts

## Prompt 1

**Modelo:** Sonnet 5.5 Medium
**Herramienta:** Claude Code

```
Vamos a revisar qué escenarios están cubietos por sus correspondientes tests para la capability 'tasks', requerimiento 'Lo que cada tarea muestra de su responsable', según lo documentado en @openspec/specs/tasks/spec.md. Crea una tabla en @docs/verificacion/gc.md con una fila por scenario y 4 columnas:
  El scenario, en una línea. Qué se espera y en qué situación. Si no cabe en una línea, es que estás juntando dos.

  Qué test lo cubre, con el nombre exacto que aparece en la suite. Sin el nombre concreto, la columna va vacía: "seguro que algo lo cubre" no es una fila.

  Cubierto · No cubierto · No lo sé. Los tres estados son válidos, y el tercero no es un fallo: es el resultado más informativo de los tres.

  Si pusiste "no lo sé", qué te faltó para decidirlo. Media línea. Suele ser una de dos: no encontraste dónde se comprueba, o encontraste algo que se le parece y no dice exactamente lo mismo.
  ```

## Prompt 2

**Modelo:** Sonnet 5.5 Medium
**Herramienta:** Claude Code

```
Para cada escenario no cubierto que acabas de detectar, genera los tests faltantes siguiendo el estilo de los tests que ya están presentes en el proyecto. No modifiques código ya existente y no hagas cambios fuera de la carpeta tests. No hagas un commit ni invoques al adversarial reviewer.
```

**Qué salió** Generó los tests, y sin que se lo pidiera los corrió y me reportó el resultado.