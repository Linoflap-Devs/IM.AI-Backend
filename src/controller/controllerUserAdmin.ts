import asyncHandler from "express-async-handler";
import sql from "mssql";
import jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import { bgRed } from "colors/safe";
import bcrypt from "bcryptjs";

/* 
    @desc Login Admin Account
    @route GET /UserAdmin/login/
    @access Public 
*/
export const logIn = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        const user =
            await sql.query`SELECT UserAdminId, Password, Email, Permission,FirstName,LastName,BranchId,CompanyId FROM UserAdmin WHERE Email = ${email}`;
        if (!user.recordset || user.recordset.length === 0) {
            throw new Error("User not found");
        }
        const {
            Password,
            Email,
            UserAdminId,
            Permission,
            FirstName,
            LastName,
            BranchId,
            CompanyId,
        } = user.recordset[0];

        if (user && (await bcrypt.compare(password, Password))) {
            const token = await generateToken({
                id: UserAdminId,
                email: Email,
            });
            res.json({
                firstname: FirstName,
                lastname: LastName,
                email: Email,
                id: UserAdminId,
                jwt: token,
                role: Permission,
                branchId: BranchId,
                companyId: CompanyId,
            });
        } else {
            if (!(await bcrypt.compare(password, Password))) {
                throw new Error("Wrong Password");
            }
            throw new Error("Invalid Credentials");
        }
    } catch (error) {
        console.log(bgRed(error as string));
        res.status(500).send(error);
    }
});
/* 
    @desc Register Admin Account
    @route Post /UserAdmin/register/
    @access Public 
*/
export const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, permission } = req.body;

    try {
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(password, salt);
        const queryRes =
            await sql.query`INSERT INTO UserAdmin (Email,Password,FirstName,LastName,Permission) 
        VALUES (${email},${hash},${firstName},${lastName},${permission})`;
        /* console.log(queryRes); */

        if (queryRes.rowsAffected[0] == 1) {
            res.status(200).json({
                Succesfully_Registered: {
                    firstName: firstName,
                    lastName: lastName,
                },
            });
        } else {
            throw new Error("Theres an error Doing the Query");
        }
    } catch (e: any) {
        const errMsg = e.originalError.info.message;
        const errorType = () => {
            if (errMsg.includes("Violation of UNIQUE KEY constraint")) {
                return "Duplicate Record";
            } else {
                return "Unknown Error";
            }
        };
        res.status(500).send(errorType());
    }
});
/* 
    @desc Get UserAdmin Profile
    @route GET /api/users/
    @access Private 
*/

/* Test Routes */
export const protectedRoute = asyncHandler((req, res) => {
    try {
        res.send({ message: "this route is protected" });
    } catch (error) {
        res.send({ message: "You dont have acces to this route" });
    }
});

/* Not Routes */
const DEFAULT_JWT_OPTIONS: SignOptions = {
    expiresIn: "30d",
};
const generateToken = async (
    payload: JwtPayload,
    option: SignOptions = DEFAULT_JWT_OPTIONS
) => {
    return jwt.sign(payload, process.env.JWT_SECRET as string, option);
};
