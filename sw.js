/* Service worker de Líneas de cuenta.
   Estrategia: red primero y caché de respaldo, para que el móvil abra la app sin cobertura
   y para que un despliegue nuevo se vea sin desinstalar. Subir VERSION en cada publicación. */
const VERSION = 'lineas-cuenta-v0.1.0';
const RECURSOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './iconos/icon.svg',
  './iconos/icon-192.png',
  './iconos/icon-512.png',
  './iconos/apple-touch-icon.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(RECURSOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;
  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        if (respuesta && respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      })
      .catch(() => caches.match(peticion).then((guardada) => {
        if (guardada) return guardada;
        if (peticion.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
