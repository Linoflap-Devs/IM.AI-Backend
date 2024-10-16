import asyncHandler from "express-async-handler";
import sql from "mssql";
import { dateOnly } from "../util/helper";

export const getClientActivity = asyncHandler(async (req, res) => {
    const { from, to } = req.params;
    const request = new sql.Request();

    request.input("dateFrom", sql.Date, dateOnly(from, "start"));
    request.input("dateTo", sql.Date, dateOnly(to, "end"));

    const query = request.query(`SELECT UserLogID, 
                                    UserClientId, 
                                    Activity, 
                                    CreatedAt, 
                                    CONCAT(FirstName, ' ', LastName)as Costumer,
                                    Email 
                                FROM vw_ClientLog 
                                WHERE CreatedAt 
                                    BETWEEN @dateFrom 
                                    AND @dateTo
                                ORDER BY CreatedAt DESC`);
    try {
        const clientActivity = await query;
        res.status(200).json(clientActivity.recordset);
    } catch (error) {
        res.status(500).send(error);
        console.log(error);
    }
});
