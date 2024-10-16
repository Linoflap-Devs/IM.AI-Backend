import asyncHandler from "express-async-handler";
import sql from "mssql";

export const getCompanyOptions = asyncHandler(async (req, res) => {
    const query = sql.query`SELECT CompanyId as value , Name as label FROM Company`;
    try {
        const company = await query;
        res.status(200).json(company.recordset);
    } catch (e) {
        res.status(500).send(e);
    }
});
