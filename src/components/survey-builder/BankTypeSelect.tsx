import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { questionBankData } from "./questionBankData";

interface BankTypeSelectProps {
  value: string;
  onChange: (typeId: string) => void;
}

/**
 * "Tipo de encuesta" para guardar algo en el banco — siempre uno de los tipos
 * fijos de UBITS (`questionBankData`), nunca uno creado por el autor: esa
 * taxonomía no se toca desde el builder.
 */
export function BankTypeSelect({ value, onChange }: BankTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full border-border/60 bg-surface text-[13px]">
        <SelectValue placeholder="Selecciona el tipo" />
      </SelectTrigger>
      <SelectContent>
        {questionBankData.map((type) => (
          <SelectItem key={type.id} value={type.id}>
            {type.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
