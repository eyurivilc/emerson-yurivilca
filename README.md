# Emerson Yurivilca — Landing

Sitio estático en Astro 5 y Tailwind CSS 4. Sin React, fuentes externas, cookies de analítica ni backend.

## Ejecutar

Node.js 22 o superior. Desde esta carpeta:

```sh
npm ci
npm run dev
```

Crear archivos estáticos: `npm run build`. Revisar compilación: `npm run preview`.

## Editar

- `src/pages/index.astro`: textos, servicios, WhatsApp, FAQ y demostración interactiva.
- `src/styles/global.css`: estilos y variables de color.
- `src/components/Icon.astro`: iconos SVG incluidos en el HTML.
- `public/emerson-*.webp`: fotografía optimizada con variantes responsivas.
- `astro.config.mjs`: dominio canónico. Cambiar si se usa dominio propio.

Los datos de la demostración son ficticios. No representan resultados de clientes. El formulario no almacena datos: prepara el mensaje y abre WhatsApp para que la persona lo envíe. Cotización personalizada, sin precios ni testimonios inventados.

## Rendimiento

Salida HTML estática, CSS compilado y JS limitado a pestañas y contacto. Fotografía WebP con dimensiones explícitas, srcset y prioridad alta. Tipografía de sistema. FAQ y navegación funcionan con HTML nativo. Respetar movimiento reducido y controles de teclado.

## Versión actual

Servicios: automatización de reportes, análisis de datos, desarrollo web y soporte remoto. IA aplicada: asistentes de programación y documentación; agentes/MCP en exploración. Tecnologías mostradas solo con texto. Redes: LinkedIn de Emerson y GitHub `eyurivilc`, conforme al repositorio indicado por el usuario. Sin flechas decorativas en nombre, enlaces ni botones. Logo original EY pendiente de recibir.

## Repositorio

https://github.com/eyurivilc/emerson-yurivilca

Se conservan los commits anteriores en el repositorio de Sites. La configuración de alojamiento en `.openai/hosting.json` corresponde al Site de revisión; no activa GitHub Pages. Para otro hosting, actualizar `site` en `astro.config.mjs`.
