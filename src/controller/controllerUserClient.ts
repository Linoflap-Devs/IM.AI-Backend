import asyncHandler from "express-async-handler";
import sql from "mssql";
import { generatePassword, isID } from "../util/helper";

/* 
    @desc One time User Account
    @route POST /UserAdmin/login/
    @access Private 
*/
export const registerOneTimeUser = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { email } = req.body;

    request.input("email", sql.VarChar, email);
    request.input("defaultPassword", sql.VarChar, generatePassword());

    try {
        const user = await request.query(`INSERT 
                                INTO UserClient (Email, FirstName,LastName,Password,isOneTimeUser) 
                                VALUES (@email,'Guest',1232,@defaultPassword,1)`);
        if (user.rowsAffected[0] == 1) {
            res.status(200).json({
                Email: email,
                Password: generatePassword(),
            });
            console.log("Registered");
        } else {
            console.log("Error Registered OTU");
            throw new Error("Theres an error Doing the Query");
        }
    } catch (e: any) {
        const errMsg = e.originalError.info.message;
        const errorType = () => {
            if (errMsg.includes("Violation of UNIQUE KEY constraint")) {
                return "Duplicate Record";
            }
        };
        res.status(500).send(errorType());
    }
});

export const getUserClient = asyncHandler(async (req, res) => {
    const request = new sql.Request();

    const { bId, cId } = req.params;

    const query = isID(bId)
        ? request.input("branchId", sql.Int, bId).query(`SELECT 
                        DISTINCT UserClientId,FirstName+' '+LastName as UserClient ,Email,BranchId,CreatedAt,ContactNumber 
                        FROM vw_UserClient 
                        WHERE BranchId = @branchId  
                        ORDER BY CreatedAt DESC`)
        : isID(cId)
        ? request.input("companyId", sql.Int, cId).query(`SELECT 
                        DISTINCT UserClientId,FirstName+' '+LastName as UserClient ,Email,CompanyId,CreatedAt,ContactNumber 
                        FROM dbo.vw_UserClient 
                        WHERE CompanyId = @companyId 
                            
                        ORDER BY CreatedAt DESC`)
        : request.query(`SELECT 
                        DISTINCT UserClientId,FirstName+' '+LastName as UserClient ,Email,CreatedAt,ContactNumber 
                        FROM vw_UserClient 
                        ORDER BY CreatedAt DESC`);

    try {
        const userClient = await query;
        res.status(200).json(userClient.recordset);
    } catch (error) {
        res.status(500).send(error);
    }
});

export const loginQr = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { key, userId } = req.body;

    const query = request
        .input("key", sql.VarChar, key)
        .query(`UPDATE UserClient SET UniqueID = @key WHERE UserClientId = 1`);

    try {
        const result = await query;
        res.status(200).json(result);
    } catch (error) {
        res.status(500).send(error);
    }
});
