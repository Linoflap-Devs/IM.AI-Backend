import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";

export const getPushCart = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    // Perform the query based on the provided parameters
    const { cId, bId } = req.params;
    
    request.input("transactionStatus", sql.NVarChar, "On-going");

    /*     const query = isID(bId)
        ? request.input("branchId", sql.Int, bId).query(`SELECT * 
                            FROM vw_PushCart_Status2 
                            WHERE BranchId = @branchId 
                            AND WHERE TransactionStatus = @transactionStatus
                            OR TransactionStatus is NULL
                            ORDER BY PushCartId ASC`)
        : isID(cId)
        ? request.input("companyId", sql.Int, cId).query(`SELECT * 
                            FROM vw_PushCart_Status2 
                            WHERE CompanyId = @companyId 
                            AND WHERE TransactionStatus = @transactionStatus
                            OR TransactionStatus is NULL
                            ORDER BY PushCartId ASC`)
        : request.query(`SELECT * 
                            FROM vw_PushCart_Status2 
                            WHERE TransactionStatus = @transactionStatus
                            OR TransactionStatus is NULL
                            ORDER BY PushCartId ASC`);
 */
    const query = isID(bId)
        ? request.input("branchId", sql.Int, bId).query(`SELECT DISTINCT * 
                            FROM [Fn_GetCartList](@branchId)`)
        : isID(cId)
        ? request.input("companyId", sql.Int, cId).query(`SELECT DISTINCT * 
                            FROM vw_PushCart_Status2 
                            WHERE CompanyId = @companyId 
                            AND WHERE TransactionStatus = @transactionStatus
                            OR TransactionStatus is NULL
                            ORDER BY PushCartId ASC`)
            : request.query(`SELECT DISTINCT * 
                            FROM vw_PushCart_Status2 
                            WHERE TransactionStatus = @transactionStatus
                            OR TransactionStatus is NULL
                            ORDER BY PushCartId ASC`);

    try {
        const pushCart = await query;
        res.status(200).json(pushCart.recordset);
    } catch (error) {
        console.log(error);
    }
});

export const getPushCartReport = asyncHandler(async (req, res) => {
    const { cartId } = req.body;

    const query = sql.query`SELECT * FROM PushCartReport WHERE PushCartId = ${cartId}`;

    try {
        const cartReport = await query;
        res.status(200).json(cartReport.recordset);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});

export const addPushCartReport = asyncHandler(async (req, res) => {
    const { cartId, report } = req.body;
    const query = sql.query`INSERT INTO PushCartReport (PushCartId,ReportMessage) VALUES (${cartId},${report})`;
    try {
        const cartReport = await query;
        res.status(200).json(cartReport.recordset);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});
