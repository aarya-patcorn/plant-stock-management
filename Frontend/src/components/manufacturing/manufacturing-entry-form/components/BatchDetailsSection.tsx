import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    <div className="grid gap-4 md:grid-cols-3">
      <Field htmlFor="productionDate" label="Production Date">
        <Input
          id="productionDate"
          name="productionDate"
          type="date"
          value={formData.productionDate}
          onChange={(e) => onProductionDateChange(e.target.value)}
        />
      </Field>

      <Field htmlFor="tphBatch" label="TPH / Batch">
        <Select
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
        </Select>
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
  );
}
