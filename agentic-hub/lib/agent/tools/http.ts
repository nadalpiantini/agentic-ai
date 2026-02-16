import { z } from "zod";

/**
 * HTTP Tool - External API calls
 *
 * Provides tools for:
 * - GET requests (fetch data)
 * - POST requests (create data)
 * - PUT/PATCH requests (update data)
 * - DELETE requests (remove data)
 */

/**
 * Make HTTP GET request
 */
export async function httpGet(args: { url: string; headers?: Record<string, string> }) {
  const { url, headers = {} } = args;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    const data = await response.json();

    return {
      url,
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    throw new Error(`HTTP GET failed: ${(error as Error).message}`);
  }
}

/**
 * Make HTTP POST request
 */
export async function httpPost(args: {
  url: string;
  body?: any;
  headers?: Record<string, string>;
}) {
  const { url, body, headers = {} } = args;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      url,
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    throw new Error(`HTTP POST failed: ${(error as Error).message}`);
  }
}

/**
 * Make HTTP PUT request
 */
export async function httpPut(args: {
  url: string;
  body?: any;
  headers?: Record<string, string>;
}) {
  const { url, body, headers = {} } = args;

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return {
      url,
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    throw new Error(`HTTP PUT failed: ${(error as Error).message}`);
  }
}

/**
 * Make HTTP DELETE request
 */
export async function httpDelete(args: { url: string; headers?: Record<string, string> }) {
  const { url, headers = {} } = args;

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    const data = response.status !== 204 ? await response.json() : null;

    return {
      url,
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    throw new Error(`HTTP DELETE failed: ${(error as Error).message}`);
  }
}

// Tool schemas for LangChain integration
export const httpTools = [
  {
    name: "http_get",
    description: "Make an HTTP GET request to fetch data from a URL",
    schema: z.object({
      url: z.string().url(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
    handler: httpGet,
  },
  {
    name: "http_post",
    description: "Make an HTTP POST request to create data at a URL",
    schema: z.object({
      url: z.string().url(),
      body: z.unknown().optional(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
    handler: httpPost,
  },
  {
    name: "http_put",
    description: "Make an HTTP PUT request to update data at a URL",
    schema: z.object({
      url: z.string().url(),
      body: z.unknown().optional(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
    handler: httpPut,
  },
  {
    name: "http_delete",
    description: "Make an HTTP DELETE request to remove data at a URL",
    schema: z.object({
      url: z.string().url(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
    handler: httpDelete,
  },
];
