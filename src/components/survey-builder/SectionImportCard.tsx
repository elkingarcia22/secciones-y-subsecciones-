import * as React from "react";
import { FileText, UploadCloud, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  SECTION_IMPORT_ACCEPT,
  importedToSections,
  parseSectionFile,
  summarizeImported,
} from "./sectionFileImport";
import type { SectionImportSummary } from "./sectionFileImport";
import type { SurveySection } from "./surveyBuilderTypes";

interface SectionImportCardProps {
  onImport: (sections: SurveySection[], summary: SectionImportSummary) => void;
}

export function SectionImportCard({ onImport }: SectionImportCardProps) {
  const [isImporting, setIsImporting] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const imported = await parseSectionFile(file);
      if (imported.length === 0) {
        toast.error("No se detectaron secciones", {
          description: "El archivo es válido pero no contiene estructura de secciones/preguntas reconocible.",
        });
        return;
      }
      const parsed = summarizeImported(imported);
      onImport(importedToSections(imported), parsed);
      toast.success("Preguntas importadas", {
        description: `${parsed.sections} sección${parsed.sections !== 1 ? "es" : ""}, ${parsed.subsections} subsección${parsed.subsections !== 1 ? "es" : ""} y ${parsed.questions} pregunta${parsed.questions !== 1 ? "s" : ""} añadidas.`,
      });
    } catch {
      toast.error("Archivo no válido", {
        description: "No se pudo leer el archivo. Verifica que sea .md, .txt, .csv o .xlsx y no esté corrupto.",
      });
    } finally {
      setIsImporting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const handleClick = () => inputRef.current?.click();
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) handleFiles(droppedFiles);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={SECTION_IMPORT_ACCEPT}
        onChange={handleChange}
        className="hidden"
        aria-hidden="true"
        disabled={isImporting}
      />

      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        disabled={isImporting}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface px-4 py-3 transition-all hover:border-border/70 hover:bg-muted/30 disabled:opacity-50 disabled:cursor-wait"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-text-primary">
              Cargar preguntas desde archivo
            </span>
            <span className="block text-xs text-muted-foreground">
              Markdown, texto, CSV o Excel — se añaden al final sin borrar lo actual
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isImporting ? (
            <span className="text-xs text-muted-foreground">Importando…</span>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 text-muted-foreground/60" strokeWidth={2} />
              <UploadCloud className="h-4 w-4 text-primary" strokeWidth={2} />
            </>
          )}
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}