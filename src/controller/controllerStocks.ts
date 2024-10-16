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
                        FROM vw_Stocks 
                        WHERE BranchId = @branchId 
                        GROUP BY Name,ProductId,BranchId`)
            : isID(cId)
                ? request.input("companyId", sql.Int, companyId)
                    .query(`SELECT Name,ProductId,CompanyId,
                                   AVG(Criticallevel) as CriticalLevel,
                                   AVG(ReorderLevel) as ReorderLevel,
                                   SUM(Quantity) as Total_Quantity  
                            FROM vw_Stocks WHERE CompanyId = @companyId 
                            GROUP BY Name,ProductId,CompanyId`)
                : request.query(`SELECT Name,ProductId,
                                        AVG(Criticallevel) as CriticalLevel,
                                        AVG(ReorderLevel) as ReorderLevel,
                                        SUM(Quantity) as Total_Quantity 
                                FROM vw_Stocks 
                                GROUP BY Name,ProductId`);
    try {
        const stocks = await query;
        res.status(200).json(stocks.recordset);
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }

})

