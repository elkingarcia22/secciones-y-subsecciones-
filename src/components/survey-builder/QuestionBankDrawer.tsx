import * as React from "react"
import { DrawerShell } from "@/components/overlays/DrawerShell"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/feedback/EmptyState"
import { Search, GripVertical, Inbox } from "lucide-react"
import { questionBankData } from "./questionBankData"
import { cn } from "@/lib/utils"

export interface QuestionBankDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddQuestions: (questions: string[]) => void
}

export function QuestionBankDrawer({ open, onOpenChange, onAddQuestions }: QuestionBankDrawerProps) {
  const [selectedType, setSelectedType] = React.useState<string>(questionBankData[0].id)
  const [selectedSection, setSelectedSection] = React.useState<string>(questionBankData[0].sections[0].id)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedQuestions, setSelectedQuestions] = React.useState<Set<string>>(new Set())

  // Reset states when type changes
  React.useEffect(() => {
    const typeObj = questionBankData.find((t) => t.id === selectedType)
    if (typeObj && typeObj.sections.length > 0) {
      setSelectedSection(typeObj.sections[0].id)
    } else {
      setSelectedSection("")
    }
  }, [selectedType])

  const currentType = questionBankData.find((t) => t.id === selectedType)
  const currentSection = currentType?.sections.find((s) => s.id === selectedSection)

  const filteredQuestions = React.useMemo(() => {
    if (!currentSection) return []
    if (!searchQuery.trim()) return currentSection.questions
    const lowerQuery = searchQuery.toLowerCase()
    return currentSection.questions.filter((q) => q.text.toLowerCase().includes(lowerQuery))
  }, [currentSection, searchQuery])

  const handleToggleQuestion = (id: string) => {
    const next = new Set(selectedQuestions)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedQuestions(next)
  }

  const handleSelectAll = () => {
    if (filteredQuestions.length === 0) return
    const allSelected = filteredQuestions.every(q => selectedQuestions.has(q.id))
    
    const next = new Set(selectedQuestions)
    if (allSelected) {
      filteredQuestions.forEach(q => next.delete(q.id))
    } else {
      filteredQuestions.forEach(q => next.add(q.id))
    }
    setSelectedQuestions(next)
  }

  const handleAdd = () => {
    const textsToAdd: string[] = []
    questionBankData.forEach(t => {
      t.sections.forEach(s => {
        s.questions.forEach(q => {
          if (selectedQuestions.has(q.id)) {
            textsToAdd.push(q.text)
          }
        })
      })
    })

    onAddQuestions(textsToAdd)
    setSelectedQuestions(new Set())
    onOpenChange(false)
  }

  const allFilteredSelected = filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestions.has(q.id))

  const allSelectedQuestionsDetails = React.useMemo(() => {
    const list: { id: string; text: string; sectionId: string; typeId: string; sectionName: string; typeName: string }[] = []
    questionBankData.forEach(t => {
      t.sections.forEach(s => {
        s.questions.forEach(q => {
          if (selectedQuestions.has(q.id)) {
            list.push({ ...q, sectionId: s.id, typeId: t.id, sectionName: s.name, typeName: t.name })
          }
        })
      })
    })
    return list
  }, [selectedQuestions])

  const [activeTab, setActiveTab] = React.useState("all")
  const [selectedTabType, setSelectedTabType] = React.useState<string>("all")
  const [selectedTabSection, setSelectedTabSection] = React.useState<string>("all")

  React.useEffect(() => {
    setSelectedTabSection("all")
  }, [selectedTabType])

  const filteredSelectedQuestionsDetails = React.useMemo(() => {
    return allSelectedQuestionsDetails.filter(q => {
      if (selectedTabType !== "all" && q.typeId !== selectedTabType) return false
      if (selectedTabSection !== "all" && q.sectionId !== selectedTabSection) return false
      return true
    })
  }, [allSelectedQuestionsDetails, selectedTabType, selectedTabSection])

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Banco de preguntas"
      description="Busca y selecciona las preguntas que quieras añadir a la encuesta"
      size="xl"
      className="!w-[50vw] !max-w-[50vw]"
      disablePadding
    >
      <div className="flex flex-col h-full bg-white">
        <div className="flex flex-col gap-4 px-6 pt-4 pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="all" className="data-[state=active]:bg-brand data-[state=active]:text-white">Catálogo</TabsTrigger>
              <TabsTrigger value="selected" className="data-[state=active]:bg-brand data-[state=active]:text-white">
                Seleccionadas {selectedQuestions.size > 0 && `(${selectedQuestions.size})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "all" && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[13px] text-text-secondary">
                    Tipo de encuesta
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-10 w-full bg-white">
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
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[13px] text-text-secondary">
                    Sección
                  </label>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="h-10 w-full bg-white">
                      <SelectValue placeholder="Selecciona la sección" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentType?.sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <h3 className="font-bold text-[14px] text-text-primary">
                  {filteredQuestions.length} preguntas
                </h3>
                <button 
                  type="button" 
                  onClick={handleSelectAll}
                  className="text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  {allFilteredSelected ? "Deseleccionar todo" : "Añadir todo"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "selected" && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[13px] text-text-secondary">
                    Filtrar por tipo
                  </label>
                  <Select value={selectedTabType} onValueChange={setSelectedTabType}>
                    <SelectTrigger className="h-10 w-full bg-white">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {questionBankData.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[13px] text-text-secondary">
                    Filtrar por sección
                  </label>
                  <Select value={selectedTabSection} onValueChange={setSelectedTabSection} disabled={selectedTabType === "all"}>
                    <SelectTrigger className="h-10 w-full bg-white">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {questionBankData.find(t => t.id === selectedTabType)?.sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <h3 className="font-bold text-[14px] text-text-primary">
                  {selectedQuestions.size} preguntas seleccionadas
                </h3>
                {selectedQuestions.size > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setSelectedQuestions(new Set())}
                    className="text-[13px] font-medium text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Limpiar selección
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="flex flex-col gap-3">
            {activeTab === "all" ? (
              <>
                {filteredQuestions.map((q) => {
                  const isSelected = selectedQuestions.has(q.id)
                  return (
                    <label
                      key={q.id}
                      className={cn(
                        "group relative flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/50",
                        isSelected ? "border-primary bg-primary/[0.02] ring-1 ring-primary/20" : "border-border bg-card"
                      )}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => handleToggleQuestion(q.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-medium leading-snug">
                            {q.text}
                          </p>
                          <Badge variant="outline" className="text-[10px] bg-white text-muted-foreground shrink-0 mt-[-2px]">
                            Creada por UBITS
                          </Badge>
                        </div>
                      </div>
                    </label>
                  )
                })}
                {filteredQuestions.length === 0 && (
                  <EmptyState 
                    title="No se encontraron preguntas"
                    description="Intenta buscar con otros términos o cambiar los filtros de sección y tipo."
                    icon={Search}
                    className="mt-8"
                  />
                )}
              </>
            ) : (
              <>
                {filteredSelectedQuestionsDetails.map((q) => (
                  <label
                    key={q.id}
                    className={cn(
                      "group relative flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all hover:border-primary/50 border-primary bg-primary/[0.02] ring-1 ring-primary/20"
                    )}
                  >
                    <Checkbox 
                      checked={true}
                      onCheckedChange={() => handleToggleQuestion(q.id)}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex flex-col flex-1 gap-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium leading-snug">
                          {q.text}
                        </p>
                        <Badge variant="outline" className="text-[10px] bg-white text-muted-foreground shrink-0 mt-[-2px]">
                          Creada por UBITS
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {q.typeName} / {q.sectionName}
                      </span>
                    </div>
                  </label>
                ))}
                {filteredSelectedQuestionsDetails.length === 0 && (
                  <EmptyState 
                    title="Aún no hay preguntas seleccionadas"
                    description="Explora el catálogo y selecciona las preguntas que desees añadir a tu encuesta."
                    icon={Inbox}
                    className="mt-8"
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="border-t bg-white p-4 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={selectedQuestions.size === 0}>
            Agregar ({selectedQuestions.size} preguntas)
          </Button>
        </div>
      </div>
    </DrawerShell>
  )
}
