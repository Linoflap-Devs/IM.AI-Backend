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
                               SUM(Quantity) as Total_Quantity 
                        FROM StockInventory 
                        WHERE BranchId = @branchId 
                        GROUP BY Name,ProductId,BranchId`)
            : isID(cId)
                ? request.input("companyId", sql.Int, companyId)
                    .query(`SELECT Name,ProductId,CompanyId,
                                   AVG(Criticallevel) as CriticalLevel,
                                   AVG(ReorderLevel) as ReorderLevel,
                                   SUM(Quantity) as Total_Quantity  
                            FROM StockInventory WHERE CompanyId = @companyId 
                            GROUP BY Name,ProductId,CompanyId`)
                : request.query(`SELECT Name,ProductId,
                                        AVG(Criticallevel) as CriticalLevel,
                                        AVG(ReorderLevel) as ReorderLevel,
                                        SUM(Quantity) as Total_Quantity 
                                FROM StockInventory 
                                GROUP BY Name,ProductId`);
    try {
        const stocks = await query;
        res.status(200).json(stocks.recordset);
    } catch (error: any) {
        console.log(error.message)
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
        INSERT INTO Stocks (ProductId, ExpiryDate, Quantity, BranchId, BatchId) 
        OUTPUT INSERTED.*
        VALUES (@productId, @expiryDate, @quantity, @branchId, @batchId)`);

    try {
        const stock = await query;
        res.status(200).json(stock.recordset[0]);
    }
    catch(error: any) {
        res.status(500).send(error.message);
    }
})

