import asyncHandler from "express-async-handler";
import sql from "mssql";
import { isID } from "../util/helper";

export const getBranches = asyncHandler(async (req, res) => {
    const request = new sql.Request();

    const { cId } = req.params;
    const companyId = cId;

    const query = isID(companyId)
        ? request.input("companyId", sql.Int, companyId).query(`SELECT * 
                        FROM Branch 
                        WHERE CompanyId = @companyId 
                        AND IsDeleted = 0`)
        : request.query(`SELECT * 
                        FROM Branch 
                        WHERE IsDeleted = 0`);
    try {
        const branches = await query;
        console;
        res.status(200).json(branches.recordset);
    } catch (error) {
        console.log(error);
    }
});

export const getBranchesOption = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { cId } = req.params;
    const query = isID(cId)
        ? request.input('companyId', sql.Int, cId)
                .query(`SELECT BranchId as value , Name as label 
                        FROM Branch 
                        WHERE CompanyId = @companyId 
                        AND IsDeleted = 0`)
        : request.query(`SELECT BranchId as value , Name as label 
                        FROM Branch 
                        WHERE IsDeleted = 0`); ;
    try {
        const branches = await query;
        res.status(200).json(branches.recordset);
    } catch (error) {
        console.log(error);
    }
});

export const addBranches = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { name, companyId, address, contact, contactPerson, imgLink, tinNumber } =
        req.body;

    request.input("name", sql.VarChar, name);
    request.input("companyId", sql.Int, companyId);
    request.input("address", sql.VarChar, address);
    request.input("contact", sql.VarChar, contact);
    request.input("contactPerson", sql.VarChar, contactPerson);
    request.input("imgLink", sql.VarChar, imgLink);
    request.input("tinNumber", sql.VarChar, tinNumber);

    const query = 
            request.query(`INSERT 
                            INTO Branch (Name, CompanyId, Address, Contact, ContactPerson, ImgLink, TIN) 
                            VALUES (@name,@companyId,@address,@contact,@contactPerson,@imgLink,@tinNumber)`);
    try {
        const branch = await query;
        res.status(200).json(branch);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});
/* Not Tested Yet */
export const editBranch = asyncHandler(async (req, res) => {
    const request = new sql.Request();
    const { name, companyId, address, contact, contactPerson, imgLink, id, tinNumber } =
        req.body;
    request.input("name", sql.VarChar, name);
    request.input("companyId", sql.Int, companyId);
    request.input("address", sql.VarChar, address);
    request.input("contact", sql.VarChar, contact);
    request.input("contactPerson", sql.VarChar, contactPerson);
    request.input("imgLink", sql.VarChar, imgLink);
    request.input("id", sql.Int, id);
    request.input("tinNumber", sql.VarChar, tinNumber);

    const query = 
            request.query(`UPDATE Branch 
                            SET 
                            Name = @name,
                                CompanyId = @companyId,
                                Address = @address,
                                Contact = @contact,
                                ContactPerson = @contactPerson,
                                ImgLink = @imgLink,
                                TIN = @tinNumber 
                            WHERE BranchId = @id`);
    try {
        const branch = await query;
        res.status(200).json(branch);
    } catch (e) {
        res.status(500).send(e);
    }
});

export const deleteBranch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    const query = sql.query`UPDATE Branch SET IsDeleted = 1 WHERE BranchId = ${id}`;
    try {
        const branch = await query;
        res.status(200).json(branch);
    } catch (e) {
        res.status(500).send(e);
    }
});
