# Auditoría: Comparativo de Encuestas

## Estructura Encontrada
- **Docs:** Usa una carpeta `docs/` con archivos `.md` para cada área (Architecture, Design, Migration). Este patrón debe replicarse.
- **Tokens:** Define variables CSS en `src/styles/tokens.css` y las mapea en `tailwind.config.ts`. Es la arquitectura más limpia y escalable.
- **Layout:** Implementa un `SidebarRail` compacto y un `AppShell`.

## Lecciones Aprendidas del Comparativo de Encuestas
1. **No usar clases Tailwind no mapeadas:** Evitar `bg-[#hex]` o `text-[#hex]`. Todo debe pasar por los tokens.
2. **Sidebar Rail:** UBITS prefiere el diseño tipo Rail (80px) para ahorrar espacio horizontal en desktop.
3. **App.tsx como orquestador:** No debe contener lógica de componentes pesados, solo el Layout y el Routing (cuando se implemente).
4. **Docs Compactos:** Mantener documentación que la IA pueda leer rápidamente para mantener el contexto del Design System.
5. **Alineación de HSL:** shadcn prefiere HSL, pero UBITS define HEX. El comparativo resuelve esto mapeando HEX en las variables CSS y dejando que Tailwind las consuma, o convirtiendo a HSL para las variables nativas de shadcn.

## Errores a Evitar
- No mezclar la instalación de componentes con la creación de pantallas finales.
- Evitar hardcodear datos de prueba dentro de los componentes UI.
- No omitir la validación de radios y sombras oficiales (el comparativo usa radios de 16px, muy importantes para el look "suave" de UBITS).

## Qué migrar a la plantilla
- La lógica de `tailwind.config.ts` (especialmente las extensiones de `colors` y `spacing`).
- La estructura de `src/styles/tokens.css`.
- El enfoque de documentación "IA-Ready".
