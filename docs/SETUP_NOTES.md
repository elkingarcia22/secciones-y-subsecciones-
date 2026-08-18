# Setup Notes

## Estado del Repositorio Destino
- **Ruta Local:** `/Users/ub-col-pro-lf4/Documents/Plantilla-proyecto`
- **Contexto:** Repositorio inicializado para `Nom-035` pero re-enfocado como `plantilla-proyectos-shadcn`.
- **Estructura:** Limpia, con carpeta `references/` para el repo legacy.

## Estado de MCP en Antigravity
- **Soporte:** Antigravity soporta MCP mediante configuración global.
- **Ruta de Configuración Real:** `/Users/ub-col-pro-lf4/.gemini/antigravity/mcp_config.json`
- **Configuración actual:** Se detectaron servidores para `StitchMCP`, `NotebookLM`, `chrome-devtools-mcp`, `atlassian-mcp-server`, `github-mcp-server`, y `figma-dev-mode-mcp-server`.

## Configuración de shadcn MCP
Para habilitar el soporte de `shadcn` MCP en Antigravity, el usuario debe agregar el siguiente bloque al archivo `mcp_config.json`:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

> [!IMPORTANT]
> No se ha modificado el archivo global automáticamente para evitar efectos colaterales no deseados. Se recomienda al usuario realizar este paso manualmente si desea soporte de autocompletado/generación de componentes shadcn vía MCP.
> **Advertencia:** No commitear tokens de acceso o rutas locales absolutas fuera del workspace en archivos compartidos.

## Pasos Realizados (Fase 0)
1. Validación de entorno.
2. Localización de config MCP.
3. Clonación de repo legacy en `references/template-ubits`.
4. Auditoría de tokens y componentes.
