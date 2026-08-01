// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE_URL ||
//   "http://localhost:5000/api/v1";

// export async function api(
//   url: string,
//   options: RequestInit = {}
// ) {
//   const response = await fetch(`${API_BASE}${url}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...(options.headers || {}),
//     },
//   });

//   const json = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     throw json;
//   }

//   return json;
// }
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000/api/v1";

export async function api(
  url: string,
  options: RequestInit = {}
) {

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  console.log("REQUEST:", url);
  console.log("STATUS:", response.status);

  const json = await response.json();

  console.log("RESPONSE:", json);

  if (!response.ok) {
    throw json;
  }

  return json;
}