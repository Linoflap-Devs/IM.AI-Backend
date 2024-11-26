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
                               SUM(Quantity) as Total_Quantity,
                               Expired,
                               NearExpiry,
                               Valid,
                               BranchName
                        FROM StockInventory 
                        WHERE BranchId = @branchId 
                        GROUP BY Name,ProductId,BranchId, Expired, NearExpiry, Valid, BranchName`)
            : isID(cId)
                ? request.input("companyId", sql.Int, companyId)
                    .query(`SELECT Name,ProductId,CompanyId,
                                   AVG(Criticallevel) as CriticalLevel,
                                   AVG(ReorderLevel) as ReorderLevel,
                                   SUM(Quantity) as Total_Quantity,
                                   Expired,
                                    NearExpiry,
                                    Valid,
                                    BranchName  
                            FROM StockInventory WHERE CompanyId = @companyId 
                            GROUP BY Name,ProductId,CompanyId, Expired, NearExpiry, Valid, BranchName`)
                : request.query(`SELECT Name,ProductId,
                                        AVG(Criticallevel) as CriticalLevel,
                                        AVG(ReorderLevel) as ReorderLevel,
                                        SUM(Quantity) as Total_Quantity,
                                        Expired,
                                        NearExpiry,
                                        Valid,
                                        BranchName 
                                FROM StockInventory 
                                GROUP BY Name,ProductId, Expired, NearExpiry, Valid, BranchName`);
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

