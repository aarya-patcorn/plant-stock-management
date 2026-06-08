import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "../Field";

interface WastageSectionProps {
  availableWastageQty: number;
  isWastageExceeded: boolean;
  isWastageLoading: boolean;
  packedWastageQty: number;
  remainingWastageQty: number;
  setWastageBagSize: (value: string) => void;
  setWastageTotalBags: (value: string) => void;
  wastageBagSize: string;
  wastageSizeLabel: string;
  wastageSizeOptions: string[];
  wastageTotalBags: string;
}

export function WastageSection({
  availableWastageQty,
  isWastageExceeded,
  isWastageLoading,
  packedWastageQty,
  remainingWastageQty,
  setWastageBagSize,
  setWastageTotalBags,
  wastageBagSize,
  wastageSizeLabel,
  wastageSizeOptions,
  wastageTotalBags,
}: WastageSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Wastage Quantity Usage</h2>
        <p className="text-sm text-muted-foreground">Use available wastage stock separately from finished product packing.</p>
      </div>

      <div
        className={`rounded-lg border p-4 text-sm font-medium ${isWastageExceeded
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
      >
        {isWastageLoading ? (
          <span>Loading wastage quantity...</span>
        ) : (
          <div className="">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div>Total Available Wastage: {availableWastageQty} KG</div>
              <div>Packed Wastage: {packedWastageQty} KG</div>
              <div>Remaining Wastage: {Math.max(0, remainingWastageQty)} KG</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2 mt-4">
              <Field className="md:col-span-1" htmlFor="wastageBagSize" label={wastageSizeLabel}>
                <Select
                  id="wastageBagSize"
                  value={wastageBagSize}
                  onChange={(e) => setWastageBagSize(e.target.value)}
                >
                  <option value="" disabled>Select {wastageSizeLabel}</option>
                  {wastageSizeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              </Field>
              <Field className="md:col-span-1" htmlFor="wastageTotalBags" label="Wastage Total Bags">
                <Input
                  id="wastageTotalBags"
                  type="number"
                  min="0"
                  step="1"
                  value={wastageTotalBags}
                  onChange={(e) => setWastageTotalBags(e.target.value)}
                  placeholder="Enter total bags"
                />
              </Field>
            </div>
          </div>
        )}
      </div>

      {isWastageExceeded ? (
        <p className="text-sm font-medium text-red-600">
          Packed wastage quantity cannot be greater than available wastage quantity.
        </p>
      ) : null}
    </div>
  );
}
