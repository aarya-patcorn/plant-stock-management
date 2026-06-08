import { Input } from "@/components/ui/input";
import { Field } from "../Field";
import type { ManufacturingRawMaterial } from "../types";

interface RawMaterialsSectionProps {
  isRecipeLocked: boolean;
  rawMaterials: ManufacturingRawMaterial[];
  updateRawMaterialNumberField: (index: number, field: string, value: string) => void;
  updateRawMaterialTextField: (index: number, field: string, value: string) => void;
}

export function RawMaterialsSection({
  isRecipeLocked,
  rawMaterials,
  updateRawMaterialNumberField,
  updateRawMaterialTextField,
}: RawMaterialsSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Raw Materials Used</h2>
      <hr className="my-0" />

      {rawMaterials.map((item, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-md border p-4 md:items-end xl:grid xl:grid-cols-4"
        >
          <Field className="min-w-0" htmlFor={`rawMaterialName-${index}`} label="Raw Material">
            <Input
              className="w-full"
              id={`rawMaterialName-${index}`}
              placeholder="e.g. Cement"
              readOnly={isRecipeLocked}
              value={item.packagingType}
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
              readOnly={isRecipeLocked}
              value={item.rawMaterialName}
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
              readOnly={isRecipeLocked}
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
              readOnly={isRecipeLocked}
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
