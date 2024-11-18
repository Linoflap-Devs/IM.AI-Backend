import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";

export const getBatches = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId } = req.query;

    console.log(req.query)
    
    request.input("companyId", sql.Int, cId);
    request.input("branchId", sql.Int, bId);

    const query = request.query(`SELECT * FROM Batches WHERE CompanyId = @companyId AND BranchId = @branchId`)
    
    try {
        const batches = await query
        res.status(200).json(batches.recordset);
    }
    catch(error: any) {
        res.status(500).send(error.message);
    } 
})

export const addBatch = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        batchNo,
        productId,
        expDate,
        supplierId,
        companyId, 
        branchId
    } = req.body

    console.log(req.body)

    request.input("batchNo", sql.VarChar, batchNo);
    request.input("productId", sql.Int, productId);
    request.input("expDate", sql.SmallDateTime, expDate);
    request.input("supplierId", sql.Int, supplierId);
    request.input("companyId", sql.Int, companyId);
    request.input("branchId", sql.Int, branchId);

    const query = request.query(`
        INSERT INTO Batches (BatchNo, ProductId, ExpirationDate, SupplierId, CompanyId, BranchId) 
        OUTPUT INSERTED.*
        VALUES (@batchNo, @productId, @expDate, @supplierId, @companyId, @branchId)`)

    try {
        const batch = await query
        res.status(200).json(batch.recordset[0]);
    }
    catch(error: any) {
        res.status(500).send(error.message);
    }
})

export const editBatch = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        id,
        batchNo,
        productId,
        expDate,
        supplierId,
        companyId, 
        branchId
    } = req.body
    request.input("id", sql.Int, id);
    request.input("batchNo", sql.VarChar, batchNo);
    request.input("productId", sql.Int, productId);
    request.input("expDate", sql.SmallDateTime, expDate);
    request.input("supplierId", sql.Int, supplierId);
    request.input("companyId", sql.Int, companyId);
    request.input("branchId", sql.Int, branchId);

    const query = request.query(
        `
        UPDATE Batches
        SET BatchNo = @batchNo, ProductId = @productId, ExpirationDate = @expDate, SupplierId = @supplierId, CompanyId = @companyId, BranchId = @branchId
        OUTPUT INSERTED.*
        WHERE Id = @id
        `
    )

    try {
        const batch = await query
        res.status(200).json(batch.recordset[0]);
    }
    catch(error: any) {
        res.status(500).send(error.message);
    }
})

export const deleteBatch = asyncHandler(async (req, res) => {
    const request = new sql.Request();

    const { id } = req.body;
    console.log(req.body);

    request.input("id", sql.Int, id);
    const query = sql.query(
        `
            DELETE FROM Batches 
            OUTPUT DELETED.*
            WHERE Id = ${id}
        `
    );
    try {
        const batch = await query;
        res.status(200).json(batch.recordset[0]);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
}) 