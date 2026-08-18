# PLAYGROUND_SHELL_NAVIGATION_CONTRACT

## Estructura de Navegación

### NavigationItem (Estructura Base)
Define cómo se representan los links en Sidebar y TabBar.
- `id`: identificador único.
- `label`: texto visible.
- `icon`: nombre del icono (mapeado a `UbitsIcon`).
- `badge`: (opcional) número o punto de notificación.
- `disabled`: booleano.
- `role`: (`admin` | `collaborator` | `all`).

### ProductContext (Contexto de Pantalla)
Define el título y jerarquía inmediata de la pantalla activa.
- `productName`: ej. "Encuestas".
- `sectionName`: ej. "Resultados Generales".
- `backPath`: (opcional) para navegación hacia atrás.

## Variantes de Navegación

### 1. Perfil Administrador (Admin)
- Foco en gestión y analítica.
- Sidebar con secciones como: Dashboard, Usuarios, Reportes, Configuración.

### 2. Perfil Colaborador (Collaborator)
- Foco en consumo y ejecución.
- Sidebar con secciones como: Mis Cursos, Mi Progreso, Biblioteca.

### 3. Navegación Contextual (Product SubNav)
- Foco en la tarea actual.
- Tabs como: "Vista General", "Resultados por Segmento", "Participación".

## Reglas de Implementación (Mock Only)
Para el Playground inicial, la navegación no usará un Router real de React.
- El Shell recibirá un `activeId` y un `onNavigate`.
- Se simulará el cambio de pantalla mediante el cambio de estado en el componente raíz del playground.
- **Prohibición**: No hardcodear arrays de navegación dentro de los componentes visuales. Deben venir de un archivo de configuración (ej. `src/config/navigation.ts`).

---
*Contrato de Navegación v1.0*
