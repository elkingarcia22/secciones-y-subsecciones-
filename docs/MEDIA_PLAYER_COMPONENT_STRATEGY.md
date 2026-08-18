# MEDIA_PLAYER_COMPONENT_STRATEGY

## Estrategia de Implementación
El objetivo es proveer reproductores de video y audio con identidad visual UBITS, evitando dependencias externas pesadas y priorizando el performance.

## 1. Tecnología Base
- Se utilizarán los elementos nativos de HTML5: `<video>` y `<audio>`.
- **Zero-Dependency**: No se integrarán librerías como Video.js o Plyr en esta etapa.
- **Identidad**: Los controles nativos del navegador se ocultarán para implementar una UI custom mediante React y Tailwind.

## 2. Componentes de la Suite

### Video Player (`UbitsVideoPlayer`)
- **Visual**: Contenedor con aspect-ratio controlado (16:9 / 4:3).
- **Controles**: Play/Pause central, barra de progreso (usando `RangeSlider`), control de volumen, toggle de Fullscreen.
- **Features**: Poster image, soporte para subtítulos (`<track>`).

### Audio Player (`UbitsAudioPlayer`)
- **Visual**: Variante compacta (Barra) y variante Card.
- **Controles**: Play/Pause, Progreso, Volumen, Mute.
- **Features**: Soporte para carátula de audio, metadata de artista/título.

## 3. Accesibilidad y UX
- **Keyboard**: Shortcuts estándar (Space para play/pause, M para mute, Flechas para seek).
- **Aria Labels**: Todos los controles deben tener etiquetas descriptivas.
- **Feedback**: Loading states claros mientras el buffer se llena.
- **No Autoplay**: Se respetará estrictamente la política de no reproducir contenido sin interacción del usuario.

## 4. Limitaciones Fuera de Alcance (Phase 8.7)
- No soporte para Streaming adaptativo (HLS/DASH) nativo (requiere librerías externas).
- No integración con APIs de terceros (YouTube/Vimeo).
- No edición de video/audio.

---
*Media Strategy v1.0 — Fase 8.7A*
