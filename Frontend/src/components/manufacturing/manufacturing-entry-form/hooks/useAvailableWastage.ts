import { useEffect, useState } from "react";
import { fetchWastageQty } from "@/lib/api";

export function useAvailableWastage(
  tphBatchValue: string,
  productCategoryValue: string,
  finishedProductNameValue: string,
) {
  const [availableWastageQty, setAvailableWastageQty] = useState(0);
  const [isWastageLoading, setIsWastageLoading] = useState(false);

  useEffect(() => {
    const tphBatch = tphBatchValue.trim();
    const productCategory = productCategoryValue.trim();
    const finishedProductName = finishedProductNameValue.trim();

    if (!tphBatch || !productCategory || !finishedProductName) {
      setAvailableWastageQty(0);
      setIsWastageLoading(false);
      return;
    }

    let isActive = true;
    setIsWastageLoading(true);

    fetchWastageQty({
      tphBatch,
      productCategory,
      finishedProductName,
    })
      .then((qty) => {
        if (!isActive) {
          return;
        }

        setAvailableWastageQty(Number.isFinite(qty) ? qty : 0);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setAvailableWastageQty(0);
      })
      .finally(() => {
        if (isActive) {
          setIsWastageLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [finishedProductNameValue, productCategoryValue, tphBatchValue]);

  return {
    availableWastageQty,
    isWastageLoading,
    setAvailableWastageQty,
  };
}
