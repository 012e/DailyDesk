export function successJson(
  schema: any,
  options: { description?: string } = {},
) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description: options.description || "Successful response",
  };
}

export function defaultSecurityScheme() {
  return [{ "bearerAuth": [] }];
}

export function jsonBody(schema: any) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
  };
}
