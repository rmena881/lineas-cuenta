# Líneas de cuenta

Tablero de líneas de trabajo por cuenta para gestores de cuenta, pensado para el móvil. Un solo `index.html`, sin dependencias, instalable como app y usable sin cobertura.

## Usar en local

```
python -m http.server 8765
```

Abrir `http://localhost:8765/`.

## Probar

```
npm i -D playwright
npx playwright install chromium
node test.mjs
```

Con el servidor levantado en el puerto 8765. La salida es un JSON; `errores` debe quedar vacío.

## Documentación

- `SPEC.md`: qué hace la app y cómo se comporta.
- `CLAUDE.md`: reglas de trabajo para las sesiones con Claude Code.
- `PROMPTS.md`: prompts de despliegue, prueba y ampliaciones.
