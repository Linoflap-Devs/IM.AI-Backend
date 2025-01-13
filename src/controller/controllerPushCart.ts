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

export const getUnusualTransactions = asyncHandler(async (req, res) => {
    const { cId, bId } = req.params;
    const request = new sql.Request();
    const query = isID(bId) ? 
                    request.input("branchId", sql.Int, bId).query(` 
                        SELECT  
                            UnusualTransactionId,
                            CompanyName,
                            BranchName, 
                            CartCode,
                            ClientId,
                            Remarks,
                            Status,
                            CreatedAt
                        FROM vw_UnusualTransactions
                        WHERE BranchId = @branchId 
                    `):
                isID(cId) ? 
                    request.input("companyId", sql.Int, cId).query(` 
                        SELECT 
                            UnusualTransactionId,
                            CompanyName,
                            BranchName, 
                            CartCode,
                            ClientId,
                            Remarks,
                            Status,
                            CreatedAt
                        FROM vw_UnusualTransactions
                        WHERE CompanyId = @companyId 
                    `):
                    request.query(` 
                        SELECT
                            UnusualTransactionId,
                            CompanyName,
                            BranchName, 
                            CartCode,
                            ClientId,
                            Remarks,
                            Status,
                            CreatedAt
                        FROM vw_UnusualTransactions
                    `);

    try {
        const unusualTransactions = await query;
        res.status(200).json({success: true, message: "List of Unusual Transactions", data: unusualTransactions.recordset});
    } catch (error: any) {
        console.log(error);
        res.status(500).json({success: false, message: error.message, data: []});
    }

})

export const addUnusualTransaction = asyncHandler(async (req, res) => {
    const { bId, cartCode, clientId, remarks, status } = req.body;
    const request = new sql.Request()

    request.input("branchId", sql.Int, bId)
    request.input("cartCode", sql.NVarChar, cartCode)
    request.input("clientId", sql.Int, clientId)
    request.input("remarks", sql.NVarChar, remarks)
    request.input("status", sql.Int, status)

    const query = request.query(`INSERT INTO UnusualTransactions (BranchId, CartCode, ClientId, Remarks, Status) OUTPUT INSERTED.* VALUES (@branchId, @cartCode, @clientId, @remarks, @status)`)

    try {
        const unusualTransaction = await query;
        res.status(200).json({success: true, message: "Added Unusual Transaction", data: unusualTransaction.recordset});
    } 
    catch (error: any) {
        console.log(error);
        res.status(500).json({success: true, message: "Failed to add Unusual Transaction", data: []});
    }
})

export const resolveUnusualCart = asyncHandler(async (req, res) => {
    const { cartId } = req.params;
    const request = new sql.Request();
    request.input("cartId", sql.Int, cartId);

})
