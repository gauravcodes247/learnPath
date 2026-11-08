import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to LearnPath API",
  });
});

app.use("/api", routes);

export default app;
