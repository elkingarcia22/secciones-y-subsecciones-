import { AiAnalyzingState } from "@/components/ai-interaction";

/**
 * La espera del compositor de estructura con IA.
 *
 * No dibuja nada propio: es `AiAnalyzingState`, la única forma en que la IA
 * dice "dame un momento" en todo el producto, con el texto de esta pantalla.
 * Lo que aporta es el paso en el que va la barra, que recorre lo que hay en
 * el brief —los temas, el tamaño, el estilo de pregunta— en vez de una frase
 * genérica, para que la espera demuestre que se leyó lo que el autor pidió.
 */
interface AiStructureLoaderProps {
  progress: number;
  steps: readonly string[];
}

export function AiStructureLoader({ progress, steps }: AiStructureLoaderProps) {
  // El último paso se queda arriba mientras la barra termina, para que el
  // panel no diga "listo" antes de estarlo.
  const index = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));

  return (
    <AiAnalyzingState
      title="Construyendo la estructura"
      progress={progress}
      detail={steps[index]}
      caption="Estamos redactando las preguntas y organizando la estructura a partir de tu contexto."
    />
  );
}
