import asyncHandler from "express-async-handler";
import sql from "mssql";
import { dateOnly, isID } from "../util/helper";

export const getTransactions = asyncHandler(async (req, res) => {
    const { cId, bId, from, to } = req.params;
    const request = new sql.Request();
    request.input("dateFrom", sql.DateTime2, dateOnly(from, "start"));
    request.input("dateTo", sql.DateTime2, dateOnly(to, "end"));
    // console.log((await request.query(`SELECT  @dateFrom , @dateTo`)).recordset[0]);

    const query = isID(bId)
        ? request.input("branchId", sql.Int, bId).query(`SELECT * 
                        FROM vw_Transaction_Company 
                            WHERE BranchId = @branchId 
                            AND CreatedAt BETWEEN @dateFrom AND @dateTo
                        ORDER BY CreatedAt DESC`)
        : isID(cId)
            ? request.input("companyId", sql.Int, cId).query(`SELECT * 
                        FROM vw_Transaction_Company 
                            WHERE CompanyId = @companyId 
                            AND CreatedAt BETWEEN @dateFrom AND @dateTo
                        ORDER BY CreatedAt DESC`)
            : request.query(`SELECT * 
                        FROM vw_Transaction_Company 
                            WHERE CreatedAt BETWEEN @dateFrom AND @dateTo 
                        ORDER BY CreatedAt DESC`);
    try {
        const transactions = await query;
        const data = transactions.recordset;
        res.status(200).json(data);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

export const getTransaction = asyncHandler(async (req, res) => {
    const { tId } = req.params;
    console.log(tId)

    const request = new sql.Request();
    const query = request.query(`
        SELECT CreatedAt, UpdatedAt, TransactionStatus, ReferenceNumber, Name, Quantity, Price, ImgLink, CompanyId, BranchName
        FROM vw_TransactionReference
        WHERE TransactionId = ${tId}
    `)

    try {
        const transaction = await query;
        const data = transaction.recordset
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
})

export const getTransactionByRef = asyncHandler(async (req, res) => {
    const { rNo } = req.params;
    
    const request = new sql.Request();
    request.input("rNo", sql.NVarChar, rNo)
    const query = request.query(`
        SELECT CreatedAt, UpdatedAt, TransactionStatus, ReferenceNumber, Name, Quantity, Price, ImgLink, CompanyId, BranchName
        FROM vw_TransactionReference
        WHERE ReferenceNumber = @rNo
    `)

    console.log(` SELECT CreatedAt, UpdatedAt, TransactionStatus, ReferenceNumber, Name, Quantity, Price, ImgLink, CompanyId, BranchName
        FROM vw_TransactionReference
        WHERE ReferenceNumber = '${rNo}'`)

    try {
        console.log("hello")
        const transaction = await query;
        console.log(transaction)
        const data = transaction.recordset
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
})

export const editTransferStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(req.params);
    const request = new sql.Request();

    request.input("transactionId", sql.Int, id);
    const query = request.query(
        `UPDATE [Transaction] SET TransferableTransaction = 1 WHERE TransactionId = @transactionId`
    );

    try {
        const transaction = await query;
        res.status(200).json(transaction.recordset);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});
export const getTransactionProducts = asyncHandler(async (req, res) => {
    const { tId } = req.params;
    const request = new sql.Request();
    const query = request.input("transactionId", sql.BigInt, tId).query(
        `SELECT * FROM dbo.Fn_TransactionReference(@transactionId)`
    )
    try {
        let finalPrice = 0
        let subPrice = 0
        let discount = 0
        const transaction = await query
        transaction.recordset.map((item) => {
            const productPrice = item.Price * item.Quantity
            finalPrice += productPrice
        })
        subPrice = finalPrice
        finalPrice += finalPrice * (discount / 100)
        res.status(200).json({ finalPrice, discount, subPrice, data: transaction.recordset })
    } catch (error) {
        res.status(500).send(error)
        console.log(error);
    }

})
export const getSales = asyncHandler(async (req, res) => {
    const { cId, bId, from, to } = req.params
    const request = new sql.Request();
    request.input("dateFrom", sql.DateTime2, dateOnly(from, "start"));
    request.input("dateTo", sql.DateTime2, dateOnly(to, "end"));

    const query = isID(bId)
        ? request.input("branchId", sql.Int, bId)
            .query(`SELECT ReferenceNumber,CreatedAt,TransactionStatus,SUM(PurchasePrice) as PurchasePrice, SUM(Price) as Price,SUM(Quantity) AS Quantity,BranchId FROM vw_TestSales 
                                     WHERE BranchId = @branchId 
                                     AND TransactionStatus = 'Success' 
                                     AND CreatedAt BETWEEN @dateFrom AND @dateTo
                                     GROUP BY ReferenceNumber,CreatedAt,TransactionStatus,BranchId`)
        : isID(cId)
            ? request.input("companyId", sql.Int, cId)
                .query(`SELECT ReferenceNumber,CreatedAt,TransactionStatus,SUM(PurchasePrice) as PurchasePrice,SUM(Price) as Price,SUM(Quantity) AS Quantity,CompanyId FROM vw_TestSales 
                                     WHERE CompanyId = @companyId 
                                     AND TransactionStatus = 'Success' 
                                     AND CreatedAt BETWEEN @dateFrom AND @dateTo
                                     GROUP BY ReferenceNumber,CreatedAt,TransactionStatus,CompanyId`)

            : request.query(`SELECT ReferenceNumber,CreatedAt,TransactionStatus,SUM(PurchasePrice) as PurchasePrice,SUM(Price) as Price,SUM(Quantity) AS Quantity FROM vw_TestSales 
                                     WHERE TransactionStatus = 'Success' 
                                     AND CreatedAt BETWEEN @dateFrom AND @dateTo
                                     GROUP BY ReferenceNumber,CreatedAt,TransactionStatus`)
    try {
        const sales = await query
        res.status(200).json(sales.recordset)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})
export const getMonthlySales = asyncHandler(async (req, res) => {
    const { cId, bId } = req.params
    const request = new sql.Request();
    if (cId === "null" && bId === "null") {
        res.status(404).send("Not found")
        return
    } else {
        const query = isID(bId) ? request.input("branchId", sql.Int, bId).query(`SELECT * FROM [dbo].[Fn_ChartMonthlySales](@branchId)`) : isID(cId) ? request.input("companyId", sql.Int, cId).query(`SELECT * FROM [dbo].[Fn_ChartMonthlySales](@companyId)`)
            : request.input("companyId", sql.Int, cId).query(`SELECT * FROM [dbo].[Fn_ChartMonthlySalesCompany](@companyId)`)

        try {
            const sales = await query
            res.status(200).json(sales.recordset)
        } catch (error) {
            console.log(error)
            res.status(500).send(error)
        }
    }

})
export const getStoreActivityDashboard = asyncHandler(async (req, res) => {
    const { cId, bId, from, to } = req.params
    const request = new sql.Request();
    request.input("dateFrom", sql.Date, from);
    request.input("dateTo", sql.Date, to);
    /* Not Tested Yet */
    try {
        if (isID(bId)) {
            request.input("branchId", sql.Int, bId)
            const Purchases = await request.query(`SELECT COUNT(TransactionId) as Purchases FROM [dbo].[Fn_PurchaseDateRange](@branchId,DATEADD(DAY,-1,@dateFrom),DATEADD(DAY,1,@dateTo))`)
            const ActivePromo = await request.query(`SELECT COUNT(PromoId) as ActivePromo FROM [dbo].[Fn_PromoDateRange](@branchId,@dateFrom,@dateTo)`)
            const CartIssue = await request.query(`SELECT COUNT(PushCartDiscrepancyId) as CartIssues FROM [dbo].[Fn_PushCartDiscrepancyDateRange](@branchId,@dateFrom,@dateTo)`)
            const Customer = await request.query(`SELECT COUNT(TransactionId) as Customer FROM [dbo].[Fn_CustomersDateRange](@branchId,@dateFrom,@dateTo)`)
            const NewProducts = await request.query(`SELECT TOP 6 ProductId,Name, Price FROM vw_Products WHERE branchId = @branchId`)
            res.status(200).json({
                Purchases: Purchases.recordset[0].Purchases,
                ActivePromo: ActivePromo.recordset[0].ActivePromo,
                CartIssue: CartIssue.recordset[0].CartIssues,
                Customer: Customer.recordset[0].Customer,
                NewProducts: NewProducts.recordset
            })
        } else if (isID(cId)) {
            request.input("companyId", sql.Int, cId)
            const Purchases = await request.query(`SELECT COUNT(TransactionId) as Purchases FROM [dbo].[Fn_PurchaseDateRangeCompany](@companyId,@dateFrom,@dateTo)`)
            const ActivePromo = await request.query(`SELECT COUNT(PromoId) as ActivePromo FROM [dbo].[Fn_PromoDateRangeCompany](@companyId,@dateFrom,@dateTo)`)
            const CartIssue = await request.query(`SELECT COUNT(PushCartDiscrepancyId) as CartIssues FROM [dbo].[Fn_PushCartDiscrepancyDateRangeCompany](@companyId,@dateFrom,@dateTo)`)
            const Customer = await request.query(`SELECT COUNT(TransactionId) as Customer FROM [dbo].[Fn_CustomersDateRangeCompany](@companyId,@dateFrom,@dateTo)`)
            const NewProducts = await request.query(`SELECT TOP 6 ProductId, Name, Price FROM vw_Products WHERE companyId = @companyId`)
            res.status(200).json({
                Purchases: Purchases.recordset[0].Purchases,
                ActivePromo: ActivePromo.recordset[0].ActivePromo,
                CartIssue: CartIssue.recordset[0].CartIssues,
                Customer: Customer.recordset[0].Customer,
                NewProducts: NewProducts.recordset
            })
        } else {
            throw new Error("Not found")
        }

    }
    catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})
export const getDashboardData = asyncHandler(async (req, res) => {
    const { cId, bId, from, to } = req.params
    const request = new sql.Request();
    request.input("dateFrom", sql.Date, from);
    request.input("dateTo", sql.Date, to);

    isID(bId) ? request.input("branchId", sql.Int, bId) :
        isID(cId) && request.input("companyId", sql.Int, cId)


    const query = request
        .query(`SELECT SUM(Quantity) as Quantity, SUM(Price) as Price, SUM(PurchasePrice) as PurchasePrice FROM [dbo].[Fn_SalesPerProduct](@dateFrom,@dateTo) ${isID(bId) ? `WHERE BranchId = @branchId` : isID(cId) ? `WHERE CompanyId = @companyId` : ''}
                SELECT TOP 5 ProductId,Name,BranchId,CompanyId,SUM(ISNULL(Quantity, 0)) as TotalSale,Price FROM [dbo].[Fn_SalesPerProduct](@dateFrom, @dateTo) ${isID(bId) ? `WHERE BranchId = @branchId` : isID(cId) ? `WHERE CompanyId = @companyId` : ''} GROUP BY ProductId, Name, BranchId, CompanyId, Price ORDER BY TotalSale ASC
                SELECT TOP 5 ProductId, Name, BranchId, CompanyId, SUM(ISNULL(Quantity, 0)) as TotalSale, Price FROM [dbo].[Fn_SalesPerProduct](@dateFrom, @dateTo) ${isID(bId) ? `WHERE BranchId = @branchId` : isID(cId) ? `WHERE CompanyId = @companyId` : ''} GROUP BY ProductId,Name,BranchId,CompanyId,Price ORDER BY TotalSale DESC
                `)
    try {
        if (cId === "null" && bId === "null") {
            throw new Error("Not found")
        }
        const queryRes: any = await query;
        const queryData = {
            salesOverview: queryRes.recordsets[0][0],
            leastSelling: queryRes.recordsets[1],
            topSelling: queryRes.recordsets[2],
        }
        console.log(queryData)
        console.log(`SELECT SUM(Quantity) as Quantity, SUM(Price) as Price, SUM(PurchasePrice) as PurchasePrice FROM [dbo].[Fn_SalesPerProduct](@dateFrom,@dateTo) ${isID(bId) ? `WHERE BranchId = @branchId` : isID(cId) ? `WHERE CompanyId = @companyId` : ''}`)
        res.status(200).json(queryData)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})


export const getProductSales = asyncHandler(async (req, res) => {
    const request = new sql.Request()
    const { cId, bId, from, to, pId } = req.query

    console.log(req.query)

    const branchOnly = /^[0-9]+$/.test(bId?.toString() || "")

    const allBranchQuery = `
        SELECT BranchName, UpdatedAt, Quantity, Price, ReferenceNumber, UserClientId
        FROM vw_TransactionReference
        WHERE CompanyId = ${cId} AND ProductId = ${pId} AND UpdatedAt BETWEEN '${from}' AND '${to}'
        ORDER BY UpdatedAt DESC
    `

    const branchQuery = `
        SELECT BranchName, UpdatedAt, Quantity, Price, ReferenceNumber, UserClientId
        FROM vw_TransactionReference
        WHERE CompanyId = ${cId} AND BranchId = ${bId} AND ProductId = ${pId} AND UpdatedAt BETWEEN '${from}' AND '${to}'
        ORDER BY UpdatedAt DESC
    `

    const query = sql.query(branchOnly ? branchQuery : allBranchQuery)
    try {
        const data = await query
        res.status(200).json(data.recordset)
    }
    catch(error: any) {
        console.log(error.message);
        res.status(500).send(error)
    }
    
})









