import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api", routes);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to LearnPath API",
  });
});

export default app;
