const Wastage = require("../model/Wastage");

const escapeRegex = (value = "") => {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getWastageQty = async (req, res) => {
    try {
        const { tphBatch, productCategory, finishedProductName } = req.query;
        console.log("WASTAGE QUERY:", req.query);

        const wastage = await Wastage.findOne({
            tphBatch: new RegExp(`^${escapeRegex(tphBatch)}$`, "i"),
            finishedProductName: new RegExp(`^${escapeRegex(finishedProductName)}$`, "i"),
        });

        console.log("WASTAGE FOUND:", wastage);

        res.status(200).json({
            success: true,
            data: {
                tphBatch: tphBatch || "",
                finishedProductName: finishedProductName || "",
                wastageQty: wastage ? Number(wastage.wastageQty || 0) : 0,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const updateRemainingWastageQty = async (req, res) => {
  try {
    const tphBatch = String(req.body.tphBatch || "").trim();
    const finishedProductName = String(req.body.finishedProductName || "").trim();
    const remainingWastageQty = Number(req.body.remainingWastageQty || 0);

    if (!tphBatch || !finishedProductName) {
      return res.status(400).json({
        success: false,
        message: "TPH Batch and Finished Product Name are required.",
      });
    }

    const wastage = await Wastage.findOneAndUpdate(
      {
        tphBatch,
        finishedProductName,
      },
      {
        $set: {
          wastageQty: remainingWastageQty,
        },
      },
      {
        new: true,
      }
    );

    if (!wastage) {
      return res.status(404).json({
        success: false,
        message: "Wastage record not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Wastage quantity updated successfully.",
      data: wastage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
    getWastageQty,
    updateRemainingWastageQty,
};
