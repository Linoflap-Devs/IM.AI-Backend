import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";

export const getSupplier = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId } = req.params;
    const companyId = cId;

    const query = isID(companyId)
        ? request.input("companyId", sql.Int, companyId).query(`SELECT * 
                        FROM Supplier 
                        WHERE CompanyId = @companyId 
                        AND isDeleted = 0 
                        ORDER BY CreatedAt DESC`)
        : request.query(`SELECT * 
                            FROM Supplier 
                            WHERE isDeleted = 0 
                            ORDER BY CreatedAt DESC`);

    try {
        const supplier = await query;
        res.status(200).json(supplier.recordset);
    } catch (e) {
        res.status(500).send(e);
    }
});

export const addSupplier = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        email,
        name,
        companyId,
        address,
        contact,
        contactPerson,
        productList
    } = req.body;
    request.input("name", sql.VarChar, name);
    request.input("companyId", sql.Int, companyId);
    request.input("address", sql.VarChar, address);
    request.input("contact", sql.VarChar, contact);
    request.input("contactPerson", sql.VarChar, contactPerson);
    request.input("email", sql.VarChar, email);

    const query = request.query(
        `INSERT 
            INTO Supplier (SupplierName, CompanyId, Location, Contact, ContactPerson, Email) 
            VALUES (@name,@companyId,@address,@contact,@contactPerson,@email) SELECT SCOPE_IDENTITY() AS id`
    );

    console.log(productList);

    try {
        const result = await query.then(async (data: any) => {
            const id = data.recordset[0].id;
            request.input("id", sql.Int, id);
            await request.query(`INSERT INTO SupplierProducts (ProductId,SupplierId) 
                                 VALUES ${productList.map((item: any) => { return `(${item.value},@id)` }).join(",")}`);
        });
        res.status(200).json({});
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});
export const editSupplier = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        id,
        name,
        address,
        contact,
        contactPerson,
        email,
        productList,
        removedItems
    } = req.body;
    
    request.input("id", sql.Int, id);
    request.input("name", sql.VarChar, name);
    request.input("address", sql.VarChar, address);
    request.input("contact", sql.VarChar, contact);
    request.input("contactPerson", sql.VarChar, contactPerson);
    request.input("email", sql.VarChar, email);


    console.log(req.body);



    const { recordset: resOriginalProdList } = await request.query(`SELECT ProductId FROM SupplierProducts WHERE SupplierId = @id`);
    const originalProductList = resOriginalProdList.flatMap((item: any) => item.ProductId);
    const editedProductlist = productList.flatMap((item: any) => item.value);
    const removedProductList = removedItems.flatMap((item: any) => item.value);
    const addedProductList = editedProductlist.filter((item: any) => !originalProductList.includes(item));

    const query = request.query(
        `UPDATE Supplier
            SET 
            Contact = @contact,
            ContactPerson = @contactPerson,
            Location = @address,
            Email = @email,
            UpdatedAt = GETDATE()
            WHERE SupplierId = @id`
    );
    try {
        const result = await query.then(async () => {
            if (addedProductList.length > 0) await request.query(`INSERT INTO SupplierProducts (ProductId,SupplierId) VALUES ${addedProductList.map((item: any) => { return `(@id,${item})` }).join(",")}`)
            if (removedProductList.length > 0) await request.query(`UPDATE SupplierProducts SET IsDeleted = 1 WHERE SupplierId = @id AND ProductId IN ${removedProductList.map((item: any) => { return `(${item})` }).join(",")}`)
        });
        res.status(200).json(result);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});
export const deleteSupplier = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { id } = req.params;
    request.input("id", sql.Int, id);

    const query = request.query(`UPDATE Supplier SET isDeleted = 1 WHERE SupplierId = @id`
    ).then(async () => {
        await request.query(`UPDATE SupplierProducts SET IsDeleted = 1 WHERE SupplierId = @id`)
    })
    try {
        const result = await query;
        res.status(200).json(result);
    } catch (e) {
        res.status(500).send(e);
    }
});
export const getSupplierProducts = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { sId } = req.params;
    const query = request.input('supplierId', sql.Int, sId)
        .query(`SELECT * FROM vw_SupplierProducts WHERE SupplierId = @supplierId AND IsDeleted = 0`);
    try {
        const supplierProducts = await query;
        res.status(200).json(supplierProducts.recordset);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
})








