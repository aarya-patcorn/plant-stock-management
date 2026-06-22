import { Input } from "@/components/ui/input";
import { Field } from "../Field";
import type { ManufacturingRawMaterial } from "../types";

interface RawMaterialsSectionProps {
  rawMaterials: ManufacturingRawMaterial[];
  updateRawMaterialNumberField: (index: number, field: string, value: string) => void;
  updateRawMaterialTextField: (index: number, field: string, value: string) => void;
}

export function RawMaterialsSection({
  rawMaterials,
  updateRawMaterialNumberField,
  updateRawMaterialTextField,
}: RawMaterialsSectionProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Raw Materials Used</h2>
        <p className="mt-1 text-xs text-muted-foreground">Review the exact material lines that will be submitted for this production entry.</p>
      </div>

      {rawMaterials.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4"
        >
          <Field className="min-w-0" htmlFor={`rawMaterialName-${index}`} label="Raw Material">
            <Input
              className="w-full"
              id={`rawMaterialName-${index}`}
              placeholder="e.g. Cement"
              value={item.rawMaterialName}
              onChange={(e) =>
                updateRawMaterialTextField(index, "rawMaterialName", e.target.value)
              }
            />
          </Field>

          <Field className="min-w-0" htmlFor={`packagingType-${index}`} label="Packaging Type">
            <Input
              className="w-full"
              id={`packagingType-${index}`}
              placeholder="e.g. White, Premix"
              value={item.packagingType}
              onChange={(e) =>
                updateRawMaterialTextField(index, "packagingType", e.target.value)
              }
            />
          </Field>

          <Field className="min-w-0" htmlFor={`materialQuantity-${index}`} label="Material Quantity">
            <Input
              className="w-full"
              id={`materialQuantity-${index}`}
              placeholder="e.g. 1000 kg"
              value={item.materialQuantity}
              onChange={(e) =>
                updateRawMaterialNumberField(index, "materialQuantity", e.target.value)
              }
            />
          </Field>

          <Field className="min-w-0" htmlFor={`materialUnit-${index}`} label="Unit">
            <Input
              className="w-full"
              id={`materialUnit-${index}`}
              placeholder="e.g. kg"
              value={item.materialUnit}
              onChange={(e) =>
                updateRawMaterialTextField(index, "materialUnit", e.target.value)
              }
            />
          </Field>
        </div>
      ))}
    </div>
  );
}
