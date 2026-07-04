import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Field } from "../Field";
import type { ManufacturingProductItem } from "../types";

interface FinishedProductSectionProps {
  addProductItem: () => void;
  bagSizeLabel: string;
  batchKg: number;
  disableAddProductItem: boolean;
  formProductCategory: string;
  formTphBatch: string;
  getAutoProducedQuantity: (productCategory: string, totalProducedKg: number, bagSize: string) => string;
  getBondureTotalBagsProduced: (bagSize: string, batchKg?: number) => string;
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
  disableAddProductItem,
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
          disabled={disableAddProductItem}
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
              <Combobox
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
              </Combobox>
            </Field>

            <Field label={bagSizeLabel} htmlFor={`bagSize-${index}`}>
              <Combobox
                id={`bagSize-${index}`}
                value={item.bagSize}
                onChange={(e) => {
                  const bagSize = e.target.value;
                  const nextTotalBagsProduced =
                    formProductCategory === "Tile Cleaner"
                      ? item.totalBagsProduced
                      : selectedProductCategory === "Bondure"
                        ? getBondureTotalBagsProduced(bagSize, batchKg)
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
              </Combobox>
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



