import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "../Field";
import type { ManufacturingOtherField, ManufacturingFormData } from "../types";

interface ProductDetailsSectionProps {
  colorOptions: string[];
  finishedProductOptions: string[];
  formData: ManufacturingFormData;
  getSelectValue: (field: ManufacturingOtherField, value: string) => string;
  isColorDisabled: boolean;
  isProductCategoryLocked: boolean;
  onColorChange: (value: string) => void;
  onFinishedProductNameChange: (value: string) => void;
  onFinishedProductNameInputChange: (value: string) => void;
  onProductCategoryChange: (value: string) => void;
  productCategoryOptions: string[];
  renderOtherInput: (field: ManufacturingOtherField, label: string, placeholder: string) => React.ReactNode;
  selectedColor: string;
  updateTextField: (name: keyof ManufacturingFormData, value: string) => void;
}

export function ProductDetailsSection({
  colorOptions,
  finishedProductOptions,
  formData,
  getSelectValue,
  isColorDisabled,
  isProductCategoryLocked,
  onColorChange,
  onFinishedProductNameChange,
  onFinishedProductNameInputChange,
  onProductCategoryChange,
  productCategoryOptions,
  renderOtherInput,
  selectedColor,
  updateTextField,
}: ProductDetailsSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field htmlFor="productCategory" label="Product Category">
        <Select
          id="productCategory"
          name="productCategory"
          value={getSelectValue("productCategory", formData.productCategory)}
          onChange={(e) => onProductCategoryChange(e.target.value)}
          disabled={isProductCategoryLocked || !formData.tphBatch}
        >
          <option value="" disabled>
            Select category
          </option>

          {productCategoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
      {renderOtherInput("productCategory", "Product Category", "Enter product category")}

      <Field htmlFor="finishedProductName" label="Finished Product Name">
        {finishedProductOptions.length > 0 ? (
          <Select
            id="finishedProductName"
            name="finishedProductName"
            value={getSelectValue("finishedProductName", formData.finishedProductName)}
            onChange={(e) => onFinishedProductNameChange(e.target.value)}
          >
            <option value="" disabled>Select Finished Product</option>
            {finishedProductOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id="finishedProductName"
            name="finishedProductName"
            placeholder="Enter finished product"
            value={formData.finishedProductName}
            onChange={(e) => onFinishedProductNameInputChange(e.target.value)}
          />
        )}
      </Field>

      {finishedProductOptions.length > 0 &&
        renderOtherInput("finishedProductName", "Finished Product Name", "Enter finished product")}

      <Field htmlFor="color" label="Color (auto-filled for TPH batches)">
        {colorOptions.length > 0 || isColorDisabled ? (
          <Select
            id="color"
            name="color"
            value={getSelectValue("color", selectedColor || "")}
            onChange={(e) => onColorChange(e.target.value)}
            disabled={isColorDisabled}
          >
            <option value="" disabled>
              Select Color
            </option>
            {isColorDisabled && selectedColor ? (
              <option value={selectedColor}>{selectedColor}</option>
            ) : null}
            {colorOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            id="color"
            name="color"
            placeholder="e.g. Grey, White, etc."
            value={selectedColor || ""}
            onChange={(e) => updateTextField("color", e.target.value)}
          />
        )}
      </Field>
      {colorOptions.length > 0 && !isColorDisabled && renderOtherInput("color", "Color", "Enter color")}
    </div>
  );
}
