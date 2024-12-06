import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";

export const getProducts = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId } = req.params;
    const query = isID(bId)
        ? request.input("branchId", sql.Int, bId).query(`SELECT 
                            ProductId,Name,BarCode,ActualWeight,CategoryId,BranchId,ProductWeight,Price,PurchasePrice, BranchName, CategoryName FROM vw_Products
                            WHERE BranchId = @branchId
                            GROUP BY Name,BarCode,ActualWeight,CategoryId,BranchId,ProductWeight,ProductId,Price,PurchasePrice, BranchName, CategoryName`)
        : isID(cId)
            ? request.input("companyId", sql.Int, cId).query(`SELECT 
                        ProductId,Name,BarCode,ActualWeight,CategoryId,CompanyId,ProductWeight,Price,PurchasePrice, BranchName, CategoryName
                        FROM vw_Products
                        WHERE CompanyId = @companyId
                        GROUP BY ProductId,Name,BarCode,ActualWeight,CategoryId,CompanyId,ProductWeight,Price,PurchasePrice, BranchName, CategoryName`)
            : request.query(`SELECT 
                            Name,BarCode,ActualWeight,CategoryId,ProductWeight,ProductId,Price, PurchasePrice, BranchName, CategoryName
                            FROM vw_Products
                            GROUP BY ProductId,Name,BarCode,ActualWeight,CategoryId,ProductWeight,Price,PurchasePrice, BranchName, CategoryName`);
    try {
        const products = await query;
        res.status(200).json(products.recordset);
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

export const getProduct = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId, pId } = req.params;
    request.input("productId", sql.Int, pId)
    const query = isID(bId)
        ? request.input("branchId", sql.Int, bId).query(`SELECT 
                            ProductId,p.Name,BarCode,ActualWeight,c.Name as Category,BranchId,ProductWeight,Price,PurchasePrice,p.CriticalLevel, p.ReorderLevel
                            FROM vw_Products p
                            JOIN Category c on p.CategoryId = c.CategoryId
                            WHERE BranchId = @branchId AND ProductId = @productId
                            GROUP BY p.Name,BarCode,ActualWeight,c.Name,BranchId,ProductWeight,ProductId,Price,PurchasePrice,p.CriticalLevel, p.ReorderLevel`)
        : isID(cId)
            ? request.input("companyId", sql.Int, cId).query(`SELECT 
                        ProductId,p.Name,BarCode,ActualWeight,c.Name as Category,p.CompanyId,ProductWeight,Price,PurchasePrice, p.CriticalLevel, p.ReorderLevel
                        FROM vw_Products p
                        JOIN Category c on p.CategoryId = c.CategoryId
                        WHERE p.CompanyId = @companyId AND ProductId = @productId
                        GROUP BY ProductId,p.Name,BarCode,ActualWeight,c.Name,p.CompanyId,ProductWeight,Price,PurchasePrice,p.CriticalLevel, p.ReorderLevel`)
            : request.query(`SELECT 
                            p.Name,BarCode,ActualWeight,c.Name as Category,ProductWeight,ProductId,Price,PurchasePrice,p.CriticalLevel, p.ReorderLevel
                            FROM vw_Products p
                            JOIN Category c on p.CategoryId = c.CategoryId
                            WHERE ProductId = @productId
                            GROUP BY ProductId,p.Name,BarCode,ActualWeight,c.Name,ProductWeight,Price,PurchasePrice,p.CriticalLevel, p.ReorderLevel`);
    try {
        const products = await query;
        res.status(200).json(products.recordset);
    } catch (e) {
        console.log(e)
        res.status(500).send(e);
    }
});

/* Work on progress fix the query */

export const addProducts = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { productName,
        companyId,
        branchId,
        barcode,
        netWeight,
        category,
        price,
        purchasePrice,
        critLvlStock,
        lowlvlStock,
        unit
    } = req.body
    let productId: number
    console.log(req.body)
    /* Check barcode exist */
    const checkBarcode = request.input("barcode", sql.VarChar, barcode).query(
        `SELECT * FROM Product WHERE Barcode = @barcode`
    )
    try {
        const check = await checkBarcode;
        if (check.recordset.length === 0) {
            request.input("name", sql.VarChar, productName)
            request.input("netWeight", sql.Float, netWeight)
            request.input("categoryId", sql.Int, category)
            request.input("productWeight", sql.Float, netWeight)
            request.input("critLvlStock", sql.Int, critLvlStock)
            request.input("lowlvlStock", sql.Int, lowlvlStock)
            request.input("unit", sql.VarChar, unit)

            const query = request.query(
                `INSERT INTO Product (Name, Barcode, CategoryId, ActualWeight,ProductWeight,Unit, CriticalLevel, ReorderLevel)
            VALUES (@name, @barcode, @categoryId, @netWeight, @netWeight,@unit, @critLvlStock, @lowlvlStock); SELECT SCOPE_IDENTITY() AS ProductId;`);
            const result = await query;
            productId = result.recordset[0].ProductId
        } else {
            productId = check.recordset[0].ProductId
        }
        if (branchId === "all") {
            const branchIds = await request.input("companyId", sql.Int, companyId).query(
                `SELECT BranchId FROM Branch WHERE CompanyId = @companyId`
            )
            branchIds.recordset.map(async (branch) => {
                const productRequest = new sql.Request();
                await productRequest
                    .input("productId", sql.Int, productId)
                    .input("branchId", sql.Int, branch.BranchId)
                    .input("price", sql.Float, price)
                    .input("purchasePrice", sql.Decimal, purchasePrice)
                    .query(`INSERT INTO BranchProducts (ProductId, BranchId,Price, PurchasePrice) VALUES (@productId, @branchId, @price, @purchasePrice)`)
            })
        } else {
            await request
                .input("productId", sql.Int, productId)
                .input("branchId", sql.Int, branchId)
                .input("price", sql.Float, price)
                .input("purchasePrice", sql.Decimal, purchasePrice)
                .query(`INSERT INTO BranchProducts (ProductId, BranchId,Price, PurchasePrice) VALUES (@productId, @branchId,@price, @purchasePrice)`)
        }
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).send(error);
    }
});

export const getTransportStocks = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId } = req.params;
    console.log(req.params)
    const query = isID(bId)
        ? request.input("branchId", sql.Int, bId).query(`SELECT 
                                STR(TransferOrderId) as TransferOrderId,
                                CompanyId,
                                Status,
                                SourceStoreId,
                                SourceBranch,
                                DestinationStoreId,
                                DestinationBranch,
                                CreatedAt,
                                Received
                            FROM 
                                vw_TransferOrder
                            WHERE 
                                SourceStoreId = @branchId OR DestinationStoreId = @branchId
                            ORDER BY
                              CASE 
                                WHEN Status = 'For Shipping' AND DestinationStoreId = @branchId THEN 1
                                WHEN Status = 'Pending Store Approval' AND SourceStoreId = @branchId THEN 2
                                WHEN Status = 'Pending Store Approval' THEN 3
                                WHEN Status = 'Pending Company Approval' THEN 4
                                WHEN Status = 'Received' THEN 5
                                WHEN Status = 'Declined' THEN 6
                                ELSE 7
                              END`)
        : isID(cId)
            ? request.input("companyId", sql.Int, cId)
                .query(`SELECT STR(TransferOrderId) as TransferOrderId,
                                CompanyId,
                                Status,
                                SourceStoreId,
                                SourceBranch,
                                DestinationStoreId,
                                DestinationBranch,
                                CreatedAt,
                                Received
                            FROM vw_TransferOrder
                            WHERE CompanyId = @companyId
                            ORDER BY 
                                CASE 
                                    WHEN Status = 'Pending Company Approval' THEN 1
                                    WHEN Status = 'Pending Store Approval' THEN 3
                                    WHEN Status = 'For Shipping' THEN 4
                                    WHEN Status = 'Received' THEN 5
                                    WHEN Status = 'Declined' THEN 2
                                    ELSE 7
                                END`)
            : request
                .query(`SELECT STR(TransferOrderId) as TransferOrderId,
                                CompanyId,
                                Status,
                                SourceStoreId,
                                SourceBranch,
                                DestinationStoreId,
                                DestinationBranch,
                                Received,
                                CreatedAt
                            FROM vw_TransferOrder
                            ORDER BY 
                                CASE 
                                    WHEN Status = 'Pending Company Approval' THEN 1
                                    WHEN Status = 'Pending Store Approval' THEN 2
                                    WHEN Status = 'For Shipping' THEN 3
                                    WHEN Status = 'Received' THEN 4
                                    WHEN Status = 'Declined' THEN 5
                                    ELSE 7
                                END`);
    try {
        const result = await query;
        res.status(200).json(result.recordset);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});
/* Process  */
export const requestStockTransfer = asyncHandler(async (req, res) => {
    /* Pending Company Approval32 */
    const { branchId, products } = req.body

    const request = new sql.Request();

    try {
        const query = await request.input("DestinationStoreId", sql.Int, branchId)
            .query(`INSERT INTO TransferOrder (DestinationStoreId, Status) VALUES (@DestinationStoreId, 'Pending Company Approval') SELECT SCOPE_IDENTITY() AS id`)
            .then((res) => {
                const id = res.recordset[0].id
                request.query(`INSERT INTO TransferStockDetail (TransferOrderId, ProductId, RequestQuantity) VALUES ${products.map((item: any) => `( ${id}, ${item.productId}, ${item.quantity})`).join(',')}`)
            })
        res.status(200).json(query);
    } catch (error) {
        res.status(500).send(error);
    }

});
/* To be fixed store procedure */
export const confirmationByCompany = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { transferStockId, status, SourceStoreId, products } = req.body;
    const query =
        status == "Declined"
            ? request
                .input("requestId", sql.Int, transferStockId)
                .query(
                    `UPDATE TransferOrder SET Status = 'Declined' WHERE TransferOrderId = @requestId`
                )
            : request
                .input("requestId", sql.Int, transferStockId)
                .input("SourceStoreId", sql.Int, SourceStoreId)
                .query(
                    `UPDATE TransferOrder SET Status = 'Pending Store Approval',       
                                  SourceStoreId = @SourceStoreId
                            WHERE TransferOrderId = @requestId`
                );

    try {
        if (status == "Confirm") {
            await products.map(async (item: any) => {
                request.input(`quantity${item.productId}`, sql.Int, item.quantity)
                request.input(`productId${item.productId}`, sql.Int, item.productId)
                    .query(
                        `UPDATE TransferStockDetail SET ApprovedQuantity = @quantity${item.productId} WHERE TransferOrderId = @requestId AND ProductId = @productId${item.productId}`
                    )
            });
        }
        const result = await query;
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});
export const confirmationByStoreSender = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { transferStockId, status, products } = req.body;
    const query =
        status == "Declined"
            ? request
                .input("requestId", sql.Int, transferStockId)
                .query(
                    `UPDATE TransferOrder SET Status = 'Declined' WHERE TransferOrderId = @requestId`
                )
            : request.input("requestId", sql.Int, transferStockId).query(
                `UPDATE TransferOrder SET Status = 'For Shipping'       
                        WHERE TransferOrderId = @requestId`
            );
    try {
        if (status == "Confirm") {
            await products.map(async (item: any) => {
                request.input(`quantity${item.productId}`, sql.Int, item.quantity)
                request.input(`productId${item.productId}`, sql.Int, item.productId)
                    .query(
                        `UPDATE TransferStockDetail SET ShippedQuantity = @quantity${item.productId} WHERE TransferOrderId = @requestId AND ProductId = @productId${item.productId}`
                    )
            });
        }
        const result = await query;

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});
export const receivedApproval = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { transferStockId, products } = req.body;
    const query = request
        .input("requestId", sql.Int, transferStockId)
        .query(
            `UPDATE TransferOrder SET Status = 'Received', Received = GETDATE()   WHERE TransferOrderId = @requestId`
        );
    try {
        await products.map(async (item: any) => {
            request.input(`quantity${item.productId}`, sql.Int, item.quantity)
            request.input(`productId${item.productId}`, sql.Int, item.productId)
                .query(
                    `UPDATE TransferStockDetail SET ReceivedQuantity = @quantity${item.productId} WHERE TransferOrderId = @requestId AND ProductId = @productId${item.productId}`
                )
        });
        const result = await query;
        console.log(result)
        res.status(200).json(result);
    } catch (error) {
        res.status(500).send(error);
    }
});
export const getTransferProducts = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const query = request.input("transferStockId", sql.Int, req.params.tId)
        .query(`SELECT *
                FROM vw_TransferProductsStocks
                WHERE TransferOrderId = @transferStockId`)
    try {
        const products = await query;
        res.status(200).json(products.recordset);
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
})
export const reprocessRequest = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { transferStockId } = req.body
    const query = request
        .input("transferStockId", sql.Int, transferStockId)
        .query(
            `UPDATE TransferOrder SET Status = 'Pending Store Approval' WHERE TransferOrderId = @transferStockId`
        );
    try {
        const result = await query;
        res.status(200).json(result);
    } catch (error) {
        res.status(500).send(error);
    }
})

export const getCategoriesAll = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const query = request.query(`SELECT * FROM Category`);
    try {
        const categories = await query;
        res.status(200).json(categories.recordset);
    } catch (error) {
        res.status(500).send(error);
    }
})

export const getCategories = asyncHandler(async (req, res) => {
    const request = new sql.Request();

    console.log(req.query)

    const { companyId } = req.query;

    request.input("companyId", sql.Int, companyId)

    const query = request.query(`SELECT * FROM Category WHERE CompanyId = @companyId OR CompanyId IS NULL`);
    try {
        const categories = await query;
        res.status(200).json(categories.recordset);
    } catch (error) {
        res.status(500).send(error);
    }
})

export const addCategory = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        name,
        companyId
    } = req.body;

    if(!name) {
        res.status(500).json({message: "Category name is null."})
    }
    request.input("categoryName", sql.VarChar, name)
    request.input("companyId", sql.Int, companyId)
    
    const query = request.query(`
        INSERT INTO Category (Name, CompanyId) 
        OUTPUT INSERTED.*
        VALUES (@categoryName, @companyId)
        `)
        
    try {
        const category = await query;
        console.log(category)
        res.status(200).json(category.recordset[0])
    }
    catch (error: any){
        console.log(error)
        res.status(500).json({message: error.message})
    }
})

export const editCategory = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        id,
        value
    } = req.body

    request.input("Id", sql.BigInt, id)
    request.input("Value", sql.VarChar, value)

    const query = request.query(`
        UPDATE Category
        SET Name = @Value
        OUTPUT INSERTED.*
        WHERE CategoryId = @Id
    `)

    try {
        const edit = await query;
        console.log(edit)
        res.status(200).json(edit.recordset[0])
    }
    catch (error: any){
        //console.log(error)
        res.status(500).json({message: error.message})
    }
})

export const deleteCategory = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        id
    } = req.body

    console.log(req.body)

    request.input("Id", sql.BigInt, id)

    const query = request.query(`
        DELETE FROM Category
        OUTPUT DELETED.*
        WHERE CategoryId = @Id
    `)

    try {
        const deleteCategory = await query;
        res.status(200).json(deleteCategory.recordset[0])
    }
    catch (error: any){
        console.log(error)
        res.status(500).json({message: error.message})
    }
})  