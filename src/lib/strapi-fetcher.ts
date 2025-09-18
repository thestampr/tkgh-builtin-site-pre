type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface StrapiResponse<T> {
  data: T;
  meta?: unknown;
}

async function strapiFetcher<T = any>(
  endpoint: string,
  method: HTTPMethod = "GET",
  params?: Record<string, string>,
  body?: any
): Promise<T> {
  const { STRAPI_URL, STRAPI_TOKEN } = process.env;

  if (!STRAPI_URL || !STRAPI_TOKEN) {
    throw new Error("STRAPI_URL or STRAPI_TOKEN is missing");
  }

  // Construct the URL
  const url = new URL(`${STRAPI_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Set up headers
  const headers: HeadersInit = {
    Authorization: `Bearer ${STRAPI_TOKEN}`,
    "Content-Type": "application/json",
  };

  // Set up options for the request
  const options: RequestInit = {
    method,
    headers,
  };

  // Add body if applicable for POST, PUT, PATCH, and DELETE methods
  if (body && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    options.body = JSON.stringify(body);
  }

  // Perform the fetch request
  const res = await fetch(url.toString(), options);

  if (!res.ok) {
    const errorMessage = `Failed to fetch from Strapi: ${res.status} ${res.statusText}`;
    const errorBody = await res.text();
    throw new Error(`${errorMessage}\n${errorBody}`);
  }

  // Parse the response and return only the `data` field
  const jsonResponse: StrapiResponse<T> = await res.json();
  return jsonResponse.data;
}

export default strapiFetcher;