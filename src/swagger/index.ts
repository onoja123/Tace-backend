import { Express, Request, Response } from "express";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
// import { version } from "../../package.json";

const options: swaggerJSDoc.Options = {
  //add servers array

  definition: {
    openapi: "3.0.0",
    servers: [
      {
        url: "https://www.staging-api.cargodealerinc.com/",
        description: "Staging server",
      },
      {
        url: "http://localhost:6789",
        description: "Local server",
      },
      {
        url: "https://www.api.cargodealerinc.com/",
        description: "Production server",
      },
    ],
    info: {
      title: "API Documentation",
      version: "1.0.0",
    },
    basePath: "/api/v1/",
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/server.ts"],
};

const specs = swaggerJSDoc(options);

export default (app: Express, port: string | number) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

  app.get("/api-docs.json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  console.log(`Swagger UI is available at http://localhost:${port}/api-docs`);
};
