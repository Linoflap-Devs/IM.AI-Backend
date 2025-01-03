import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";

export const getPromo = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId, bId } = req.params;

    const query = isID(bId)
        ? request.input('branchId', sql.Int, bId)
            .query(`SELECT 
                        dbo.Promo.PromoId, 
                        dbo.Promo.Name, 
                        dbo.Promo.Category, 
                        dbo.Promo.Percentage, 
                        dbo.Promo.BranchId, 
                        dbo.Promo.EndDate, 
                        dbo.Promo.StartDate,
                        dbo.Promo.IsDeleted, 
                        dbo.Promo.CreatedAt, 
                        dbo.Promo.UpdatedAt, 
                        dbo.Branch.CompanyId
                    FROM 
                        dbo.Promo 
                    INNER JOIN 
                        dbo.Branch ON dbo.Promo.BranchId = dbo.Branch.BranchId
                    WHERE 
                        dbo.Promo.BranchId = @branchId AND dbo.Promo.isDeleted = 0`)
        : isID(cId)
            ? request.input('companyId', sql.Int, cId)
                .query(`SELECT  
                            dbo.Promo.PromoId, 
                            dbo.Promo.Name, 
                            dbo.Promo.Category, 
                            dbo.Promo.Percentage, 
                            dbo.Promo.BranchId, 
                            dbo.Promo.EndDate, 
                            dbo.Promo.StartDate,
                            dbo.Promo.IsDeleted, 
                            dbo.Promo.CreatedAt, 
                            dbo.Promo.UpdatedAt, 
                            dbo.Branch.CompanyId
                        FROM 
                            dbo.Promo 
                        INNER JOIN
                            dbo.Branch ON dbo.Promo.BranchId = dbo.Branch.BranchId 
                        WHERE 
                            dbo.Branch.CompanyId = @companyId AND dbo.Promo.isDeleted = 0`)
            : request.query(`SELECT  
                            dbo.Promo.PromoId, 
                            dbo.Promo.Name, 
                            dbo.Promo.Category, 
                            dbo.Promo.Percentage, 
                            dbo.Promo.BranchId, 
                            dbo.Promo.EndDate, 
                            dbo.Promo.StartDate,
                            dbo.Promo.IsDeleted, 
                            dbo.Promo.CreatedAt, 
                            dbo.Promo.UpdatedAt, 
                            dbo.Branch.CompanyId
                        FROM 
                            dbo.Promo 
                        INNER JOIN
                            dbo.Branch ON dbo.Promo.BranchId = dbo.Branch.BranchId
                        WHERE dbo.Promo.isDeleted = 0`);
    try {
        const clientActivity = await query;
        res.status(200).json(clientActivity.recordset);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});


export const getPromoProducts = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { pId } = req.params;
    const query = request.input('promoId', sql.Int, pId)
        .query(`SELECT DISTINCT * FROM vw_PromoDetails WHERE PromoId = @promoId`);
    try {
        const promoProducts = await query;
        res.status(200).json(promoProducts.recordset);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
})
export const addPromo = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const {
        name,
        percentage,
        category,
        companyId,
        branchId,
        startDate,
        endDate,
        products
    } = req.body;

    console.log(req.body)

    request.input("percentage", sql.Int, percentage);
    request.input("category", sql.VarChar, category);
    request.input("companyId", sql.Int, companyId);
    request.input("branchId", sql.Int, branchId);
    request.input("startDate", sql.DateTime, startDate)
    request.input("endDate", sql.DateTime, endDate);
    request.input("name", sql.VarChar, name);

    const query = request.query(`INSERT INTO Promo (Name,Percentage, Category, CompanyId, BranchId, StartDate, EndDate )
                            VALUES (@name,@percentage, @category, @companyId, @branchId, @startDate, @endDate) SELECT SCOPE_IDENTITY() AS id`);
    try {
        const promo = await query
            .then(async (data: any) => {
                const id = data.recordset[0].id;
                await request.query(`INSERT INTO PromoProducts (PromoId,ProductId) VALUES ${products.map((item: number) => `( ${id}, ${item})`).join(',')}`)
                console.log(`INSERT INTO PromoProducts (PromoId,ProductId) VALUES ${products.map((item: number) => `(${id},${item})`).join(',')}`)
            });
        res.status(200).json(promo);
    } catch (e) {``
        res.status(500).send(e);
        console.log(e);
    }
});

export const editPromo = asyncHandler(async (req, res) => {
    const transaction = new sql.Transaction()
    const {
        id,
        name,
        percentage,
        startDate,
        endDate,
        products
    } = req.body

    console.log(req.body)

    try {
        await transaction.begin()

        const editPromo = await transaction.request()
            .input("name", sql.VarChar, name)
            .input("percentage", sql.Int, percentage)
            .input("startDate", sql.DateTime, startDate)
            .input("endDate", sql.DateTime, endDate)
            .input("id", sql.Int, id)
            .query(`
                UPDATE Promo
                SET
                    Name = @name,
                    Percentage = @percentage,
                    StartDate = @startDate,
                    EndDate = @endDate
                OUTPUT INSERTED.*
                WHERE PromoId = @id    
            `)
        
        if(products.length > 0) {
            const deleteProducts = await transaction.request()
                .input("id", sql.Int, id)
                .query(`
                    DELETE FROM PromoProducts
                    WHERE PromoId = @id AND ProductId NOT IN (${products.join(',')})    
                `)
        } 
        else {
            const deleteProductsAll = await transaction.request()
                .input("id", sql.Int, id)
                .query(`
                    DELETE FROM PromoProducts
                    WHERE PromoId = @id    
                `)  
        }

        const editPromoProducts = await transaction.request()
                .input("id", sql.Int, id)
                .query(`
                    INSERT INTO PromoProducts (PromoId,ProductId) 
                    VALUES ${products.map((item: number) => `( @id, ${item})`).join(',')}
                `)

        await transaction.commit()
        res.status(200).json({ message: "Promo updated successfully.", data: editPromo.recordset[0]})
    }
    catch (error: any) {
        await transaction.rollback()
        throw new Error(error.message)
    }
})

export const deletePromo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const query = sql.query`UPDATE Promo SET IsDeleted = 1 WHERE PromoId = ${id}`;
    try {
        const promo = await query;
        res.status(200).json(promo);
    } catch (e) {
        res.status(500).send(e);
    }
});











