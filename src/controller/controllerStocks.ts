import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";


export const getStocks = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId } = req.params;
    const companyId = cId;
    const branchId = bId;
    const query =
        isID(bId)
            ? request.input("branchId", sql.Int, branchId)
                .query(`SELECT Name,ProductId,BranchId,
                               AVG(Criticallevel) as CriticalLevel,
                               AVG(ReorderLevel) as ReorderLevel,
                               CategoryName,
                               SUM(Quantity) as Total_Quantity,
                               Expired,
                               NearExpiry,
                               Valid,
                               BranchName
                        FROM StockInventory 
                        WHERE BranchId = @branchId 
                        GROUP BY Name,ProductId,BranchId,CategoryName, Expired, NearExpiry, Valid, BranchName`)
            : isID(cId)
                ? request.input("companyId", sql.Int, companyId)
                    .query(`SELECT Name,ProductId,CompanyId,
                                   AVG(Criticallevel) as CriticalLevel,
                                   AVG(ReorderLevel) as ReorderLevel,
                                   CategoryName,
                                   SUM(Quantity) as Total_Quantity,
                                   Expired,
                                    NearExpiry,
                                    Valid,
                                    BranchName  
                            FROM StockInventory WHERE CompanyId = @companyId 
                            GROUP BY Name,ProductId,CompanyId,CategoryName, Expired, NearExpiry, Valid, BranchName`)
                : request.query(`SELECT Name,ProductId,
                                        AVG(Criticallevel) as CriticalLevel,
                                        AVG(ReorderLevel) as ReorderLevel,
                                        CategoryName,
                                        SUM(Quantity) as Total_Quantity,
                                        Expired,
                                        NearExpiry,
                                        Valid,
                                        BranchName 
                                FROM StockInventory 
                                GROUP BY Name,ProductId, CategoryName,Expired, NearExpiry, Valid, BranchName`);
    try {
        const stocks = await query;
        res.status(200).json(stocks.recordset);
    } catch (error: any) {
        console.log(error.message)
        res.status(500).send(error.message);
    }
})

export const getStockByProduct = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId, pId } = req.params;

    const branchOnly = /^[0-9]+$/.test(bId?.toString() || "")

    const branchQuery = `
        SELECT Name, ProductId, CriticalLevel, ReorderLevel, Quantity, Expired, NearExpiry, Valid, BranchName
        FROM StockInventory
        JOIN Batches ON StockInventory.
        WHERE CompanyId = ${cId} AND BranchId = ${bId} AND ProductId = ${pId}
        GROUP BY Name, ProductId, CriticalLevel, ReorderLevel, Quantity, Expired, NearExpiry, Valid, BranchName
    `
    const allBranchQuery = `
        SELECT Name, ProductId, CriticalLevel, ReorderLevel, Quantity, Expired, NearExpiry, Valid, BranchName
        FROM StockInventory
        WHERE CompanyId = ${cId} AND ProductId = ${pId}
        GROUP BY Name, ProductId, CriticalLevel, ReorderLevel, Quantity, Expired, NearExpiry, Valid, BranchName
    `

    const query = request.query(branchOnly ? branchQuery : allBranchQuery)
    try {
        const stock = await query;
        res.status(200).json(stock.recordset);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
})

export const addStock = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        productId,
        expiryDate,
        quantity,
        branchId,
        batchId
    } = req.body;

    request.input("productId", sql.Int, productId);
    request.input("expiryDate", sql.Date, expiryDate);
    request.input("quantity", sql.Int, quantity);
    request.input("branchId", sql.Int, branchId);
    request.input("batchId", sql.Int, batchId);

    const query = request.query(`
        INSERT INTO Stocks (ProductId,  Quantity, Initial, BranchId, BatchId) 
        OUTPUT INSERTED.*
        VALUES (@productId, @quantity, @quantity, @branchId, @batchId)`);

    try {
        const stock = await query;
        res.status(200).json(stock.recordset[0]);
    }
    catch(error: any) {
        res.status(500).send(error.message);
    }
})

export const getStockAdjustments = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const fetchStockId = new sql.Request();

    const { bId } = req.params;

    fetchStockId.input("batchId", sql.Int, bId);
    try {
        const stockIdQuery = await fetchStockId.query(`
            SELECT StockId FROM Stocks WHERE BatchId = @batchId
        `)
        
        if(stockIdQuery.recordset.length === 0) {
            throw new Error("BatchId does not have an associated StockId")
        }

        const stockId = stockIdQuery.recordset[0].StockId
        request.input("stockId", sql.Int, stockId);

        const query = request.query(`
            SELECT * FROM vw_StockAdjustments WHERE StockId = @stockId
        `)
        const stockAdjustments = await query;
        res.status(200).json(stockAdjustments.recordset);
    }
    catch(error: any) {
        res.status(500).send(error.message);
    }
})

export const getStockAdjustmentTypes = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const query = request.query(`SELECT StockAdjustmentTypeId, StockAdjustmentType FROM StockAdjustmentType`);

    try {
        const stockAdjustmentTypes = await query;
        res.status(200).json(stockAdjustmentTypes.recordset);
    }
    catch(error: any) {
        res.status(500).send(error.message);
    }
}) 

export const addStockAdjustment = asyncHandler(async (req, res) => {
    const transaction = new sql.Transaction();
    const {
        bId,
        adjustmentType,
        initial,
        quantity,
        notes,
        location,
        uId,
    } = req.body;

    try {
        await transaction.begin();

        console.log(req.body)
        const fetchStockId = transaction.request();
        fetchStockId.input("batchId", sql.Int, bId);
        const stockIdQuery = await fetchStockId.query(`
            SELECT StockId FROM Stocks WHERE BatchId = @batchId
        `)
        if(stockIdQuery.recordset.length === 0) {
            console.log("No stockId associated.")
            throw new Error("BatchId does not have an associated StockId")
        }

        const stockId = stockIdQuery.recordset[0].StockId
        console.log(`stockId: ${stockId}`)
        
        const request = transaction.request();
        request.input("stockId", sql.Int, stockId);
        request.input("adjustmentType", sql.Int, parseInt(adjustmentType));
        request.input("initial", sql.Int, initial);
        request.input("quantity", sql.Int, quantity);
        request.input("total", sql.Int, initial + quantity);
        request.input("notes", sql.Text, notes);
        request.input("userId", sql.Int, uId);
        request.input("location", sql.Text, location);
    
        const insertAdjustment = await request.query(`
            INSERT INTO StockAdjustments (StockId, StockAdjustmentType, Quantity, Notes, AdjustedBy, Initial, Total, Location) 
            OUTPUT INSERTED.*
            VALUES (@stockId, @adjustmentType, @quantity, @notes, @userId, @initial, @total, @location)
        `)

        if(insertAdjustment.recordset.length === 0) {
            console.log("Inserting into StockAdjustments failed.")
            throw new Error("Failed to insert adjustment")
        }

        const updateBatchRequest = transaction.request();
        updateBatchRequest.input("batchId", sql.Int, bId);
        updateBatchRequest.input("quantity", sql.Int, quantity);
        console.log(updateBatchRequest.parameters)
        const updateQuery = `
           DECLARE @currentQuantity INT;

            -- Retrieve the current quantity for the batch
            SELECT @currentQuantity = Quantity
            FROM Batches
            WHERE Id = @batchId;

            -- Update the batch quantity
            UPDATE Batches
            SET Quantity = CASE
                WHEN @currentQuantity + @quantity >= 0 THEN @currentQuantity + @quantity
                ELSE Quantity -- Prevent invalid update
            END
            WHERE Id = @batchId;

            -- Check if the quantity would fall below zero
            IF @currentQuantity + @quantity < 0
            BEGIN
                RAISERROR ('Batch quantity cannot be negative. Current Quantity: %d, Change: %d', 16, 1, @currentQuantity, @quantity);
            END
        `;

        console.log("step here")
        const updateBatchResult = await updateBatchRequest.query(updateQuery);
        console.log(updateBatchResult.output)

        const updateStockRequest = transaction.request();
        updateStockRequest.input("stockId", sql.Int, stockId);
        updateStockRequest.input("quantity", sql.Int, quantity);
        const updateStocksQuery = `
            DECLARE @currentQuantity INT;

            -- Retrieve the current quantity for the stock
            SELECT @currentQuantity = Quantity
            FROM Stocks
            WHERE StockId = @stockId;

            -- Update the stock quantity
            UPDATE Stocks
            SET Quantity = CASE
                WHEN @currentQuantity + @quantity >= 0 THEN @currentQuantity + @quantity
                ELSE Quantity -- Prevent invalid update
            END
            WHERE StockId = @stockId;

            -- Check if the quantity would fall below zero
            IF @currentQuantity + @quantity < 0
            BEGIN
                RAISERROR ('Stock quantity cannot be negative. Current Quantity: %d, Change: %d', 16, 1, @currentQuantity, @quantity);
            END

        `;

        const updateStockResult = await updateStockRequest.query(updateStocksQuery);
        console.log(`UpdateStock param: ` + updateStockRequest.parameters)
        console.log(`UpdateStockResult:` + updateStockResult.output)
        await transaction.commit();
        res.status(200).json({success: true, message: "Adjustments added successfully.", data: insertAdjustment.recordset[0]});
    }

    catch(error: any) {
        await transaction.rollback();
        console.log(error)
        res.status(500).send(error.message);
    }
})

