import { DatePickerInput } from "@/components/ui/DatePickerInput";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { OTHER_OPTION, TPH_BATCH_OPTIONS } from "../constants";
import { Field } from "../Field";
import type { ManufacturingFormData, ManufacturingOtherField } from "../types";

interface BatchDetailsSectionProps {
  formData: ManufacturingFormData;
  getSelectValue: (field: ManufacturingOtherField, value: string) => string;
  onBatchNoChange: (value: string) => void;
  onProductionDateChange: (value: string) => void;
  onTphBatchChange: (value: string) => void;
  renderOtherInput: (field: ManufacturingOtherField, label: string, placeholder: string) => React.ReactNode;
}

export function BatchDetailsSection({
  formData,
  getSelectValue,
  onBatchNoChange,
  onProductionDateChange,
  onTphBatchChange,
  renderOtherInput,
}: BatchDetailsSectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Batch details</h3>
        <p className="mt-1 text-xs text-muted-foreground">Choose the production date, batch line, and batch number.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field htmlFor="productionDate" label="Production Date">
          <DatePickerInput
            id="productionDate"
            name="productionDate"
            value={formData.productionDate}
            onChange={onProductionDateChange}
          />
        </Field>

        <Field htmlFor="tphBatch" label="TPH / Batch">
          <Combobox
            id="tphBatch"
            name="tphBatch"
            value={getSelectValue("tphBatch", formData.tphBatch)}
            onChange={(e) => onTphBatchChange(e.target.value)}
          >
            <option value="" disabled>
              Select TPH/Batch
            </option>

            {TPH_BATCH_OPTIONS.map((option) => (
              <option key={option} value={option === "Other" ? OTHER_OPTION : option}>
                {option}
              </option>
            ))}
          </Combobox>
        </Field>
        {renderOtherInput("tphBatch", "TPH / Batch", "Enter batch type")}

        <Field htmlFor="batchNo" label="Batch No.">
          <Input
            id="batchNo"
            name="batchNo"
            placeholder="e.g. B-2405-018"
            value={formData.batchNo}
            onChange={(e) => onBatchNoChange(e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}


