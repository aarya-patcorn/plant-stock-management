import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "../Field";
import type { ManufacturingProductItem } from "../types";

interface FinishedProductSectionProps {
  addProductItem: () => void;
  bagSizeLabel: string;
  batchKg: number;
  formProductCategory: string;
  formTphBatch: string;
  getAutoProducedQuantity: (productCategory: string, totalProducedKg: number, bagSize: string) => string;
  getBondureTotalBagsProduced: (bagSize: string) => string;
  getFinalTotalBagsProduced: (tphBatch: string, bagSize: string, wastageTotalBags: string) => string;
  isAutoCalculatedPackagingProduct: boolean;
  isTileAdhesiveProduct: boolean;
  productItems: ManufacturingProductItem[];
  remainingKg: number;
  removeProductItem: (index: number) => void;
  selectedProductCategory: string;
  totalPackedKg: number;
  totalProducedLabel: string;
  updateProductItem: (index: number, field: keyof ManufacturingProductItem, value: string) => void;
  wastageTotalBags: string;
}

export function FinishedProductSection({
  addProductItem,
  bagSizeLabel,
  batchKg,
  formProductCategory,
  formTphBatch,
  getAutoProducedQuantity,
  getBondureTotalBagsProduced,
  getFinalTotalBagsProduced,
  isAutoCalculatedPackagingProduct,
  isTileAdhesiveProduct,
  productItems,
  remainingKg,
  removeProductItem,
  selectedProductCategory,
  totalPackedKg,
  totalProducedLabel,
  updateProductItem,
  wastageTotalBags,
}: FinishedProductSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Finished Product Details</h2>

        <button
          type="button"
          onClick={addProductItem}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          disabled={isAutoCalculatedPackagingProduct}
        >
          + Add Item
        </button>
      </div>

      <hr className="my-0" />

      <div className="rounded-lg bg-blue-50 p-4 text-sm font-medium">
        Total Batch: {batchKg} KG | Packed: {totalPackedKg} KG | Remaining/Wastage:{" "}
        {remainingKg} KG
      </div>

      {productItems.map((item, index) => (
        <div key={index} className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Product Item {index + 1}</h3>

            {productItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeProductItem(index)}
                className="text-red-600 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Token" htmlFor={`token-${index}`}>
              <Select
                id={`token-${index}`}
                value={item.token}
                onChange={(e) => updateProductItem(index, "token", e.target.value)}
                disabled={!isTileAdhesiveProduct}
              >
                {isTileAdhesiveProduct ? (
                  <>
                    <option value="">Select Token</option>
                    <option value="Coupon">Coupon</option>
                    <option value="Non-Coupon">Non-Coupon</option>
                  </>
                ) : (
                  <option value="N/A">N/A</option>
                )}
              </Select>
            </Field>

            <Field label={bagSizeLabel} htmlFor={`bagSize-${index}`}>
              <Select
                id={`bagSize-${index}`}
                value={item.bagSize}
                onChange={(e) => {
                  const bagSize = e.target.value;
                  const nextTotalBagsProduced =
                    selectedProductCategory === "Bondure"
                      ? getBondureTotalBagsProduced(bagSize)
                      : isAutoCalculatedPackagingProduct
                        ? getAutoProducedQuantity(selectedProductCategory, batchKg, bagSize)
                        : getFinalTotalBagsProduced(
                          formTphBatch,
                          bagSize,
                          wastageTotalBags,
                        );

                  updateProductItem(index, "bagSize", bagSize);
                  updateProductItem(index, "totalBagsProduced", nextTotalBagsProduced);
                }}
              >
                <option value="">Select {bagSizeLabel}</option>

                {formProductCategory === "Bondure" && (
                  <option value="40kg">40KG</option>
                )}

                {formProductCategory === "Epoxy" && (
                  <>
                    <option value="1kg">1KG</option>
                    <option value="5kg">5KG</option>
                  </>
                )}

                {formProductCategory === "Grout" && (
                  <option value="Pouch 1KG">1KG</option>
                )}

                {formProductCategory === "Tile Cleaner" && (
                  <>
                    <option value="1L">1L</option>
                    <option value="5L">5L</option>
                  </>
                )}

                {!["Bondure", "Epoxy", "Grout", "Tile Cleaner"].includes(formProductCategory) && (
                  <>
                    <option value="20kg">20KG</option>
                    <option value="50kg">50KG</option>
                  </>
                )}
              </Select>
            </Field>

            <Field label={totalProducedLabel} htmlFor={`totalBagsProduced-${index}`}>
              <Input
                type="number"
                min="0"
                id={`totalBagsProduced-${index}`}
                value={item.totalBagsProduced}
                onChange={(e) =>
                  updateProductItem(index, "totalBagsProduced", e.target.value)
                }
              />
            </Field>
          </div>
        </div>
      ))}
    </div>
  );
}
