const ProductMaterialLog = require("../model/ProductMaterialLog");

const getProductMaterialLogs = async (_req, res) => {
    try {
        const productMaterialLogs = await ProductMaterialLog.find().sort({
            createdAt: -1,
        });

        res.json({
            success: true,
            data: productMaterialLogs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getProductMaterialLogs,
};