import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./src/config/db";
import bodyParser from "body-parser";
import { bgBlue, bgGreen } from "colors/safe";
import morgan from "morgan";
import routesUserAdmin from "./src/routes/routesUserAdmin";
import routesPushCart from "./src/routes/routesPushCart";
import routesTransaction from "./src/routes/routesTransaction";
import routesUserClient from "./src/routes/routesUserClient";
import routesBranch from "./src/routes/routesBranch";
import routersClientActivity from "./src/routes/routesClientActivity";
import routesPromo from "./src/routes/routesPromo";
import routesSupplier from "./src/routes/routesSupplier";
import routesCompany from "./src/routes/routesCompany";
import routesProduct from "./src/routes/routesProducts";
import routesStocks from "./src/routes/routesStocks";
/* Imports */
const app = express();
const env = process.env;
connectDB();
/* Middlewares*/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
/* app.use(morgan("combined")); */
app.use(morgan("dev"));
/* Restrict acces to a specific url only */
app.use(helmet());

/* Routes */
app.use("/userAdmin", routesUserAdmin);
app.use("/transaction", routesTransaction);
app.use("/pushCart", routesPushCart);
app.use("/userClient", routesUserClient);
app.use("/branch", routesBranch);
app.use("/clientActivity", routersClientActivity);
app.use("/promo", routesPromo);
app.use("/supplier", routesSupplier);
app.use("/company", routesCompany);
app.use("/product", routesProduct);
app.use("/stocks", routesStocks);


console.log(bgGreen(`Listening to Port ${env.PORT}`));
console.log(bgBlue(`http://localhost:${env.PORT}`))
app.listen(env.PORT);
