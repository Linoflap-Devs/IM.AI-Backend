import sql from "mssql";
import colors from "colors/safe";
const sqlConfig = {
    user: process.env.SQL_USER as any,
    password: process.env.SQL_PASSWORD as any,
    database: process.env.SQL_DATABASE as any,
    server: process.env.SQL_SERVER as any,
    pool: {
        max: 10 as any,
        min: 0 as any,
        idleTimeoutMillis: 30000 as any,
    },
    options: {
        encrypt: true as boolean, // for azure
        trustServerCertificate: true as boolean, // change to true for local dev / self-signed certs
    },
};
const sqlConfig2 = {
    user: process.env.SQL_USER_LOCAL as any,
    password: process.env.SQL_PASSWORD_LOCAL as any,
    database: process.env.SQL_DATABASE_LOCAL as any,
    server: process.env.SQL_SERVER_LOCAL as any,
    pool: {
        max: 10 as any,
        min: 0 as any,
        idleTimeoutMillis: 30000 as any,
    },
    options: {
        encrypt: false as boolean, // for azure
        trustServerCertificate: true as boolean, // change to true for local dev / self-signed certs
    },
};



export default async function connectDB(/* reconnectDB: any, */) {
    /* console.log(colors.bgWhite("Connecting to database..."))
    sql.connect(sqlConfig).then(() => {
        console.log(colors.bgGreen("Succesfully Connected to DB"));
        clearInterval(reconnectDB);
    }).catch((err) => {
        console.log(colors.bgMagenta(err.message))
        console.log(colors.bgRed("Connection to database failed, Retrying..."))
    }) */
    try {
        await sql.connect(sqlConfig);
        console.log(colors.bgCyan("Succesfully Connected to DB"));
    } catch (err) {
        console.log(err)
        try {
            await sql.connect(sqlConfig2);
            console.log(colors.bgMagenta("Succesfully Connected to LOCAL DB"));
        } catch (err2) {
            console.log(
                colors.bgRed("Connection to Local and Cloud DB Failed")
            );
            // console.error(err);
            console.error(err2);
        }
    }
}
