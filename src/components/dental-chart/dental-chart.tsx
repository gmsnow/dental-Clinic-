"use client"

import { useMemo } from "react"
import { TEETH_BY_DENTITION, type ToothMeta } from "@/lib/dental-tooth"
import { CONDITION_VISUALS } from "@/lib/constants/clinical"
import { cn } from "@/lib/utils"
import { ToothSvg } from "./tooth-svg"
import type { ToothRecordDTO } from "./condition-editor-dialog"

const HEALTHY_COLOR = CONDITION_VISUALS.HEALTHY.color

interface Props {
  dentition: "ADULT" | "PRIMARY"
  records: ToothRecordDTO[]
  onSelect: (tooth: ToothMeta) => void
  locale: "ar" | "en"
}

const UPPER_QUADS: Record<"ADULT" | "PRIMARY", number[]> = {
  ADULT: [1, 2],
  PRIMARY: [5, 6],
}
const LOWER_QUADS: Record<"ADULT" | "PRIMARY", number[]> = {
  ADULT: [4, 3],
  PRIMARY: [8, 7],
}

const ARC_AMP = 8
const TOOTH_W = 46

export function DentalChart({ dentition, records, onSelect, locale }: Props) {
  const teeth = TEETH_BY_DENTITION[dentition]

  const byTooth = useMemo(() => {
    const map = new Map<number, ToothRecordDTO>()
    for (const r of records) {
      if (r.dentition === dentition) map.set(r.toothNumber, r)
    }
    return map
  }, [records, dentition])

  const dominant = (rec?: ToothRecordDTO) => {
    if (!rec || rec.conditions.length === 0) return undefined
    return rec.conditions[rec.conditions.length - 1].condition
  }

  function renderQuad(quadId: number, rowArc: "upper" | "lower") {
    const rowTeeth = teeth.filter((t) => t.arc === rowArc).sort((a, b) => a.order - b.order)
    const quadTeeth = rowTeeth.filter((t) => t.quadrant === quadId).sort((a, b) => a.slot - b.slot)
    const firstIdx = rowTeeth.findIndex((t) => t.number === quadTeeth[0].number)
    const total = rowTeeth.length
    return quadTeeth.map((t, i) => {
      const rec = byTooth.get(t.number)
      const cond = dominant(rec)
      const visual = cond ? CONDITION_VISUALS[cond] : undefined
      const fill = visual?.color ?? HEALTHY_COLOR
      const isExtracted = cond === "MISSING" || cond === "EXTRACTED"
      // Continuous arch: 0 at the back molars, ARC_AMP at the midline.
      const norm = total > 1 ? Math.sin((Math.PI * (firstIdx + i)) / (total - 1)) : 0
      const offset = rowArc === "upper" ? ARC_AMP * norm : -ARC_AMP * norm
      return (
        <button
          key={t.number}
          type="button"
          className="group flex flex-col items-center gap-0.5 rounded-md px-0.5 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          style={{ marginTop: offset, width: TOOTH_W }}
          onClick={() => onSelect(t)}
          title={`#${t.number} ${locale === "ar" ? t.nameAr : t.nameEn}`}
        >
          <span
            className={cn(
              "block w-full transition-transform group-hover:scale-105",
              isExtracted && "opacity-50"
            )}
          >
            <ToothSvg
              kind={t.kind}
              fill={fill}
              stroke={isExtracted ? "#6b7280" : "currentColor"}
              active={false}
            />
          </span>
          <span className="text-[11px] font-medium tabular-nums leading-none text-muted-foreground">
            {t.number}
          </span>
        </button>
      )
    })
  }

  return (
    <div dir="ltr" className="w-full space-y-6 rounded-xl border bg-background p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {locale === "ar" ? "الفك العلوي" : "Upper arch"}
        </p>
        <div className="flex justify-center gap-6">
          {UPPER_QUADS[dentition].map((q) => (
            <div key={q} className="flex items-end">
              {renderQuad(q, "upper")}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {locale === "ar" ? "الفك السفلي" : "Lower arch"}
        </p>
        <div className="flex justify-center gap-6">
          {LOWER_QUADS[dentition].map((q) => (
            <div key={q} className="flex items-start">
              {renderQuad(q, "lower")}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}