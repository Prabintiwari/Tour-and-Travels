import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

export const registerRoute = (config: {
  method: "get" | "post" | "patch" | "put" | "delete";
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  request?: any;
  responses: any;
}) => {
  registry.registerPath(config);
};
