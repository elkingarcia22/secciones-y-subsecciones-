# Guía de uso — Encuestas

**Cómo funciona el producto desde la pantalla: recorridos, casos de uso, mensajes y errores.**

> **Para quién es:** producto, diseño, QA, soporte y cualquiera que tenga que *probar* la
> herramienta o *explicarla*, sin abrir el código.
>
> **Qué encontrarás:** cada pantalla explicada por lo que ve la persona, cada caso de uso con
> los pasos exactos y la encuesta concreta con la que probarlo, y cada mensaje de error con su
> texto literal, su causa y cómo salir de él.
>
> **Qué NO encontrarás:** nombres de archivo, funciones ni código. Para eso está
> [Anatomía de una encuesta](DESCARGABLES_SECCIONES_Y_RESULTADOS.md).

---

## Índice

1. [Antes de empezar: con qué encuesta probar cada cosa](#1-antes-de-empezar-con-qué-encuesta-probar-cada-cosa)
2. [El recorrido completo](#2-el-recorrido-completo)
3. [La lista de encuestas](#3-la-lista-de-encuestas)
4. [Crear una encuesta: los cinco pasos](#4-crear-una-encuesta-los-cinco-pasos)
5. [Paso 4 en detalle: secciones, subsecciones y preguntas](#5-paso-4-en-detalle-secciones-subsecciones-y-preguntas)
6. [La vista previa](#6-la-vista-previa)
7. [Resultados: qué responde cada pestaña](#7-resultados-qué-responde-cada-pestaña)
8. [Descargas: los cinco reportes](#8-descargas-los-cinco-reportes)
9. [Anónima o pública: qué cambia exactamente](#9-anónima-o-pública-qué-cambia-exactamente)
10. [Catálogo de mensajes](#10-catálogo-de-mensajes)
11. [Casos de uso completos, de principio a fin](#11-casos-de-uso-completos-de-principio-a-fin)
12. [Cuando algo no cuadra](#12-cuando-algo-no-cuadra)

---

## 1. Antes de empezar: con qué encuesta probar cada cosa

Esta es la sección más importante de la guía. Casi todos los comportamientos "raros" que
reporta la gente no son fallos: son la diferencia entre una encuesta **anónima** y una
**pública**. Antes de probar cualquier cosa, hay que saber cuál se está mirando.

### 1.1 Qué encuestas hay cargadas y cuál es cuál

La lista trae 21 encuestas de ejemplo. Su privacidad **no se elige en la lista**: viene dada
por el tipo y el nombre.

| Encuesta | Estado | Privacidad | Mínimo por grupo |
|---|---|---|---|
| **Clima Organizacional - Q1 2026** | Finalizado | 🔓 **Pública** (nominal) | 1 |
| NPS Clientes Premium Q3 2026 | En curso | 🔓 **Pública** | 1 |
| NPS Clientes Premium Q1 2026 | Finalizado | 🔓 **Pública** | 1 |
| NPS Clientes Premium Q4 2025 | Finalizado | 🔓 **Pública** | 1 |
| NPS Clientes Premium Q4 2024 | Finalizado | 🔓 **Pública** | 1 |
| NPS Clientes Premium Q3 2024 | Finalizado | 🔓 **Pública** | 1 |
| Clima Organizacional - Q3 2026 | En curso | 🔒 **Anónima** | 5 |
| Pulso de Bienestar - Ago 2026 | En curso | 🔒 **Anónima** | 5 |
| Cultura y Valores - 2026 (2ª ola) | En curso | 🔒 **Anónima** | 5 |
| Clima Organizacional - Q4 2025 · Q3 2025 · Q2 2025 · Q1 2025 | Finalizado | 🔒 **Anónima** | 5 |
| Clima Organizacional - Q4 2024 · Q3 2024 · Q2 2024 · Q1 2024 | Finalizado | 🔒 **Anónima** | 5 |
| Cultura y Valores - 2026 · 2025 · 2024 | Finalizado | 🔒 **Anónima** | 5 |
| Alineación de Propósito - 2024 | Finalizado | 🔒 **Anónima** | 5 |

**La regla, en una frase:** *todas las de tipo **NPS** son públicas, **Clima Q1 2026** es la
excepción pública, y **todo lo demás** es anónimo con un mínimo de 5 respuestas por grupo.*

> **Por qué está así:** un eNPS es nominal por diseño, y Clima Q1 2026 se dejó nominal a
> propósito para que exista **una** medición de clima cuyos resultados se puedan abrir persona
> por persona. Sin ella no habría forma de probar el listado de participantes ni la ficha
> individual.

### 1.2 La chuleta: qué encuesta usar para cada escenario

| Quiero probar… | Usa esta encuesta |
|---|---|
| El bloqueo de descarga por anonimato | **Cultura y Valores - 2026** (o cualquier Clima/Cultura salvo Q1 2026) |
| Celdas `Reservado` en el heatmap | **Cultura y Valores - 2026** |
| Ver nombres y correos reales en un export | **Clima Organizacional - Q1 2026** |
| La vista "Por persona" con nombres | **Clima Organizacional - Q1 2026** |
| Participantes numerados (`Participante 128`) | Cualquier Clima/Cultura anónima |
| El filtro de población en los 5 reportes | **Clima Organizacional - Q1 2026** (pública: aparece en todos) |
| Que el filtro de población desaparezca | Cualquier anónima + reporte *Comentarios*, *Preguntas* o *Respuestas* |
| Una medición todavía abierta | **Clima Organizacional - Q3 2026** (En curso, 41%) |
| Enviar recordatorio a quien falta | Cualquiera **En curso** |
| Finalizar / reabrir una encuesta | **Pulso de Bienestar - Ago 2026** (En curso) |
| La comparación entre mediciones | Cualquier Clima finalizada (hay 9 en la lista) |

### 1.3 Cómo saber, mirando la pantalla, si una encuesta es anónima

Hay tres formas, y conviene conocerlas las tres porque cada una vive en un sitio distinto:

**a) Desde los resultados — la más rápida.**
Entra a la encuesta → en la barra flotante de abajo pulsa el icono de **información** (ⓘ).
Se despliega una tarjeta con:

```
Información
  Tipo                    Clima
  Privacidad              Anónima          ← aquí
  Mínimo por grupo        5 respuestas     ← solo aparece si es anónima
  Audiencia               520 invitados
  Fecha de inicio         15/01/2026
  Fecha de finalización   30/01/2026
```

En una encuesta pública la fila **Privacidad** dice `Pública` y la fila **Mínimo por grupo**
**no aparece en absoluto**.

**b) Desde el constructor.**
Abre la encuesta con **Editar** → paso **Datos generales** → el bloque de visibilidad muestra
`Público` o `Anónimo` seleccionado, y debajo el texto de la promesa que se le hace al
participante:

> *Anónimo:* «Ninguna respuesta se muestra de forma individual. Los resultados de un grupo (por
> ejemplo, un área o una sede) solo se muestran una vez que alcanza el número mínimo de
> respuestas que definas abajo.»
>
> *Público:* «Al marcar esta opción, tu encuesta será pública. Esto quiere decir que se podrá
> ver quién respondió y qué respondió cada participante.»

**c) Desde un reporte descargado.**
El **pie de cada página del PDF** lo dice:

- Anónima → «Los grupos con menos de 5 respuestas se reportan como "Reservado".»
- Pública → «Encuesta nominal: los resultados pueden atribuirse.»

### 1.4 Qué demográficos trae cada encuesta

Todas las encuestas de ejemplo se pueden cortar por los mismos seis:

| Demográfico | Sirve para agrupar | Nota |
|---|---|---|
| **Área** | sí | es el corte por defecto en todas partes |
| **Líder** | sí | **no** se puede desplegar en el PDF — ver [§8.7](#87-líder-el-corte-que-no-viaja-en-el-pdf) |
| **País** | sí | |
| **Edad** | sí | |
| **Género** | sí | |
| **Colaborador** | **no** | una fila por persona; solo aparece en Participación |

Ninguno se le pregunta al participante: los seis vienen precargados de la plataforma y sirven
para leer los resultados. Por eso **la vista previa de estas encuestas no tiene página de datos
demográficos** — no hay nada que preguntar.

---

## 2. El recorrido completo

```
        ┌──────────────────────────────────────────────────────────┐
        │  LISTA DE ENCUESTAS                                      │
        │  · métricas arriba  · pestañas Encuestas / Datos Demog.  │
        │  · una fila por encuesta  · barra de acciones abajo      │
        └───────┬──────────────────┬───────────────────┬───────────┘
                │                  │                   │
      "Crear encuesta"      "Vista previa"      "Ver resultados"
                │                  │                   │
                ▼                  ▼                   ▼
     ┌──────────────────┐  ┌──────────────┐  ┌────────────────────────┐
     │  CONSTRUCTOR     │  │ VISTA PREVIA │  │  RESULTADOS            │
     │  5 pasos         │─▶│ (panel 80%)  │  │  5 pestañas            │
     │  1 Datos grales. │  └──────────────┘  │  Participación         │
     │  2 Participantes │                    │  Favorabilidad         │
     │  3 Demográficos  │                    │  Preguntas             │
     │  4 Secciones     │                    │  eNPS                  │
     │  5 Bienv. y cierre│                   │  Análisis con IA       │
     └──────────────────┘                    └───────┬────────────────┘
                                                     │
                                          "Descargar información"
                                                     ▼
                                        ┌────────────────────────────┐
                                        │  CENTRO DE DESCARGAS       │
                                        │  Reportes | Descargas      │
                                        │  5 tipos de archivo        │
                                        └────────────────────────────┘
```

**Reglas de acceso que conviene tener claras desde el principio:**

- Una encuesta en **Borrador** no tiene resultados: solo se puede editar, previsualizar o
  eliminar.
- Los **resultados se abren también con la encuesta En curso**, no hace falta esperar a que
  cierre. La miga de pan de arriba muestra el estado real (`En curso` en ámbar,
  `Finalizada` en verde) para que nadie confunda un dato parcial con uno definitivo.
- El **constructor bloquea los pasos hacia adelante**: no es decoración, es un candado real.

---

## 3. La lista de encuestas

### 3.1 Qué se ve

Tres capas, de arriba abajo:

1. **Tarjetas de métricas** — resúmenes accionables (en curso, por cerrar, participación baja).
   Al pulsar una, la lista de abajo se filtra por ella.
2. **Pestañas** `Encuestas` · `Datos Demográficos`.
3. **La tabla** — una fila por encuesta con nombre, tipo, estado, fechas, participantes y avance.

Abajo flota la **barra de acciones**. Lo que muestra depende de la selección:

| Selección | Qué ofrece la barra |
|---|---|
| Nada seleccionado | `Crear encuesta` (con `Crear en blanco` / `Crear con plantilla`) y `Comparar encuestas` |
| **Una** encuesta marcada | las acciones de *esa* encuesta, según su estado |
| **Varias** marcadas | `Duplicar (N)` · `Exportar (N)` · `Eliminar (N)` |

> Con encuestas marcadas, los botones de crear y comparar **desaparecen** de la barra: son
> acciones sobre la lista entera y no sobre lo seleccionado, y dejarlas ahí invita a pulsarlas
> por error.

### 3.2 Qué acciones ofrece cada estado

Cada estado ofrece solo lo que se puede hacer honestamente con él. No hay botones apagados: lo
que no aplica, no está.

| Estado | Acciones, en orden |
|---|---|
| **Borrador** | Editar · Vista previa · Eliminar |
| **En curso** | Ver resultados · Vista previa · Editar · Duplicar · Finalizar encuesta · Editar fechas · Editar participantes · Compartir encuesta · Eliminar |
| **Finalizado** | Ver resultados · Vista previa · Duplicar · Reabrir encuesta · Eliminar |

Las cinco primeras se muestran como iconos; el resto se pliega en **Más acciones**.

### 3.3 Casos de uso

#### CASO 1 — Abrir los resultados de una medición

**Encuesta:** Clima Organizacional - Q1 2026

1. En la tabla, marca la casilla de la fila.
2. En la barra inferior pulsa **Ver resultados**.
3. **Qué debe pasar:** se abre la pantalla de resultados en la pestaña **Participación**. La
   miga de pan de arriba dice `Encuestas › Clima Organizacional - Q1 2026` con la etiqueta verde
   `Finalizada`.
4. Para volver, pulsa `Encuestas` en la miga de pan.

#### CASO 2 — Ver la encuesta como la vio quien respondió

**Encuesta:** cualquiera.

1. Marca la fila → **Vista previa**.
2. **Qué debe pasar:** se abre un panel que ocupa el 80% de la pantalla, en la página de
   bienvenida.
3. Detalle a comprobar: en **Clima Organizacional - Q1 2026** la bienvenida dice *«Esta medición
   no es anónima. Tus respuestas quedan asociadas a tu nombre…»*, mientras que en cualquier
   anónima dice *«Tus respuestas son anónimas. Los resultados se muestran siempre agrupados,
   nunca de forma individual.»*

#### CASO 3 — Finalizar una encuesta que sigue abierta

**Encuesta:** Pulso de Bienestar - Ago 2026 (En curso).

1. Marca la fila → **Más acciones** → **Finalizar encuesta**.
2. Aparece un diálogo:

   > **¿Finalizar esta encuesta?**
   > Pulso de Bienestar - Ago 2026 dejará de admitir respuestas de inmediato. Podrás consultar
   > sus resultados, pero quienes aún no hayan respondido ya no podrán hacerlo.
   > `Cancelar` · `Finalizar encuesta`

3. Confirma.
4. **Qué debe pasar:** toast `Pulso de Bienestar - Ago 2026 finalizada`; la fila pasa a
   `Finalizado`, su avance a 100% y **su fecha de cierre pasa a ser hoy** — dejar una fecha
   futura afirmaría que sigue corriendo.

#### CASO 4 — Reabrir una encuesta cerrada

**Encuesta:** cualquiera Finalizada.

1. Marca la fila → **Reabrir encuesta**.
2. **No se abre un modal.** La tabla muestra arriba un aviso —`Reabriendo <nombre>`— y la celda
   de fecha de esa fila se convierte en un selector con el rótulo `Reabrir hasta`. Hay que decir
   hasta cuándo vuelve a estar abierta.
3. Pulsa `Reabrir`.
4. **Qué debe pasar:** toast `<nombre> vuelve a estar en curso hasta el 30 sep 2026`, y la fila
   pasa a `En curso`.

#### CASO 5 — Eliminar una encuesta (con confirmación por nombre)

1. Marca **una** fila → **Eliminar**.
2. Aparece el diálogo:

   > **¿Eliminar esta encuesta?**
   > Cultura y Valores - 2026 y sus respuestas se eliminarán definitivamente. Esta acción no se
   > puede deshacer.

3. **Ojo:** para una sola encuesta, el botón `Eliminar` **no se activa hasta que escribas el
   nombre exacto** de la encuesta en el campo de confirmación. Es deliberado: es la acción menos
   reversible del producto.
4. **Qué debe pasar:** toast `Cultura y Valores - 2026 eliminada`.

Con **varias** encuestas marcadas el diálogo cambia a `¿Eliminar 3 encuestas?` y **no** pide
escribir nada — no hay un solo nombre que escribir.

#### CASO 6 — Duplicar

1. Marca una fila → **Duplicar**.
2. **Qué debe pasar:** aparece una copia **justo debajo** del original, llamada
   `<nombre> (copia)`, en estado `Borrador`, con **0 participantes y 0% de avance**. Una copia
   no hereda respuestas. Toast: `<nombre> duplicada`.

#### CASO 7 — Acciones que todavía no hacen nada

Dos botones existen pero anuncian que la función está por llegar. No son errores:

| Acción | Mensaje |
|---|---|
| `Crear con plantilla` | `Las plantillas llegan en el siguiente paso.` |
| `Compartir encuesta` | `Enlace de <nombre> copiado al portapapeles` *(no hay enlace real detrás)* |
| `Exportar (N)` | `Exportando N encuestas` *(no genera archivo)* |

---

## 4. Crear una encuesta: los cinco pasos

### 4.1 El orden y por qué está bloqueado

El panel de la izquierda es un **stepper real**: los pasos se recorren en orden y cada uno se
desbloquea cuando el anterior está completo.

| # | Paso | Se considera completo cuando… |
|---|---|---|
| 1 | **Datos generales** | hay nombre, tipo y las dos fechas |
| 2 | **Participantes** | hay al menos un participante seleccionado |
| 3 | **Datos demográficos** | lo has abierto **y** (o está desactivado, o tiene al menos un dato) |
| 4 | **Secciones y preguntas** | hay al menos una pregunta, **ninguna sección está vacía** y **todas las preguntas están completas** |
| 5 | **Bienvenida y cierre** | siempre (es opcional) |

Cada paso muestra su estado con un círculo: **número** (disponible), **check verde**
(completo), **candado** (bloqueado), **relleno azul** (donde estás), **rojo** (falló al
finalizar).

> **Participantes va antes que el contenido a propósito.** Decidir a quién se le pregunta cambia
> qué vale la pena preguntar; dejarlo para el final convierte la audiencia en un trámite.

### 4.2 Qué pasa si intentas saltarte un paso

Da igual cómo lo intentes —pulsando el paso en el menú, pulsando **Continuar**, o usando un
botón de la barra inferior—: el producto responde igual. Busca **el primer paso incompleto** y
te dice qué falta:

| Lo que falta | Mensaje exacto |
|---|---|
| Datos generales | `Completa el nombre, el tipo y las fechas de la encuesta para continuar.` |
| Participantes | `Selecciona al menos un participante para continuar.` |
| Demográficos | `Si usas datos demográficos, activa o crea al menos un dato demográfico para continuar.` |
| Hay preguntas pero alguna sección está vacía | `Todas las secciones deben tener al menos una pregunta para continuar.` |
| No hay ninguna pregunta | `Añade al menos una sección con preguntas para continuar.` |

Además, si lo que falta son **Datos generales**, los campos vacíos se marcan en rojo en el
formulario. No se marcan antes: un formulario en blanco no debe recibirte con errores.

### 4.3 "Finalizar": la revisión completa

En el último paso el botón cambia de `Continuar` a **`Finalizar`**. A diferencia de `Continuar`,
que solo mira el paso actual, **`Finalizar` revisa los cinco a la vez**.

**Si todo está bien:** toast `Encuesta guardada` y vuelves a la lista, con la encuesta ya
añadida como `Borrador`.

**Si algo falta:**

1. **Todos** los pasos incompletos se marcan en rojo en el panel izquierdo — el cuadro
   completo de una vez, no un error cada vez.
2. Te deja **en el primero** que falla.
3. Si el problema es una pregunta incompleta, no te deja en el paso: **te abre esa pregunta
   concreta y hace scroll hasta ella**.
4. Sale **un solo mensaje**, que resume:

```
1 paso incompleto:
   "Completa el nombre, el tipo y las fechas de la encuesta."

2 pasos incompletos:
   "Completa el nombre, el tipo y las fechas de la encuesta y 1 paso más por completar."

4 pasos incompletos:
   "Completa el nombre, el tipo y las fechas de la encuesta y 3 pasos más por completar."
```

Los textos base de cada paso:

| Paso | Frase |
|---|---|
| Datos generales | `Completa el nombre, el tipo y las fechas de la encuesta` |
| Participantes | `Selecciona al menos un participante para finalizar` |
| Datos demográficos | `Activa al menos un dato demográfico o desactívala` |
| Secciones (falta contenido) | `Añade al menos una sección con preguntas` |
| Secciones (pregunta incompleta) | `Completa los campos obligatorios de la pregunta señalada` |

**Los pasos que se arreglan dejan de estar rojos solos**, sin volver a pulsar Finalizar.

### 4.4 El paso 1 en detalle: dónde se decide el anonimato

En **Datos generales**, además del nombre, tipo, fechas y descripción (máx. 450 caracteres),
está la decisión que gobierna medio producto:

- **Público** — «se podrá ver quién respondió y qué respondió cada participante».
- **Anónimo** — aparece debajo un control para fijar el **mínimo de respuestas por grupo**:

  > «Un grupo solo verá sus resultados cuando al menos **5** personas hayan respondido.»

  El botón `−` se **deshabilita en 3**. No es un capricho: con dos respuestas cada participante
  puede deducir la del otro, así que por debajo de 3 el mínimo deja de proteger a nadie.
  El valor por defecto es **5**.

**No hay opción intermedia**, y es a propósito: o el sistema guarda el vínculo entre persona y
respuesta, o no lo guarda. Un término medio sería una promesa que no se puede cumplir.

---

## 5. Paso 4 en detalle: secciones, subsecciones y preguntas

Es el paso más largo del constructor y donde se concentran las dudas.

### 5.1 Cómo está organizado

Una encuesta tiene **hasta tres niveles**:

```
1.  Sección                 ← el bloque grande: "Liderazgo"
    1.1  Subsección         ← el tema: "Mi líder directo"
        1.1.1  Sub-subsección   ← el matiz: "Confianza"
```

**Más de tres niveles no se puede.** Si lo intentas, el producto avisa:
`Alcanzaste el máximo de 3 niveles`.

La numeración (`1`, `1.1`, `1.2.3`) **no se escribe: se calcula sola por la posición**. Al
mover o reordenar cualquier cosa, todos los números se recalculan al instante.

### 5.2 La pantalla, de izquierda a derecha

**Panel izquierdo** — los cinco pasos arriba y, debajo, el árbol navegable de la encuesta. Se
colapsa solo a los 8 segundos para dejar sitio, y se vuelve a abrir con su botón.

**Panel central** — el contenido. Cada sección de nivel 1 es una tarjeta; dentro, las
subsecciones cuelgan como filas de un esquema con su chip de nivel.

**Barra inferior** — las acciones de creación (`Añadir sección`, `Añadir subsección`,
`Añadir pregunta`, `Banco de preguntas`), el importador, `Vista previa`, `Guardar encuesta` y,
a la derecha, `Continuar` / `Finalizar`.

En esa misma barra hay un icono de **información** (ⓘ) con el recuento vivo de la encuesta:

```
Participantes        6.760
Secciones            7
Preguntas            54
Datos demográficos   6
Tiempo estimado      27 min
```

### 5.3 Las cinco reglas de la experiencia

Son deliberadas. Si algo "se cierra solo", casi siempre es una de estas:

1. **Solo hay una rama abierta a la vez.** Abrir una subsección cierra la que estaba abierta en
   su mismo nivel. Es lo que impide que el panel crezca hasta ser una columna infinita.
2. **El árbol de la izquierda y el panel central son la misma cosa vista dos veces.** Lo que se
   abre en uno se abre en el otro.
3. **Solo hay un formulario de pregunta abierto en toda la encuesta.** Abrir otra pregunta mueve
   el formulario, no abre un segundo.
4. **No hay "guardar" en las preguntas.** Cada tecla se escribe directamente en la encuesta. Por
   eso no existe "descartar cambios": no hay borrador intermedio que descartar.
5. **Tocar cualquier parte de la cabecera de una fila la selecciona**, no solo el título. La
   selección es lo que resalta el árbol y a lo que apuntan los botones de la barra.

### 5.4 Crear

| Quiero… | Cómo |
|---|---|
| Una sección nueva de nivel 1 | Barra inferior → **Añadir sección**. Nace al final, con el nombre en modo edición. |
| Una subsección dentro de la actual | Barra inferior → **Añadir subsección**, o el botón `Crear subsección` de una sección vacía |
| Una subsección **hermana** (mismo nivel) | Estando en una subsección: **Añadir subsección** → menú → la primera opción |
| Una pregunta | Barra inferior → **Añadir pregunta**, o `Añadir pregunta` al final de la lista de una subsección |
| La primera pregunta de una subsección | El botón punteado `Añadir la primera pregunta` |
| Varias preguntas de golpe | Barra inferior → **Banco de preguntas** → marca varias → confirma. Toast: `Se añadieron 5 preguntas.` |
| Importar desde un archivo | Barra inferior → el importador (ver [§5.8](#58-importar-secciones-desde-un-archivo)) |

**El menú de "Añadir subsección" cuando estás dentro de una subsección.**
Si la fila activa es de nivel 2 o 3, el botón no crea directamente: abre un menú titulado
`Añadir subsección` con dos opciones, y hay que leerlas porque hacen cosas distintas:

| Estás en… | Opción 1 | Opción 2 |
|---|---|---|
| Una **subsección** (nivel 2) | `Subsección (nivel 2)` — «Crea otra subsección al mismo nivel, debajo de esta.» | `Sub-subsección (nivel 3)` — «Crea una subsección dentro de esta.» |
| Una **sub-subsección** (nivel 3) | `Sub-subsección (nivel 3)` — «Crea otra subsección al mismo nivel, debajo de esta.» | `Subsección (nivel 2)` — «Crea una subsección de nivel 2, debajo de tu subsección actual.» |

Por eso el botón **nunca se oculta**, ni siquiera en el nivel 3: aunque no se pueda bajar más,
siempre se puede crear una hermana.

**Una sección vacía te ofrece las dos salidas:**

> **Esta sección está vacía**
> Las secciones pueden contener preguntas o subsecciones. Crea una subsección para organizar el
> contenido, o crea directamente una pregunta.
> `Crear subsección` · `Crear pregunta`

Si eliges `Crear pregunta` sobre una sección de nivel 1, el producto **crea la subsección que la
pregunta necesita y te deja escribiendo la pregunta** — un clic en vez de dos.

### 5.5 Mover

Hay **dos formas** y hacen cosas distintas. Confundirlas es la causa más común de "no me deja
mover esto".

#### a) Arrastrar — reordena entre hermanas

Agarra la fila por el asa de puntos (⠿) y suéltala sobre otra.

- Funciona **en cualquier nivel**, incluidas las secciones de nivel 1.
- Se lleva **todo lo que cuelga** de la fila.
- **Solo reordena entre filas del mismo padre.** Si sueltas sobre una fila de otra rama, **no
  pasa nada**: no se reparenta por accidente. No es un fallo, es la protección.
- Las **preguntas** solo se reordenan **dentro de su propia subsección**. Arrastrarlas a otra no
  hace nada.

#### b) "Mover a…" — cambia de sitio de verdad

El icono de mover (✥) aparece al lado del de borrar en cada fila de subsección y en cada fila de
pregunta. Abre una lista con **todos los destinos válidos**, con su número y su nivel.

**Lo que hay que saber, y sorprende la primera vez:**

> Una subsección movida **se coloca justo debajo del destino, como su hermana**, y por tanto
> **adopta el nivel del destino**. Mover una subsección de nivel 2 junto a una de nivel 3 la
> convierte en nivel 3. Y al revés.

La lista **solo muestra destinos posibles**, así que no hay forma de romper el árbol:

- No aparece ella misma, ni su padre actual, ni nada que cuelgue de ella (sería un bucle).
- No aparece un destino donde el bloque no cabría por profundidad.
- Si la subsección **lleva preguntas**, no aparecen destinos de nivel 1.

Si no hay ningún destino, el botón sale apagado con el aviso:
`No hay otra sección o subsección donde moverla`.

**Después de mover:** toast `Subsección movida` o `Pregunta movida`, la vista salta al destino
para que veas dónde quedó, y cualquier formulario de pregunta abierto se cierra.

### 5.6 Eliminar

El comportamiento cambia según lo que se lleve por delante:

| Lo que borras | Qué pasa |
|---|---|
| Sección **vacía** (sin preguntas ni subsecciones) | Se borra **de inmediato**, sin preguntar |
| Sección **con contenido** | Aparece un aviso **dentro de la propia fila** (no un modal) |

El aviso dice exactamente lo que se lleva:

> Se eliminará junto con **3 subsecciones** y **12 preguntas**. Esta acción no se puede deshacer.
> `Cancelar` · `Eliminar`

Y si no arrastra nada: `Esta acción no se puede deshacer.`

**Detalles de comportamiento:**

- Solo puede haber **un borrado pendiente a la vez**.
- Mientras el aviso está arriba, hacer clic en la cabecera **no** cambia de sección: esa fila
  solo responde a la pregunta que está haciendo.
- Al confirmar: toast `Sección eliminada` / `Subsección eliminada`, y la selección salta a la
  fila que ocupó su lugar.
- **La última sección de nivel 1 no se puede borrar.** Su botón sale apagado con el tooltip
  `La encuesta debe tener al menos una sección`. Las subsecciones no tienen esa protección.
- El borrado vive **solo en el panel central**. El árbol de la izquierda no tiene botón de
  borrar.

### 5.7 Las preguntas

**Tipos disponibles:** Escala de valoración · Pregunta abierta · Opción única · Múltiples
respuestas · Desplegable.

**Escalas:** Likert (escala de preferencias) · NPS (recomendabilidad) · Visual por estrellas ·
Visual por emociones · Escala lineal · Likert (NOM 035).

**Qué exige cada configuración** — una pregunta a la que le falte algo de esto **impide
finalizar**:

| Siempre | El enunciado no puede estar vacío |
|---|---|
| Si es escala | hay que elegir **qué escala** |
| Si es Likert | hay que elegir **qué mide** (acuerdo, frecuencia, satisfacción o importancia) |
| Si es de opciones | mínimo **2 opciones**, y **ninguna vacía** |

**Cosas que conviene saber:**

- Cambiar el tipo de una pregunta **no borra lo que ya habías configurado**: apaga lo que no
  aplica y lo recupera si vuelves. Ir y volver no pierde trabajo.
- **Duplicar** inserta la copia justo debajo y te deja editando **la copia**.
- `Escape` cierra el formulario. Si el aviso de borrado está abierto, `Escape` cancela **ese**
  primero.
- Las escalas **NPS, estrellas, emociones y lineal** pueden encender **preguntas de
  profundidad**: un seguimiento distinto para detractores, neutros y promotores. Es lo que
  luego alimenta la vista *Profundidad* de los resultados.
- Solo **Likert** y **NOM 035** ofrecen el paso explícito «No sabe / no responde».

### 5.8 Importar secciones desde un archivo

Barra inferior → el importador. Acepta **.md, .markdown, .txt, .csv y .xlsx**. PDF y Word se
rechazan por extensión.

**En Markdown o texto plano:**

```markdown
# Liderazgo
Cómo se percibe a los líderes.

## Cercanía
- Mi líder me da retroalimentación útil [escala]
- ¿Qué cambiarías de tu líder? [abierta]

## Reconocimiento
- ¿Con qué frecuencia recibes reconocimiento? [opción única]
  - Nunca
  - A veces
  - Siempre
```

- `#` → Sección · `##` → Subsección · `###` → Sub-subsección
- El párrafo pegado al encabezado es la **descripción** de la sección.
- Cada viñeta es una **pregunta**; las viñetas indentadas debajo son sus **opciones**.
- La etiqueta final marca el tipo: `[escala]`, `[abierta]`, `[opción única]`, `[múltiple]`,
  `[desplegable]`. Sin etiqueta → escala.

**En CSV o XLSX:** columnas `seccion`, `subseccion`, `subsubseccion`, `pregunta`, `tipo` y
`opciones` (separadas por `|`).

**Qué debe pasar:** las secciones se **añaden** a lo que ya había (no lo reemplazan), la vista
salta a la primera importada, y sale el toast
`Se importaron 1 sección y 3 preguntas.`

**Si el archivo no sirve:**

| Situación | Mensaje |
|---|---|
| Se leyó pero no había estructura | `No se detectaron secciones` |
| No se pudo leer | `Archivo no válido` |

> ⚠️ **Limitación conocida.** Si el archivo describe una jerarquía **más profunda de tres
> niveles**, lo que sobra **se descarta en silencio** — y el recuento del toast cuenta lo que
> traía el archivo, no lo que realmente entró. Revisa el árbol después de importar un archivo
> profundo. Reproducción en [§12](#12-cuando-algo-no-cuadra).

### 5.9 Casos de uso del paso 4

#### CASO 8 — Construir un bloque completo desde cero

1. Con los pasos 1–3 completos, entra en **Secciones y preguntas**. Si la encuesta está vacía,
   el producto crea la primera sección al entrar.
2. Escribe el título: `Liderazgo`.
3. `Crear subsección` → escribe `Mi líder directo`.
4. `Añadir la primera pregunta` → escribe el enunciado → elige **Likert** → **Frecuencia**.
5. `Añadir pregunta` para la segunda.
6. Con la subsección seleccionada, barra inferior → **Añadir subsección** → menú → *hermana* →
   nace `Reconocimiento` justo debajo.
7. **Qué debe comprobar:** el ⓘ de la barra inferior actualiza el recuento (`Secciones 3 ·
   Preguntas 2 · Tiempo estimado 1 min`), y el árbol izquierdo muestra `1 Liderazgo` con `1.1` y
   `1.2` colgando.

#### CASO 9 — Convertir una subsección en sub-subsección

1. Ten `1.1 Cercanía`, `1.2 Reconocimiento` y, dentro de 1.2, `1.2.1 Formas de reconocer`.
2. En la fila de `1.1` pulsa **Mover** (✥).
3. En la lista aparece `1.2.1 Formas de reconocer` marcada como **Sub-subsección**.
4. Elígela.
5. **Qué debe pasar:** `Cercanía` se convierte en **nivel 3** y pasa a numerarse `1.2.2`. Toast
   `Subsección movida`. La vista salta ahí.
6. **Si NO aparece `1.2.1` en la lista:** es porque `Cercanía` tiene subsecciones propias y el
   bloque entero no cabría en tres niveles. Es correcto.

#### CASO 10 — El bloqueo por sección vacía

1. Crea `Sección 1` → `1.1` con una pregunta completa.
2. Crea `Sección 2` y **déjala vacía**.
3. Pulsa **Continuar**.
4. **Qué debe pasar:** no avanza. Toast
   `Todas las secciones deben tener al menos una pregunta para continuar.`
5. Ojo al matiz: una sección **contenedora** (sin preguntas propias pero con subsecciones llenas)
   **sí es válida**. Lo que no vale es una sección sin preguntas **ni** subsecciones.

#### CASO 11 — El bloqueo por pregunta incompleta

1. Añade una pregunta y **déjala sin enunciado**.
2. Ve hasta el último paso y pulsa **Finalizar**.
3. **Qué debe pasar:**
   - El paso *Secciones y preguntas* se marca rojo en el panel izquierdo.
   - La vista salta a esa sección, **abre esa pregunta** y hace scroll hasta ella.
   - El campo del enunciado se marca en rojo.
   - Toast: `Completa los campos obligatorios de la pregunta señalada.`

---

## 6. La vista previa

### 6.1 Qué es y qué no es

Es un **ensayo**: reproduce el recorrido página a página, tal como lo vería quien responde.

- **Lee la encuesta en vivo**: cierra, cambia una pregunta, vuelve a abrir y el cambio está ahí.
- **Las respuestas que escribas se tiran al cerrar.** Cada apertura empieza de cero, en la
  primera página. Es a propósito: se abre para ver la encuesta con ojos nuevos.

**Para abrirla:** desde el constructor, botón **Vista previa** de la barra inferior; o desde la
lista, acción **Vista previa** de la fila.

**Si la encuesta no tiene ni una pregunta**, el botón no abre nada y avisa:
`Añade al menos una pregunta para ver la vista previa.`

### 6.2 Qué se convierte en página y qué no

Esta es la duda número uno sobre la vista previa:

> **Una sección se convierte en página solo si tiene preguntas propias.**

Como las secciones de nivel 1 suelen ser contenedores, **normalmente no generan página**: las
páginas son sus subsecciones. Una sección de nivel 1 no desaparece del índice — sigue estando
como encabezado, para decir a qué bloque pertenece lo que estás respondiendo — pero no se puede
saltar a ella porque no hay nada que responder ahí.

El orden completo de páginas es:

```
1.  Bienvenida            (si está activada)
2.  Datos demográficos    (solo si algún demográfico se le PREGUNTA al participante)
3.  Una página por cada subsección con preguntas, en el orden del árbol
4.  Cierre                (si está activada)
```

> En las encuestas de ejemplo **no hay página de demográficos**: sus seis demográficos vienen
> precargados de la plataforma y no se preguntan.

### 6.3 Cómo se lee dónde estás

La cabecera tiene dos bandas:

```
┌────────────────────────────────────────────────────────────────────┐
│ [Vista previa]  Clima Organizacional - Q1 2026   12 de 40 respondidas ▓▓░ 30%  [Contenido ▾] [✕] │
├────────────────────────────────────────────────────────────────────┤
│ 2. Liderazgo  ›  Subsección 2.1 · Mi líder directo          4 / 11 │
└────────────────────────────────────────────────────────────────────┘
```

- La **miga de pan** repite los ancestros de la página. Está ahí porque la portada se va
  scrolleando y, tres pantallas más abajo, la pregunta que respondes sigue teniendo que decir a
  qué subsección pertenece.
- **`Contenido`** despliega el índice completo, con el avance de cada página. Desde ahí se salta
  a cualquiera.
- El contador de la derecha es `página actual / total`.

Abajo: `Anterior`, los puntitos de navegación y el botón principal. Con **más de 14 páginas**
los puntitos se sustituyen por `Página 7 de 22` — cuarenta puntos idénticos dejan de ser un mapa.

El botón principal dice `Siguiente`, salvo cuando la siguiente es la página de cierre
(`Enviar y finalizar`) o cuando ya estás en la última (`Cerrar vista previa`).

### 6.4 Por qué a veces las preguntas salen en tabla y a veces en tarjetas

Cuando **varias preguntas seguidas comparten exactamente la misma escala Likert**, se agrupan en
una **matriz**: la escala se escribe una sola vez arriba y cada enunciado es una fila.

Es lo que hace que una batería de ocho enunciados quepa en una pantalla, y lo que permite
compararlos entre sí.

**Se rompe la matriz —y es correcto— cuando:**

- Una pregunta del medio mide otra cosa (frecuencia entre dos de acuerdo).
- Una tiene activado «No sabe / no responde» y las otras no.
- La pregunta no es Likert (una NPS, una abierta, una de opciones) — esas siempre van en su
  propia tarjeta.
- **Queda una sola pregunta en el grupo**: una matriz de una fila es una pregunta con sus
  opciones escritas dos veces, así que se degrada a tarjeta.

#### CASO 12 — Reproducir la ruptura de la matriz

1. Crea tres preguntas Likert seguidas, todas de **Grado de acuerdo**.
2. Abre la vista previa → se ven como **una tabla**.
3. Cierra, cambia la **segunda** a **Frecuencia**, reabre.
4. **Qué debe pasar:** ahora hay **tres tarjetas sueltas** (cada grupo quedó de una sola
   pregunta). Devuelve la segunda a *Grado de acuerdo* y vuelve a salir una única matriz.

---

## 7. Resultados: qué responde cada pestaña

Cinco pestañas sobre la misma medición. Cada una responde una pregunta distinta:

| Pestaña | La pregunta que responde |
|---|---|
| **Participación** | ¿Quién respondió y quién falta? |
| **Favorabilidad** | ¿Qué tan bien salió, y dónde? |
| **Preguntas** | ¿Qué respondió la gente, una por una? |
| **eNPS** | ¿Nos recomiendan? |
| **Análisis con IA** | ¿Qué hago con todo esto? |

**Lo que se comparte entre pestañas:** el demográfico elegido. Pasar de "participación por área"
a "heatmap por área" es un solo pensamiento, así que no hay que volver a elegirlo al llegar.

### 7.1 Los cuatro controles que aparecen en varias pestañas

Están en la esquina superior derecha del panel y conviene distinguirlos bien:

| Control | Qué hace | Qué **no** hace |
|---|---|---|
| **Ver por** | elige el demográfico que forma las columnas o las filas | no filtra |
| **Filtros** ("Filtrar a fondo") | **recalcula** los números para una población más estrecha | no oculta filas |
| **Niveles** | apaga los **números** de un nivel (secciones, subsecciones, sub-subsecciones, preguntas) | **no borra la fila**: la deja como estructura, en blanco |
| **Resaltar** | atenúa lo que cae fuera de las bandas marcadas | no cambia ningún número |

Dos cosas que sorprenden y son correctas:

- **Al cambiar "Ver por", se cae el filtro sobre ese mismo demográfico.** Si estabas filtrando
  por Área y pones Área como desglose, el filtro se elimina: una vez es las columnas, filtrar
  por él no dice nada.
- **Los filtros se comparten entre las vistas de una misma pestaña.** Si estrechas a
  `País: Colombia` en el heatmap y saltas a *Secciones*, sigues estrechado. Es deliberado.

### 7.2 Participación

**Arriba, cuatro cifras:** `Total de participación` · `Completadas` · `En progreso` · `Faltan`.

**Debajo, la tabla** por el demográfico elegido en `Ver por:`, con Respondieron / En progreso /
Faltan / Participación por grupo. Es **la única vista que acepta el demográfico "Colaborador"**,
donde cada fila es una persona: es la vista que existe para responder *¿quién falta?*.

**Los grupos se pueden marcar** con casillas. Al marcarlos, la barra inferior cambia y el botón
de recordatorio se ajusta:

```
Sin marcar nada:   "Enviar recordatorio a los faltantes · 37 participantes"
1 grupo marcado:   "Enviar recordatorio · 1 área · 3 participantes"
Varios marcados:   "Enviar recordatorio · 4 áreas · 19 participantes"
Marcando personas: "Enviar recordatorio · 4 participantes"
```

> El recordatorio **nunca cuenta a quien ya respondió**. La cifra es siempre "los que faltan",
> no el tamaño del grupo.

La selección se **pierde al cambiar de pestaña**, a propósito: no significa nada en las otras.

### 7.3 Favorabilidad

**Cinco cifras arriba:** `Total de favorabilidad`, `Favorables`, `Neutrales`, `Desfavorables`,
`No sabe / No responde`.

> **Qué es la favorabilidad:** el porcentaje de respuestas favorables en una escala de 1 a 5,
> considerando favorables **el 4 y el 5**. La fórmula está en el ⓘ de la primera tarjeta.

Debajo, un interruptor con **dos vistas**.

#### a) Vista **Secciones** — "Detalle por secciones"

Es el mapa completo, **con la misma jerarquía que escribió quien construyó la encuesta**: cada
sección de nivel 1 es una tarjeta que se abre; dentro, las subsecciones como filas de esquema
con su chip de nivel; dentro, las preguntas.

Cada fila trae la distribución en barra, los porcentajes de desfavorable/neutral/favorable, el
puntaje 1–5 y el chip de favorabilidad.

**Una pregunta sin escala no toma prestada una barra que no significa nada:** una abierta o una
de opción única dice qué es y cuántas personas respondieron, y ya.

El orden por defecto es el de la encuesta; se puede voltear a **peor primero** para decidir.

#### b) Vista **Heatmap** — la grilla

Filas = secciones, subsecciones y preguntas. Columnas = los grupos del demográfico elegido.

Arranca colapsado a las secciones de nivel 1, **salvo la primera**, que se abre entera como
ejemplo de lo que la grilla puede mostrar.

**Los seis estados de una celda** — esto es lo que más se pregunta:

| Se ve | Significa | Al pasar el ratón dice |
|---|---|---|
| Un número con color | el promedio 1–5 de ese cruce | la banda, respuestas y participantes |
| Un número **gris** | está fuera de las bandas marcadas en *Resaltar* | lo mismo |
| 🔒 (candado) | **Reservado**: el grupo tiene respuestas pero no llega al mínimo | «Por debajo del mínimo para mostrar resultados de este grupo.» |
| `—` | **Sin respuestas**: nadie de ese grupo ha respondido | «Todavía nadie de este grupo ha respondido.» |
| Icono de mensaje | **Sin escala**: esa fila no tiene nada de 1 a 5 (abierta, opciones, NPS) | «Sin escala» |
| Caja vacía | ese nivel está desmarcado en *Niveles* | «Resultados ocultos: marca este nivel en el filtro de Niveles.» |

**La primera columna se queda fija** al desplazarse. Sin eso, leer el décimo grupo significa
leer números cuya fila ya no se ve.

**El demográfico "Colaborador" no aparece en `Ver por`** aquí: una grilla donde cada columna es
una persona tendría casi todas las celdas reservadas y una sola columna legible.

### 7.4 Preguntas

**Cinco cifras arriba:** `Preguntas`, `Respuestas registradas`, `Personas con respuesta`,
`Comentarios abiertos`, `Sentimiento promedio`.

**Tres vistas**, y están conectadas entre sí — eso es lo que las hace una sola pantalla:

#### a) **Secciones**

El recuento de cada opción de respuesta, leído sobre el árbol de la encuesta con la misma
jerarquía. Por cada pregunta: cuántas personas eligieron cada opción y qué porcentaje es.

**Atajo:** al pulsar una fila de recuento, saltas a **Por persona** con la lista ya acotada a
esas personas. Al pulsar una pregunta abierta, saltas a **Comentarios** filtrado a ella.

#### b) **Por persona**

Una fila por participante, con su promedio, cuántas respondió y cuándo la envió. Al abrir una,
se ve su ficha completa: qué contestó a cada pregunta.

**Aquí es donde el anonimato se nota más:**

| Encuesta | Qué se ve en cada fila |
|---|---|
| **Pública** (Clima Q1 2026, NPS) | nombre real, iniciales, correo, área, líder, país, género y edad |
| **Anónima** | `Participante 1`, `Participante 2`… **y ningún demográfico** |

> Y es intencional. Un demográfico **es** un identificador: «Marketing, Colombia, 18–24, mujer»
> reduce una lista de 450 personas a una sola igual de bien que un nombre. Por eso en una
> encuesta anónima la ficha individual sigue siendo legible, pero **no atribuible**.

#### c) **Comentarios**

Todas las respuestas abiertas, cada una con la pregunta de la que viene, el sentimiento que le
puso la IA, su confianza y su tema.

- Se pueden **buscar** y **filtrar** por sentimiento, tema y —solo en encuestas públicas— por
  Área y País.
- **El sentimiento se puede corregir a mano.** No es cosmético: la corrección **mueve el
  promedio** de la tarjeta de arriba. Es la única razón por la que corregir uno merece el clic.

> En una encuesta **anónima**, filtrar los comentarios por Área **no reduce la lista**. Los
> comentarios no llevan área en una encuesta anónima, y el producto prefiere conservar el
> comentario a inventarle un grupo. No es un fallo.

### 7.5 eNPS

Si la encuesta no incluyó una pregunta de recomendabilidad, la pestaña muestra:

> **Esta encuesta no midio recomendabilidad**
> El eNPS aparece cuando la encuesta incluye una pregunta de tipo NPS. Puedes aniadirla en la
> siguiente medicion.

**Cuatro cifras arriba:** `Puntaje eNPS` (con su fórmula en el ⓘ), `% Promotores`, `% Neutros`,
`% Detractores`.

> **La fórmula:** `% Promotores − % Detractores`. Va de −100 a +100. Detractores 0–6,
> neutros 7–8, promotores 9–10.

**Tres vistas:**

#### a) **Secciones** — "Detalle por secciones eNPS"

El eNPS desglosado por el árbol completo de la encuesta: cada sección y subsección con su
puntaje, su mezcla de promotores/neutros/detractores y sus respuestas.

> Va **antes** que el corte por grupo a propósito: el puntaje global no dice dónde actuar, y un
> corte por demográfico sin haber visto el mapa por secciones deja al lector adivinando qué
> dimensión está moviendo el número.

#### b) **Por segmento** — "eNPS por segmento demografico"

La grilla dimensión × grupo. Un grupo bajo el mínimo muestra **`Reservado`**, nunca un `0`. Y el
total de la tabla **ignora** las celdas reservadas al calcularse.

En esta vista las filas de *pregunta* vienen ocultas por defecto (se activan en `Niveles`).

#### c) **Profundidad** — "Preguntas de profundidad"

Las respuestas escritas al seguimiento que se le hace a cada banda.

**Cómo llega aquí el contenido:** una pregunta de profundidad **no es una sección**: es un
seguimiento configurado dentro de una pregunta de escala (NPS, estrellas, emociones o lineal).
Por eso esta vista **recorre las secciones que escribió el autor y descarta las ramas que no
preguntaron nada** — una sección sin seguimiento no es una sección de esta vista.

Junto al título aparece la cobertura:

```
Preguntas de profundidad   [3]   1.204 respuestas de 1.980 personas · 60,8% de cobertura
```

> Una lista de respuestas sin el porcentaje de gente que las escribió es una anécdota. Por eso
> la cobertura va pegada al conteo.

Por cada banda se ve cuánta gente la vio, cuánta respondió, el porcentaje, y las respuestas.
**La pantalla dibuja las primeras ocho de cada banda**; el resto está en el archivo XLSX
(hoja *Profundidad*), que es a lo que apunta el "y N más".

`Personalizar` (niveles y resaltado) **no aparece** en esta vista: no dibuja puntajes, así que
sería un menú vacío.

### 7.6 Análisis con IA

Cierra la lectura: primero lo que afirma la IA, después la evidencia en la que se apoya
—prioridades, fortalezas, brechas entre grupos y la voz de la gente— como un documento continuo.

Cada afirmación viaja **con la cifra que la sostiene**, justamente para que se pueda contradecir
con la pestaña anterior.

### 7.7 Casos de uso de resultados

#### CASO 13 — Ver una celda `Reservado` con tus propios ojos

**Encuesta:** Cultura y Valores - 2026 (anónima, mínimo 5).

1. Abre resultados → pestaña **Favorabilidad** → vista **Heatmap**.
2. `Ver por:` **Área**.
3. Busca las columnas de las áreas más pequeñas (la lista tiene una cola larga a propósito).
4. **Qué debe pasar:** algunas celdas muestran 🔒. Pasa el ratón: dice `Reservado` y
   «Por debajo del mínimo para mostrar resultados de este grupo.», pero **sí te dice cuántas
   respuestas y cuántos participantes tiene** — el conteo no es secreto, el resultado sí.
5. Repite en **Clima Organizacional - Q1 2026** (pública): las celdas equivalentes muestran su
   número, y las únicas grises son las de grupos con **cero** respuestas, que dicen
   `Sin respuestas`.

#### CASO 14 — Hacer que un grupo caiga bajo el mínimo al filtrar

**Encuesta:** Cultura y Valores - 2026.

1. Heatmap por **Área**: todas las columnas muestran números.
2. Abre **Filtros** → `País: Chile`.
3. **Qué debe pasar:** varias áreas pasan a 🔒 `Reservado`. Al estrechar la población, cada
   grupo se queda con menos gente, y los pequeños cruzan por debajo del mínimo.
4. Quita el filtro y vuelven a aparecer los números.

#### CASO 15 — Una fila "Sin escala"

1. Cualquier encuesta → **Favorabilidad** → **Heatmap**.
2. Despliega la sección de comentarios abiertos o la de recomendabilidad.
3. **Qué debe pasar:** la fila muestra el badge `Sin escala` y sus celdas el icono de mensaje.
   **No** aparece un número bajo inventado. Es la protección contra que el heatmap señale el
   problema equivocado.

#### CASO 16 — Del recuento a las personas

**Encuesta:** Clima Organizacional - Q1 2026 (pública, para ver nombres).

1. Pestaña **Preguntas** → vista **Secciones**.
2. Despliega una pregunta de escala y pulsa la fila de la opción `4`.
3. **Qué debe pasar:** saltas a **Por persona**, con la lista acotada a la gente que respondió
   `4` en esa pregunta. Los nombres son reales.
4. Repite el paso en cualquier encuesta anónima: la lista funciona igual, pero las filas dicen
   `Participante 1`, `Participante 2`… y no hay columnas de área ni país.

---

## 8. Descargas: los cinco reportes

### 8.1 Cómo se llega

Resultados → barra inferior → **Descargar información**.

Se abre un panel a la derecha, **Reportes de resultados**, con dos pestañas:

- **Reportes** — configurar el próximo archivo.
- **Descargas** — ver en qué van los que ya pediste.

> Están separadas a propósito: una es un formulario, la otra es un estado. Mezclarlas mete una
> barra de progreso dentro de un formulario.

### 8.2 Qué hace cada reporte y para quién es

| Reporte | Formato | Para quién | Qué lleva |
|---|---|---|---|
| **Reporte general** | PDF | comité, dirección | El documento visual: verificación, participación, favorabilidad por secciones, heatmaps, detalle de preguntas, eNPS, brechas y análisis de IA |
| **Resultados generales** | XLSX | analista | Todo el dato, una hoja por nivel de análisis |
| **Comentarios** | XLSX | quien lee la voz de la gente | Las respuestas abiertas con su pregunta, tema, sentimiento y segmento |
| **Preguntas** | XLSX | quien audita una pregunta | Una hoja por pregunta con **todas** las respuestas que recibió |
| **Respuestas** | XLSX | quien cruza con otros datos | Una fila por participante con todo lo que respondió |

Solo la fila **seleccionada** muestra su descripción. Cinco descripciones a la vez eran una
pantalla de texto que nadie leía.

**Dos de esas descripciones cambian según la encuesta:**

| Reporte | En una encuesta pública | En una anónima |
|---|---|---|
| Respuestas | «Una fila por participante con su identidad y todo lo que respondió» | «…con todo lo que respondió, **sin identidad**» |
| Preguntas | «…con quién la dio y sus demográficos» | «Los participantes van numerados: la encuesta es anónima.» |

### 8.3 Configurar el PDF

Debajo del selector aparece la lista de las **ocho secciones del documento**, cada una con su
interruptor. El número azul a la izquierda es **la posición real que ocupará en el documento**:
si apagas la sección 2, la 3 pasa a ser la 2. Un reporte que salta del 3 al 5 hace pensar en una
página perdida.

| # | Sección | Selector propio | Si dejas el selector vacío |
|---|---|---|---|
| 1 | Verificación de la medición | — | — |
| 2 | Participación | Desglosar por *(demográficos)* | «Sin demográficos solo se imprime la cobertura general.» |
| 3 | Favorabilidad por secciones | — | — |
| 4 | Heatmap por demográficos | Una grilla por cada | **«Elige al menos un demográfico o este bloque no se imprime.»** |
| 5 | Detalle de preguntas | Secciones a incluir | **«Elige al menos una sección o este bloque no se imprime.»** |
| 6 | eNPS | Desglosar además por | «Sin demográficos solo se imprime el puntaje y el desglose por secciones.» |
| 7 | Brechas entre grupos | Buscar brechas por | **«Elige al menos un demográfico o este bloque no se imprime.»** |
| 8 | Análisis de IA | — | — |

**Cada bloque elige sus propios demográficos, y eso es deliberado.** La participación se lee por
la unidad que convoca (sede, contrato) y el heatmap por la unidad donde se actúa. Obligarlos al
mismo corte convierte uno de los dos en relleno.

**Todos arrancan precargados solo con "Área"**, no con todos. Cuatro bloques por cinco
demográficos serían veinte grillas que nadie pidió, y el tamaño del archivo se descubriría
después de generarlo.

**Si la medición no da para un bloque, la fila sale apagada con la razón escrita:**

- `Esta medición no incluyó pregunta eNPS`
- `Esta encuesta no recogió demográficos`

**Si apagas las ocho:** el botón se deshabilita y aparece
`Enciende al menos una sección para poder descargar.`

### 8.4 Configurar el XLSX

Igual que el PDF, pero con **once hojas**. El número indica la pestaña que ocupará en el
archivo, y las tres hojas "por demográficos" muestran un **rango** (`7–9` si elegiste tres
demográficos) porque producen **una hoja por cada uno**, no una sola:

| Orden | Hoja | Qué lleva |
|---|---|---|
| 1 | Resumen | La pestaña Resumen entera: indicadores, lectura ejecutiva, prioridades, fortalezas, brechas y voz |
| 2 | Demográficos | Los demográficos usados, sus grupos y su participación |
| 3 | Secciones | Puntaje y favorabilidad de cada sección |
| 4 | Preguntas | Una fila por pregunta con su distribución 1–5 |
| 5 | Detalle de preguntas | Conteo y % de **cada opción**, en todos los formatos |
| 6 | eNPS | Puntaje, mezcla y detalle por dimensión y pregunta |
| 7–N | Participación por demográficos | **una hoja por demográfico elegido** |
| … | Heatmaps por demográficos | **una hoja por demográfico elegido** |
| … | eNPS por demográficos | **una hoja por demográfico elegido** |
| … | Preguntas de profundidad | Las respuestas abiertas de cada banda, con su cobertura |
| último | Análisis IA | Resumen, hallazgos, riesgos y acciones |

> **Encender una tanda y dejar su selector vacío no cuenta como contenido.** Si lo único
> encendido es una tanda vacía, el botón se deshabilita:
> `Enciende al menos una hoja para poder descargar.`

**Hoja de profundidad**: solo está disponible si alguna pregunta activó seguimiento. Si no:
`Ninguna pregunta activó preguntas de profundidad`.

### 8.5 Configurar Comentarios

Dos filtros, ambos **encendidos y con todo marcado** de entrada:

- **Sentimiento de los comentarios** — cada opción muestra su conteo real:
  `Positivo (312)`, `Neutral (128)`, `Negativo (94)`.
- **Temas de los comentarios** — los temas que etiquetó la IA, **ordenados por volumen**, no
  alfabéticamente: el tema del que escribieron 200 personas no puede quedar debajo de uno de 3
  por su inicial.

Si apagas un interruptor, ese eje deja de filtrar (entra todo). Si lo dejas encendido y
**vacío**, el botón se bloquea:

- `Selecciona al menos un sentimiento para poder descargar.`
- `Selecciona al menos un tema para poder descargar.`

### 8.6 El filtro de población (y el bloqueo por anonimato) ⭐

Es la parte que más preguntas genera. Está al final del panel, en una tarjeta llamada
**Filtrar población** — *«Genera el reporte solo para los grupos que elijas»*.

Al encenderla aparecen dos controles: **Demográfico** (uno solo) y **Grupos** (varios).

#### Qué significa marcar varios grupos

Marcar `Marketing` y `Comercial` significa **la gente de ambos grupos**, no su cruce. Es una
suma, no una intersección. Por eso marcar un segundo grupo puede desbloquear una descarga que
estaba bloqueada.

#### Lo que ves cuando la selección **sí** se puede reportar

```
842 respuestas en la selección · mínimo por grupo: 5
```

En una encuesta pública, la misma línea sin el sufijo: `842 respuestas en la selección`.

> **El conteo aparece siempre, no solo cuando bloquea.** Quien ve "842 respuestas" antes de
> descargar entiende la regla la única vez que sí le detiene.

#### Lo que ves cuando **no** se puede

Una tarjeta roja con un candado:

> 🔒 **Esta selección tiene 4 respuestas y el mínimo por grupo es 5. Sus resultados quedan
> reservados para proteger el anonimato de la encuesta.**

Y con un único participante, en singular:

> 🔒 **Esta selección tiene 1 respuesta y el mínimo por grupo es 5. Sus resultados quedan
> reservados para proteger el anonimato de la encuesta.**

Y si la selección no tiene a nadie —en **cualquier** encuesta, anónima o pública—:

> 🔒 **Esta selección no tiene respuestas: no hay nada que reportar.**

En los tres casos, **el botón de descargar queda deshabilitado**.

#### Por qué existe este bloqueo

El mínimo por grupo ya gobernaba **todo** lo que la herramienta muestra: una celda del heatmap,
una fila de participación y una columna de eNPS leen `Reservado` por debajo de él. **El centro
de descargas era la única puerta que lo ignoraba**: se podía filtrar un reporte completo a un
área de una persona y obtener todos los números que esa persona dio. Por eso la misma regla se
aplica aquí, y los cinco reportes hacen la misma pregunta.

#### Cuándo la tarjeta ni siquiera aparece

| Situación | ¿Se ve la tarjeta? |
|---|---|
| La encuesta no recogió demográficos | **No** |
| Encuesta **pública**, cualquier reporte | Sí |
| Encuesta **anónima** + PDF o XLSX | Sí |
| Encuesta **anónima** + Comentarios, Preguntas o Respuestas | **No** |

> **Por qué desaparece en esos tres:** una encuesta anónima **no guarda un demográfico junto a
> un comentario ni junto a una respuesta individual** — esa es la promesa, no una omisión. Esos
> tres reportes no podrían acotarse por área aunque quisieran, así que el producto **quita el
> control** en vez de ofrecer un corte que el archivo nunca va a hacer.

Y cuando el control desaparece, **también deja de aplicarse**: si venías del PDF con `Área:
Producto` puesto, cambiar a *Respuestas* genera el archivo **completo**. Al volver al PDF, tu
selección sigue ahí intacta.

En su lugar, esos reportes muestran un aviso informativo que dice exactamente qué vas a recibir:

> ℹ️ Una hoja con una fila por participante y una columna por pregunta, coloreada por la escala 1
> a 5. **Sin identidad ni demográficos: la encuesta es anónima.**

### 8.7 "Líder": el corte que no viaja en el PDF

Si buscas **Líder** en los selectores de las secciones del PDF, no está. En el XLSX sí.

> **No es un fallo.** Un PDF viaja por correo y no tiene control de acceso. Desplegar resultados
> por líder en un archivo así expone a personas identificables dentro de grupos pequeños. El
> corte existe —vive en la herramienta y en el XLSX, con su mínimo por grupo— pero no viaja en el
> documento ejecutivo.

Lo mismo pasa con **Colaborador**: no aparece en ningún selector de despliegue, porque cada
grupo sería una persona.

**Ojo:** `Líder` **sí** aparece en la tarjeta *Filtrar población*, en los dos. Ahí no despliega
nada: acota. Y acotar sigue estando protegido por el mínimo por grupo.

### 8.8 Qué pasa cuando pulsas Descargar

1. El panel salta solo a la pestaña **Descargas**.
2. Aparece una fila con el nombre del archivo y una barra de progreso.
3. Al llegar al 100%, **el archivo se entrega solo**. No hay segundo clic: pedir un reporte
   **es** pedir la descarga, y la fila que queda es un recibo, no una acción pendiente.
4. Sale el toast `XLSX descargado` (o `PDF descargado`) con el nombre del archivo debajo.

**El nombre sigue siempre este patrón:**

```
reporte-general-clima-organizacional-q1-2026-2026-08-25.pdf
resultados-generales-cultura-y-valores-2026-2026-08-25.xls
comentarios-…  ·  preguntas-…  ·  respuestas-…
```

#### El PDF funciona distinto y hay que saberlo

El PDF **no se descarga como archivo**: se abre el **diálogo de impresión del navegador**, y
"Guardar como PDF" ahí **es** la descarga.

En la lista, esa fila lo dice: `Descargado — se abrió para imprimir o guardar`.

Si el navegador impide abrirlo, sale:

> ❌ **No se pudo abrir la vista de impresión**
> Reintenta la descarga desde la lista de descargas.

Y la fila cambia a `La descarga quedó bloqueada por el navegador` con un botón **Reintentar**.
Si el reintento también falla:

> ❌ **No se pudo abrir la vista de impresión**
> Revisa si el navegador está bloqueando las ventanas emergentes.

### 8.9 Seguir trabajando mientras se prepara

Pulsa **Minimizar y continuar** y el panel se cierra, pero la preparación sigue: aparece una
**tarjeta flotante abajo a la derecha**.

```
┌────────────────────────────────────────────┐
│ ⟳  Preparando 2 reportes…                  │
│    Puedes seguir navegando          ⧉ ⌄ ✕ │
├────────────────────────────────────────────┤
│ DESCARGAS ACTIVAS                          │
│ reporte-general-…pdf                       │
│ Reporte en progreso  ▓▓▓▓▓░░░░  62%        │
│ ✓ resultados-generales-…xls                │
│ Descargado                    ↗ Compartir  │
└────────────────────────────────────────────┘
```

- La cabecera reporta **el peor estado del lote**: si queda uno preparándose, dice "Preparando",
  aunque otros ya hayan terminado. La pregunta de quien mira es *¿ya me puedo ir?*.
- Muestra hasta **4** descargas; con más aparece `Ver las 7 descargas`.
- Los tres iconos: abrir el centro de descargas, plegar la tarjeta, cerrarla.

**Compartir** copia un enlace a esta vista de resultados con el nombre del reporte. Toast:

> ✅ **Enlace copiado** — Compártelo con quien deba ver este reporte.

O, si el navegador no deja copiar:

> ❌ **No se pudo copiar el enlace** — Copia la URL desde la barra del navegador.

### 8.10 La pestaña Descargas

Encabezada por `Lista de descargas` · `Últimos 7 días`. Si no has pedido nada:

> 🕘 **Sin descargas recientes**
> Tus reportes generados aparecerán aquí para acceso rápido.

⚠️ **Importante para pruebas:** la lista **vive solo en la sesión**. Si recargas la página o
sales y vuelves a resultados, se vacía — aunque el rótulo diga "Últimos 7 días".

El check verde marca **la última descarga**, no todo el historial: las filas llegan de más
reciente a más antigua, y solo la primera terminada lo lleva.

### 8.11 Casos de uso de descargas

#### CASO 17 — Reproducir el bloqueo por anonimato ⭐

**Encuesta:** Cultura y Valores - 2026 (anónima, mínimo 5).

1. Abre resultados → barra inferior → **Descargar información**.
2. Deja seleccionado **Reporte general (PDF)**.
3. Baja hasta **Filtrar población** y enciende el interruptor.
4. **Demográfico:** `Área`. **Grupos:** marca **solo el más pequeño**.
5. **Qué debe pasar:**
   - Tarjeta roja con candado:
     `Esta selección tiene 4 respuestas y el mínimo por grupo es 5. Sus resultados quedan reservados para proteger el anonimato de la encuesta.`
   - El botón `Descargar PDF` queda **apagado**.
6. Marca **un segundo grupo**.
7. **Qué debe pasar ahora:** la unión supera el mínimo → desaparece la tarjeta roja, aparece
   `N respuestas en la selección · mínimo por grupo: 5`, y el botón se activa.

#### CASO 18 — La misma selección en una encuesta pública NO bloquea

**Encuesta:** Clima Organizacional - Q1 2026 (pública).

1. Repite los pasos del CASO 17.
2. **Qué debe pasar:** **no hay bloqueo**. Aparece `4 respuestas en la selección`, **sin** el
   sufijo del mínimo, y la descarga procede. En una encuesta pública el mínimo es 1: solo se
   frena lo que tiene cero respuestas.

#### CASO 19 — Ver desaparecer el filtro de población

**Encuesta:** cualquier anónima.

1. Reporte **PDF** → enciende *Filtrar población* → elige un grupo con respuestas suficientes.
2. Cambia el tipo de reporte a **Respuestas (XLSX)**.
3. **Qué debe pasar:** la tarjeta *Filtrar población* **desaparece entera**, y en su lugar sale
   el aviso `Sin identidad ni demográficos: la encuesta es anónima.`
4. Vuelve a **PDF**: la tarjeta reaparece con tu selección **intacta**.

#### CASO 20 — Comprobar que el anonimato llega hasta el archivo

1. Descarga **Respuestas (XLSX)** de **Clima Organizacional - Q1 2026** (pública). Ábrelo.
   - **Debe tener:** columna `Participante` con nombres reales, columna `Correo`, y columnas de
     Área, Líder, País, Edad y Género.
   - La cabecera dice: *«Encuesta pública: cada fila lleva la identidad y los demográficos de
     quien respondió»*.
2. Descarga el mismo reporte de **Cultura y Valores - 2026** (anónima).
   - **Debe tener:** `Participante 1`, `Participante 2`… **sin columna de correo y sin ninguna
     columna de demográficos**.
   - La cabecera dice: *«Encuesta anónima: cada fila es un participante numerado, sin identidad
     ni demográficos»*.

#### CASO 21 — El aviso más sutil del producto

**Encuesta:** anónima. Reporte: **Preguntas (XLSX)**.

Aunque la tarjeta de filtro no aparece, si vinieras de tener uno puesto, la cabecera de cada
hoja lo explica:

> *«Encuesta anónima: participantes numerados, sin demográficos — por eso las filas no se acotan
> por población»*

Es el producto diciendo en voz alta por qué el archivo tiene más filas de las que esperabas.

#### CASO 22 — Un libro con 47 pestañas

**Encuesta:** Clima Organizacional - Q1 2026 (54 preguntas).

1. Descarga **Preguntas (XLSX)**.
2. **Qué debe pasar:** el archivo trae una hoja `Resumen` y **una hoja por cada pregunta**, con
   su distribución y una fila por cada persona que la respondió.
3. **Qué vigilar:** el nombre de cada pestaña se recorta a 31 caracteres (límite de Excel) y, si
   dos preguntas se llaman igual, la segunda lleva ` (2)`. Es normal.
4. ⚠️ Este archivo es **el más pesado** de los cinco. La barra de progreso mide un tiempo
   simulado, no el trabajo real: puede quedarse un momento al 100% antes de que el archivo baje.

---

## 9. Anónima o pública: qué cambia exactamente

Tabla de referencia rápida. Es la respuesta a casi todos los «¿por qué aquí no veo lo mismo?».

| | 🔒 **Anónima** | 🔓 **Pública** |
|---|---|---|
| Mínimo por grupo | el que fije el autor (mín. 3, por defecto 5) | **1** |
| Heatmap: grupo pequeño | 🔒 `Reservado` | su número |
| Heatmap: grupo sin respuestas | `—` Sin respuestas | `—` Sin respuestas |
| eNPS por segmento: grupo pequeño | `Reservado` | su número |
| Participación: grupo pequeño | conteos sí, resultados no | todo |
| **Preguntas → Por persona** | `Participante 1`, sin demográficos | nombre, correo, área, líder, país, edad, género |
| Comentarios: columnas Área/País | vacías → `Anónimo` | el valor real |
| Filtrar comentarios por Área | **no acota** (no hay dato) | acota de verdad |
| Filtro de población en PDF y XLSX | sí, **y puede bloquear** | sí, solo bloquea si hay 0 respuestas |
| Filtro de población en Comentarios / Preguntas / Respuestas | **no aparece** | sí |
| Export "Respuestas": columna Correo | no existe | existe |
| Export "Respuestas": columnas demográficas | no existen | existen |
| Pie del PDF | «Los grupos con menos de N respuestas se reportan como "Reservado".» | «Encuesta nominal: los resultados pueden atribuirse.» |
| Hoja Resumen del XLSX | incluye la fila `Mínimo por grupo (anonimato)` | **no la incluye** |
| Texto de bienvenida | «Tus respuestas son anónimas…» | «Tus respuestas quedan asociadas a tu nombre…» |

---

## 10. Catálogo de mensajes

Todos los textos que puede ver una persona, con su causa. Ordenados por dónde aparecen.

### 10.1 Lista de encuestas

| Mensaje | Cuándo |
|---|---|
| `<nombre> duplicada` | al duplicar una |
| `N encuestas duplicadas` | al duplicar varias |
| `<nombre> finalizada` | al confirmar Finalizar |
| `<nombre> eliminada` / `N encuestas eliminadas` | al confirmar Eliminar |
| `<nombre> vuelve a estar en curso hasta el <fecha>` | al reabrir |
| `<nombre> ahora cierra el <fecha>` | al cambiar la fecha de cierre |
| `Enlace de <nombre> copiado al portapapeles` | Compartir encuesta |
| `Exportando N encuestas` | Exportar en lote |
| `Las plantillas llegan en el siguiente paso.` | Crear con plantilla |

### 10.2 Constructor

| Mensaje | Causa |
|---|---|
| `Completa el nombre, el tipo y las fechas de la encuesta para continuar.` | falta algo en Datos generales |
| `Selecciona al menos un participante para continuar.` | Participantes vacío |
| `Si usas datos demográficos, activa o crea al menos un dato demográfico para continuar.` | bloque de demográficos encendido pero vacío |
| `Todas las secciones deben tener al menos una pregunta para continuar.` | hay preguntas, pero alguna sección quedó vacía |
| `Añade al menos una sección con preguntas para continuar.` | no hay ninguna pregunta |
| `Completa los pasos anteriores para desbloquear este paso.` | mensaje genérico de respaldo |
| `Alcanzaste el máximo de 3 niveles` | intentaste crear un cuarto nivel |
| `Selecciona una sección para añadir preguntas.` | pulsaste añadir pregunta sin sección activa |
| `Añade al menos una pregunta para ver la vista previa.` | vista previa sin contenido |
| `El banco de respuestas llega en el siguiente paso.` | función pendiente |
| `Sección eliminada` / `Subsección eliminada` | borrado confirmado |
| `Subsección movida` / `Pregunta movida` | movimiento con "Mover a…" |
| `Se añadieron N preguntas.` | banco de preguntas |
| `Se importaron N secciones y M preguntas.` | importación correcta |
| `No se detectaron secciones` | el archivo se leyó pero no traía estructura |
| `Archivo no válido` | el archivo no se pudo leer |
| `Encuesta guardada` | Guardar, o Finalizar sin errores |
| `La encuesta debe tener al menos una sección` | tooltip del borrar deshabilitado |
| `No hay otra sección o subsección donde moverla` | tooltip del mover deshabilitado |

### 10.3 Descargas

| Mensaje | Cuándo |
|---|---|
| `PDF descargado` / `XLSX descargado` | archivo entregado (con el nombre debajo) |
| `No se pudo abrir la vista de impresión` + `Reintenta la descarga desde la lista de descargas.` | el PDF no pudo abrirse |
| `No se pudo abrir la vista de impresión` + `Revisa si el navegador está bloqueando las ventanas emergentes.` | el reintento tampoco funcionó |
| `Enlace copiado` + `Compártelo con quien deba ver este reporte.` | Compartir |
| `No se pudo copiar el enlace` + `Copia la URL desde la barra del navegador.` | el portapapeles falló |

**Avisos dentro del panel (no son toasts):**

| Aviso | Cuándo |
|---|---|
| `Enciende al menos una sección para poder descargar.` | PDF con las 8 secciones apagadas |
| `Enciende al menos una hoja para poder descargar.` | XLSX sin ninguna hoja con contenido |
| `Selecciona al menos un sentimiento para poder descargar.` | filtro encendido y vacío |
| `Selecciona al menos un tema para poder descargar.` | filtro encendido y vacío |
| `Elige al menos un demográfico o este bloque no se imprime.` | heatmap o brechas sin selección |
| `Elige al menos una sección o este bloque no se imprime.` | detalle de preguntas sin selección |
| `Elige al menos un demográfico o estas hojas no se generan.` | tanda del XLSX sin selección |
| `Sin demográficos solo se imprime la cobertura general.` | participación sin selección |
| `Sin demográficos solo se imprime el puntaje y el desglose por secciones.` | eNPS sin selección |
| `Esta medición no incluyó pregunta eNPS` | bloque/hoja no disponible |
| `Esta encuesta no recogió demográficos` | bloque/hoja no disponible |
| `Ninguna pregunta activó preguntas de profundidad` | hoja de profundidad no disponible |
| Los tres mensajes de bloqueo de población | ver [§8.6](#86-el-filtro-de-población-y-el-bloqueo-por-anonimato-) |

### 10.4 Estados vacíos

| Pantalla | Texto |
|---|---|
| Sección sin contenido (constructor) | **Esta sección está vacía** — «Las secciones pueden contener preguntas o subsecciones…» |
| Resultados sin demográficos | **Esta encuesta no recogió datos demográficos** — «Sin ellos los resultados solo se pueden leer en total…» |
| eNPS sin pregunta NPS | **Esta encuesta no midio recomendabilidad** — «El eNPS aparece cuando la encuesta incluye una pregunta de tipo NPS…» |
| Descargas sin historial | **Sin descargas recientes** — «Tus reportes generados aparecerán aquí para acceso rápido.» |
| Comparativo sin candidatas | **No hay más encuestas** — «No se encontraron otras encuestas de tipo Clima para comparar.» |

---

## 11. Casos de uso completos, de principio a fin

### GUION A — «Quiero el reporte de mi área para el comité del lunes»

**Perfil:** líder de área. **Encuesta:** Cultura y Valores - 2026 (anónima).

1. Lista → marca la fila → **Ver resultados**.
2. Pestaña **Favorabilidad** → vista **Heatmap** → `Ver por: Área`. Localiza tu columna.
3. Barra inferior → **Descargar información**.
4. Deja **Reporte general (PDF)**.
5. Apaga las secciones que el comité no necesita — por ejemplo *Detalle de preguntas*. Fíjate en
   cómo se **renumeran** las que quedan.
6. En **Heatmap por demográficos**, deja solo `Área`.
7. Enciende **Filtrar población** → `Área` → marca tu área.
8. **Comprueba el conteo:** si dice `312 respuestas en la selección · mínimo por grupo: 5`,
   adelante. Si aparece la tarjeta roja, tu área es demasiado pequeña para reportarse sola:
   añade un área hermana o descarga el reporte general sin filtrar.
9. **Descargar PDF** → se abre el diálogo de impresión → **Guardar como PDF**.

### GUION B — «Necesito los comentarios negativos sobre carga de trabajo»

**Perfil:** analista de personas.

1. Resultados → pestaña **Preguntas** → vista **Comentarios**.
2. Explora con la búsqueda y los filtros para ver el volumen.
3. Barra inferior → **Descargar información** → **Comentarios (XLSX)**.
4. En *Sentimiento*: desmarca `Positivo` y `Neutral`, deja `Negativo`.
5. En *Temas*: desmarca todos menos el de carga de trabajo.
6. **Descargar XLSX**.
7. **Qué debe traer el archivo:** una hoja con las columnas Sección, Pregunta, Comentario,
   Sentimiento, Confianza IA, Tema, Área, País, Enviado. La cabecera resume tu configuración:
   `Sentimientos: Negativo · Temas: Carga de trabajo`.
8. **Si la encuesta es anónima**, Área y País dirán `Anónimo` en todas las filas.

### GUION C — «Alguien dice que el número del PDF no coincide con la pantalla»

1. Pregunta **con qué filtro** se descargó el PDF. La portada del documento lo dice:
   `Población: Área: Comercial, Finanzas`.
2. Reproduce ese mismo filtro en la pantalla: **Filtros** → mismo demográfico, mismos grupos.
3. **Deben coincidir.** Pantalla y archivo se construyen del mismo agregado: si no coinciden con
   el mismo filtro, es un fallo real y hay que reportarlo con las dos capturas.
4. La causa habitual: la pantalla estaba **sin filtrar** y el PDF **filtrado**, o al revés.

### GUION D — «Construir una encuesta de cero y publicarla»

1. Lista → **Crear encuesta** → **Crear en blanco**.
2. **Datos generales:** nombre, tipo, fechas. Decide **Público** o **Anónimo** — y si es anónimo,
   el mínimo por grupo.
3. **Participantes:** toda la empresa, selección manual o importar un archivo.
4. **Datos demográficos:** revisa los precargados; decide cuáles se preguntan y cuáles solo
   sirven para filtrar. *Abrir este paso ya cuenta como decidirlo.*
5. **Secciones y preguntas:** construye el árbol (ver [CASO 8](#caso-8--construir-un-bloque-completo-desde-cero)).
6. **Vista previa** desde la barra inferior: recórrela entera como si respondieras.
7. **Bienvenida y cierre:** escribe los dos textos.
8. **Finalizar** → `Encuesta guardada` → vuelves a la lista con la encuesta como `Borrador`.

---

## 12. Cuando algo no cuadra

Guía de diagnóstico rápido. La mayoría no son fallos.

| Síntoma | Causa más probable | Qué comprobar |
|---|---|---|
| «El heatmap está lleno de candados» | encuesta anónima con grupos pequeños | ⓘ de la barra → `Privacidad: Anónima` y el mínimo. Prueba con Clima Q1 2026 |
| «No me deja descargar» | el filtro de población dejó una selección bajo el mínimo | Lee la tarjeta roja: dice cuántas respuestas hay y cuál es el mínimo |
| «Desapareció el filtro de población» | encuesta anónima + reporte a nivel de registro | Cambia a PDF o XLSX y reaparece |
| «El PDF no se descarga» | el PDF sale por el diálogo de impresión | Busca la ventana de impresión; elige "Guardar como PDF" |
| «Perdí la lista de descargas» | vive solo en la sesión | Es esperado tras recargar. El rótulo "Últimos 7 días" es engañoso |
| «Filtré los comentarios por área y no cambió nada» | encuesta anónima | Los comentarios no llevan área ahí. Prueba en una pública |
| «No encuentro Líder en el PDF» | está excluido a propósito | Usa el XLSX, o el filtro de población |
| «Se me cerró la subsección que tenía abierta» | solo hay una rama abierta por nivel | Es el comportamiento esperado |
| «Arrastré una subsección y no se movió» | el arrastre solo reordena entre hermanas | Usa el botón **Mover a…** (✥) |
| «Moví una subsección y cambió de nivel» | adopta el nivel del destino | Es correcto: se coloca como hermana del destino |
| «No me deja pasar de paso» | un paso anterior está incompleto | Lee el toast: nombra exactamente qué falta |
| «Marqué Finalizar y no pasó nada» | hay pasos incompletos | Mira el panel izquierdo: están en rojo |
| «Importé un archivo y faltan preguntas» | jerarquía de más de 3 niveles | Lo que pasa del nivel 3 se descarta. Reestructura el archivo |
| «Un enunciado se ve con `<p>` y `</p>`» | pregunta traída del **Banco de preguntas** | Fallo conocido: bórrala y escríbela a mano |
| «Los números cambian entre visitas» | **no deberían** | Los datos son deterministas. Si cambian, repórtalo: es un fallo real |

### 12.1 Los tres fallos conocidos que hay que saber reconocer

**1. Enunciados con etiquetas HTML a la vista.**
Las preguntas añadidas desde el **Banco de preguntas** se guardan con marcado y ese marcado se
ve tal cual en la vista previa, en los resultados y **dentro de los archivos descargados**.
*Reproducir:* Constructor → Banco de preguntas → añade una → abre la vista previa. Verás
`<p>Mi líder me da retroalimentación útil</p>`.

**2. Preguntas colgando de una sección de nivel 1.**
Con el botón **Mover a…** se puede llevar una pregunta a una sección de nivel 1, aunque la regla
del producto es que ese nivel es solo un contenedor. Si ocurre, esa sección genera **página
propia** en la vista previa, sin miga de pan.
*Reproducir:* mueve una pregunta y elige un destino marcado como **Sección**.

**3. Contenido perdido al importar.**
Un archivo con más de tres niveles pierde lo que sobra, **y el toast cuenta lo que traía el
archivo, no lo que entró**. Compara siempre el recuento del toast con el de la barra inferior
después de importar.

---

*Documento de experiencia. Para el detalle de implementación —archivos, funciones, reglas de
código y catálogo técnico de errores— consulta
[Anatomía de una encuesta](DESCARGABLES_SECCIONES_Y_RESULTADOS.md).*
