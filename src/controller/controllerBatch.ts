import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";


/* Batches */

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

export const getBatchesProduct = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId, pId } = req.query;

    const branchOnly = /^[0-9]+$/.test(bId?.toString() || "")

    console.log(req.query)
    
    const allBranchQuery = `SELECT Batches.Id, Batches.BatchNo, Stocks.Quantity, Stocks.Initial, Batches.ExpirationDate, Batches.CreatedAt, Supplier.SupplierName AS Supplier, Branch.Name AS BranchName, LocationStatus.Name AS LocationStatus FROM Batches JOIN Supplier ON Batches.SupplierId = Supplier.SupplierId JOIN Stocks ON Stocks.BatchId = Batches.Id JOIN Branch ON Branch.BranchId = Batches.BranchId LEFT JOIN LocationStatus ON Batches.LocationStatusId = LocationStatus.LocationStatusId WHERE Batches.CompanyId = ${cId} AND Batches.ProductId = ${pId} ORDER BY Batches.CreatedAt DESC`
    const branchQuery = `SELECT Batches.Id, Batches.BatchNo, Stocks.Quantity, Stocks.Initial, Batches.ExpirationDate, Batches.CreatedAt, Supplier.SupplierName AS Supplier, Branch.Name AS BranchName, LocationStatus.Name AS LocationStatus FROM Batches JOIN Supplier ON Batches.SupplierId = Supplier.SupplierId JOIN Stocks ON Stocks.BatchId = Batches.Id JOIN Branch ON Branch.BranchId = Batches.BranchId LEFT JOIN LocationStatus ON Batches.LocationStatusId = LocationStatus.LocationStatusId WHERE Batches.CompanyId = ${cId} AND Batches.BranchId = ${bId} AND Batches.ProductId = ${pId} ORDER BY Batches.CreatedAt DESC`

    const query = request.query(branchOnly ? branchQuery : allBranchQuery)
    console.log(query)
    
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
        quantity,
        supplierId,
        companyId, 
        branchId
    } = req.body

    console.log(req.body)

    request.input("batchNo", sql.VarChar, batchNo);
    request.input("productId", sql.Int, productId);
    request.input("expDate", sql.SmallDateTime, expDate);
    request.input("quantity", sql.Int, quantity);
    request.input("supplierId", sql.Int, supplierId);
    request.input("companyId", sql.Int, companyId);
    request.input("branchId", sql.Int, branchId);

    const query = request.query(`
        INSERT INTO Batches (BatchNo, ProductId, Quantity, ExpirationDate, SupplierId, CompanyId, BranchId) 
        OUTPUT INSERTED.*
        VALUES (@batchNo, @productId, @quantity, @expDate, @supplierId, @companyId, @branchId)`)

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

export const displayBatch = asyncHandler(async (req, res) => {
    const request = new sql.Request(); 
    const transaction = new sql.Transaction();

    const { id } = req.body;
    console.log(req.body, id)

    try {
        await transaction.begin();

        const batchDetails = await transaction.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT Id, ProductId, Quantity, LocationStatusId
                FROM Batches
                WHERE Id = @id
            `)
        
        if (batchDetails.recordset.length === 0) {
            throw new Error("Batch not found");
        }

        const { Id, ProductId, Quantity, LocationStatusId } = batchDetails.recordset[0];

        const updateBatch = await transaction.request()
        .input("id", sql.Int, id)
        .input("NewLocation", sql.Int, 2)
        .query(`
            UPDATE Batches
            SET LocationStatusId = @NewLocation
            OUTPUT INSERTED.*
            WHERE Id = @id    
        `)

        const transferBatch = await transaction.request()
            .input("Source", sql.Int, LocationStatusId)
            .input("Destination", sql.Int, 2)
            .query(`
                INSERT INTO InternalTransferOrder (SourceLocationId, DestinationLocationId)
                OUTPUT INSERTED.*
                VALUES (@Source, @Destination)
            `)

        const { InternalTransferOrderId } = transferBatch.recordset[0];

        await transaction.request()
            .input("TransferOrderId", sql.Int, InternalTransferOrderId)
            .input("ProductId", sql.Int, ProductId)
            .input("Quantity", sql.Int, Quantity)
            .input("BatchId", sql.Int, Id)
            .query(`
                INSERT InternalTransferOrderDetail (InternalTransferOrderId, ProductId, BatchId, Quantity)
                VALUES (@TransferOrderId, @ProductId, @BatchId, @Quantity)
            `)

        await transaction.commit();
        res.status(200).json({ message: "Batch moved successfully", batch: updateBatch.recordset[0] });
    }
    catch (error: any) {
        await transaction.rollback()
        throw new Error(error.message)
        console.log(error.message)
    }
    
    // request.input("id", sql.Int, id);
    // const query = request.query(`
    //     UPDATE Batches 
    //     SET LocationStatusId = 2 
    //     OUTPUT INSERTED.*
    //     WHERE Id = @id
    // `)

    // const recordQuery = request.query(`
    //     SELECT @CurrentLoc = Batches.LocationStatusId
    //     FROM Batches 
    //     WHERE Batches.Id = @id

    //     INSERT INTO InternalTransferOrder (SourceLocationId, DestinationLocationId) VALUES
    //     (@CurrentLoc, 2)
    //     OUTPUT INSERTED.*     
    // `)

    // const recordDetailQuery = request.query(`
    //     SELECT @ProductId  = Batches.ProductId
    //     FROM Batches
    //     WHERE Batches.Id = @id

    //     SELECT @BatchId = Batches.Id
    //     FROM Batches
    //     WHERE Batches.Id = @id

    //     SELECT @Quantity = Batches.Quantity
    //     FROM Batches
    //     WHERE Batches.Id = @id

    //     INSERT INTO InternalTransferOrderDetail (TransferOrderId, ProductId, Quantity) VALUES
    // `)
    
    // try {
    //     const batch = await query;
    //     res.status(200).json(batch.recordset[0]);
    // } catch (error: any) {
    //     console.log(error)
    //     res.status(500).send(error.message);
    // }
})

export const storeBatch = asyncHandler(async (req, res) => {
    // const request = new sql.Request(); 

    // const { id } = req.body;
    // console.log(req.body, id)
    
    // request.input("id", sql.Int, id);
    // const query = request.query(`
    //     UPDATE Batches 
    //     SET LocationStatusId = 1 
    //     OUTPUT INSERTED.*
    //     WHERE Id = @id
    // `)
    
    // try {
    //     const batch = await query;
    //     res.status(200).json(batch.recordset[0]);
    // } catch (error: any) {
    //     console.log(error)
    //     res.status(500).send(error.message);
    // }

    const request = new sql.Request(); 
    const transaction = new sql.Transaction();

    const { id } = req.body;
    console.log(req.body, id)

    try {
        await transaction.begin();

        const batchDetails = await transaction.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT Id, ProductId, Quantity, LocationStatusId
                FROM Batches
                WHERE Id = @id
            `)
        
        if (batchDetails.recordset.length === 0) {
            throw new Error("Batch not found");
        }

        const { Id, ProductId, Quantity, LocationStatusId } = batchDetails.recordset[0];

        const updateBatch = await transaction.request()
            .input("id", sql.Int, id)
            .input("NewLocation", sql.Int, 1)
            .query(`
                UPDATE Batches
                SET LocationStatusId = @NewLocation
                OUTPUT INSERTED.*
                WHERE Id = @id    
            `)

        const transferBatch = await transaction.request()
            .input("Source", sql.Int, LocationStatusId)
            .input("Destination", sql.Int, 1)
            .query(`
                INSERT INTO InternalTransferOrder (SourceLocationId, DestinationLocationId)
                OUTPUT INSERTED.*
                VALUES (@Source, @Destination)
            `)

        const { InternalTransferOrderId } = transferBatch.recordset[0];

        await transaction.request()
            .input("TransferOrderId", sql.Int, InternalTransferOrderId)
            .input("ProductId", sql.Int, ProductId)
            .input("Quantity", sql.Int, Quantity)
            .input("BatchId", sql.Int, Id)
            .query(`
                INSERT InternalTransferOrderDetail (InternalTransferOrderId, ProductId, BatchId, Quantity)
                VALUES (@TransferOrderId, @ProductId, @BatchId, @Quantity)
            `)

        await transaction.commit();
        res.status(200).json({ message: "Batch moved successfully", batch: updateBatch.recordset[0]});
    }
    catch (error: any) {
        await transaction.rollback()
        throw new Error(error.message)
        console.log(error.message)
    }
})

/* Batch Remarks */

export const getBatchRemarks = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { id } = req.query

    request.input("id", sql.Int, id)

    const query = request.query(`
        SELECT BatchRemarkText, BatchId, UserId, CreatedAt FROM BatchRemarks WHERE BatchId = @id ORDER BY CreatedAt DESC
    `)

    try {
        const response = await query
        res.status(200).json(response.recordset);
    }

    catch (error: any) {
        console.log(error)
        res.status(500).send(error.message);
    }
})

export const addBatchRemarks = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { batchId, remark, userId } = req.body

    request.input("batchId", sql.Int, batchId)
    request.input("remark", sql.Text, remark)
    request.input("userId", sql.Int, userId)

    const query = request.query(`
        INSERT INTO BatchRemarks (BatchId, BatchRemarkText, UserId)
        OUTPUT INSERTED.*
        VALUES (@batchId, @remark, @userId)
    `)

    try {
        const response = await query
        res.status(200).json(response.recordset[0]);
    }
    catch(error: any){
        console.log(error)
        res.status(500).send(error.message);
    }
})  