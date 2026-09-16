# SPEC: Líneas de cuenta

Versión 0.2.1. Tablero personal de líneas de trabajo por cuenta, pensado para abrirse desde el móvil en cualquier momento (antes de una reunión, al salir de ella, en el pasillo).

## Para quién y para qué

Gestores de cuenta (KAM) de un equipo comercial. Cada cuenta tiene varias "líneas": cosas que se quieren conseguir con esa cuenta y que hay que empujar. La app responde a tres preguntas: qué tengo abierto en cada cuenta, qué se me ha pasado de fecha y qué toca hoy.

No es un CRM ni una herramienta de oferta. No guarda importes, documentos, contactos ni nada confidencial: solo el nombre de la cuenta, el título de la línea, su estado, quién la lleva, el siguiente hito, de dónde salió y una nota breve.

## Modelo de datos

Una línea tiene estos campos:

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| id | texto | sí (automático) | Identificador único generado al crear |
| cuenta | texto | sí | Nombre libre. Se sugieren las cuentas ya existentes |
| titulo | texto | sí | Qué se quiere conseguir |
| estado | uno de la lista | sí | Por defecto "Detectada" |
| responsable | texto | no | Nombre de quien la lleva. Se sugieren los ya usados |
| hitoFecha | fecha AAAA-MM-DD | no | Fecha del próximo hito |
| hitoTexto | texto | no | Qué tiene que pasar en esa fecha |
| origen | texto | no | Reunión, fecha y con quién se detectó |
| notas | texto largo | no | Contexto breve |
| creada | fecha y hora ISO | automático | |
| actualizada | fecha y hora ISO | automático | Cambia en cada guardado |
| historial | lista | automático | Cambios de estado: fecha, estado anterior, estado nuevo. Se conservan los últimos 20 |

Estados, en este orden: **Detectada**, **En trabajo**, **Propuesta enviada**, **Ganada**, **Parada**. Ganada y Parada son estados cerrados. Los nombres de la versión 0.1.0 (En curso, Propuesta, Descartada) se migran al leer los datos guardados.

Definiciones:

- **Vencida:** línea abierta (no cerrada) con fecha de hito anterior a hoy.
- **Vence hoy:** línea abierta con fecha de hito igual a hoy.
- **Pendiente de hito:** vencida o vence hoy.

Los datos se guardan en `localStorage` con la clave `lineas-cuenta.v1` como `{ version: 1, lineas: [...] }`. Al leer, cada línea pasa por una normalización que rellena valores por defecto y descarta estados o fechas inválidos, para que un fichero importado a mano no rompa la app. Los filtros se guardan en `sessionStorage` y se pierden al cerrar la pestaña. La preferencia de tema se guarda en `localStorage` con la clave `lineas-cuenta.tema`.

## Pantalla principal: el tablero

- Cabecera fija con el título de la app, el botón "Nueva línea" (en pantallas anchas) y el botón de Opciones (tres puntos). En móvil el botón "Nueva línea" es flotante, abajo a la derecha.
- Bloque de filtros: búsqueda por texto (título, cuenta, origen, notas, responsable, hito), desplegable de cuenta, desplegable de estado, desplegable de responsable, interruptor "Vencidas" e interruptor "Ocultar cerradas". Cuando hay algún filtro activo aparece "Limpiar filtros".
  - "Vencidas" muestra solo las líneas pendientes de hito (vencidas o que vencen hoy).
  - Los desplegables de cuenta y responsable se rellenan con los valores existentes.
- Contadores bajo la cabecera (ocultos sin datos): **abiertas** (no cerradas; tocarlo alterna "Ocultar cerradas"), **vencen esta semana** (abiertas con hito entre hoy y dentro de seis días) y **vencidas** (tocarlo alterna el filtro "Vencidas").
- Línea de resumen: "N líneas en M cuentas" y, si las hay, "K pendientes de hito". Con filtros activos: "V de N líneas en M cuentas".
- Las líneas se agrupan por cuenta, cuentas en orden alfabético. Cada grupo muestra el nombre de la cuenta, el número de líneas y, si las hay, cuántas están pendientes.
- Dentro de cada cuenta el orden es: pendientes de hito primero, después abiertas, después cerradas; a igualdad, por fecha de hito ascendente (las que no tienen fecha, al final) y por última actualización.
- Cada tarjeta muestra: título, etiqueta de estado con color, "Siguiente: ..." con el texto del hito, la fecha del hito en corto ("10 sep") con su distancia ("vencida hace 5 días" en rojo, "vence hoy" destacado, "en 3 días"), responsable, origen y, en las líneas que aún no están en Ganada ni cerradas, un botón **Avanzar** que pasa la línea al siguiente estado (Detectada, En trabajo, Propuesta enviada, Ganada) registrándolo en el historial, sin abrir la hoja. Las vencidas llevan un borde rojo a la izquierda; las que vencen hoy, ámbar; las cerradas se ven atenuadas.
- Tocar una tarjeta (o pulsar Intro sobre ella) abre su hoja de edición.
- Sin líneas, el tablero muestra un mensaje con dos botones: crear la primera y cargar los datos de ejemplo. Si hay líneas pero ninguna pasa los filtros, lo dice.
- Enlace de demo: si la URL lleva `?ejemplo` y el dispositivo no tiene líneas, se cargan los datos de ejemplo al arrancar y el parámetro se retira de la URL.

## Hoja de línea (crear y editar)

Se abre como hoja inferior en móvil y como ventana centrada en escritorio. Campos: cuenta (con sugerencias), título, estado, responsable (con sugerencias), fecha del próximo hito, hito, origen, notas.

- Al crear desde el tablero con un filtro de cuenta activo, la cuenta viene rellena.
- Cuenta y título son obligatorios; si faltan se avisa y no se guarda.
- Al editar se muestran las fechas de creación y última actualización y, si lo hay, el historial de cambios de estado (el más reciente primero).
- Botones: Guardar, Cancelar y, solo al editar, Eliminar (pide confirmación).
- Al guardar se cierra la hoja, se repinta el tablero y se muestra un aviso breve.

## Opciones (menú de tres puntos)

- **Tema:** Automático, Claro u Oscuro. Automático sigue la preferencia del sistema.
- **Exportar copia (JSON):** descarga `lineas-cuenta-AAAA-MM-DD.json` con todas las líneas.
- **Importar copia (JSON):** lee un fichero exportado (o una lista de líneas) y lo fusiona por id: las líneas con id nuevo se añaden, las existentes se sustituyen. Avisa de cuántas ha añadido y actualizado.
- **Cargar datos de ejemplo:** añade doce líneas en cinco cuentas del mercado Telco y Media (dos vencidas, una que vence hoy, tres que vencen esta semana, una ganada, una parada), con fechas relativas al día en que se cargan, para enseñar la app. Si ya hay datos, pide confirmación.
- **Borrar todas las líneas:** pide confirmación.
- Pie con la versión y el aviso de que los datos se guardan solo en el dispositivo.

## Instalable y sin cobertura

- `manifest.webmanifest` con nombre, iconos 192 y 512 (PNG) y SVG, `display: standalone`, `start_url` y `scope` relativos para que funcione en una subcarpeta (por ejemplo GitHub Pages).
- `sw.js`: en la instalación guarda en caché la app y los iconos. En cada petición intenta primero la red y, si falla, sirve la copia en caché. Al activarse borra las cachés de versiones anteriores. Solo se registra en `https` o en `localhost`.
- Meta etiquetas para "Añadir a pantalla de inicio" en iPhone (`apple-touch-icon` de 180 px, título corto "Líneas").

## Tema claro y oscuro

Colores como variables CSS. El bloque `:root` define el tema claro; `@media (prefers-color-scheme: dark)` lo cambia cuando el sistema está en oscuro y no se ha forzado el claro; `:root[data-tema="oscuro"]` fuerza el oscuro. Estados con un color cada uno, legibles en ambos temas.

## Prueba de humo (`test.mjs`)

Con la app servida en `http://localhost:8765/`, la prueba abre un navegador a 390 px de ancho y comprueba, en este orden: respuesta 200 y título; manifiesto e iconos; registro del service worker; estado vacío; crear una línea; validación de título; segunda línea vencida en otra cuenta y resumen; filtro de vencidas; filtro por cuenta y limpiar; búsqueda por texto; editar a Ganada, ocultar cerradas e historial; persistencia tras recargar; tema oscuro y claro, y persistencia del tema; exportar JSON; eliminar; ausencia de desplazamiento horizontal; ausencia de campos de importe o documentos; ausencia de caracteres tipográficos prohibidos en los ficheros del proyecto; consola sin errores; ninguna petición fallida. Imprime un JSON con `comprobaciones` y `errores` y sale con código 1 si algo falla.

## Fuera de alcance en esta versión

Sincronización entre dispositivos o entre personas, notificaciones, alta masiva desde un texto pegado, vista "Hoy" en franja superior. Son las ampliaciones previstas en `PROMPTS.md`.
