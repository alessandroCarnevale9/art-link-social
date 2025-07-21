async function apiFetch(
  path,
  { method = "GET", body, params, headers = {} } = {}
) {
  let url = path;
  if (params) url += "?" + new URLSearchParams(params);

  // Prendo token da localStorage
  const raw = localStorage.getItem("jwt");
  let token;
  try {
    token = JSON.parse(raw)?.accessToken;
  } catch {}

  console.log(`CALLED ${url}`);
  

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(payload?.message || res.statusText);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}
export default apiFetch;
