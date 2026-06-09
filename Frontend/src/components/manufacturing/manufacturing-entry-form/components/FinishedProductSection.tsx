import { Button } from "@/components/ui/button";
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
    <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Finished Product Details</h2>
          <p className="mt-1 text-xs text-muted-foreground">Set token, pack size, and total packed output for each finished item row.</p>
        </div>

        <Button
          type="button"
          onClick={addProductItem}
          variant="outline"
          disabled={isAutoCalculatedPackagingProduct}
        >
          + Add Item
        </Button>
      </div>

      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 text-sm font-medium text-sky-900">
        Total Batch: {batchKg} KG | Packed: {totalPackedKg} KG | Remaining/Wastage:{" "}
        {remainingKg} KG
      </div>

      {productItems.map((item, index) => (
        <div key={index} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Product Item {index + 1}</h3>

            {productItems.length > 1 && (
              <Button
                type="button"
                onClick={() => removeProductItem(index)}
                variant="ghost"
                className="h-auto px-0 py-0 text-sm font-medium text-red-600 shadow-none hover:bg-transparent hover:text-red-700"
              >
                Remove
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
