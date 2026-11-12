import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LearnPath API",
      version: "1.0.0",
      description: "API documentation for LearnPath",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
