import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { bgRed } from "colors/safe";
import sql from "mssql";

interface JwtPayload {
    email: string;
    id: number;
    iat: number;
    exp: number;
}

const protect = asyncHandler(async (req, res, next) => {
    let token;
    /*     if(req.body){
            const { branchId, companyId,token } = req.body;
            console.log(
                branchId && branchId !== "all"
                    ? green(`Branch ${branchId}` )
                    : companyId
                    ? blue(`Company ${companyId}` )
                    : red(`All Branhch: ${branchId} Company: ${companyId}` )
            ); 
            console.log(token)
        } */
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            /* get tokenj */
            token = req.headers.authorization.split(" ")[1];
            /* verify token */
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            const decodedObject = decoded as JwtPayload;
            const { id, email } = decodedObject;
            /* Get user From the Token */
            const verify = await sql.query`SELECT UserAdminId, Password, Email FROM UserAdmin WHERE Email = ${email} AND UserAdminId = ${id}`;
            // req. = sql.query`SELECT UserAdminId, Password, Email FROM UserAdmin WHERE Email = ${"super@gmail.com"}`;
            next();
        } catch (error) {
            res.status(400).json(error);
            throw new Error(bgRed("Not Authorized"));
        }
    }
    if (!token) {
        res.status(401).json({ message: "Token Doesnt Match/ Not Authorized" });
    }
});
export default protect;
