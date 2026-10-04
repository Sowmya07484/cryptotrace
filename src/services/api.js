const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

/**
 * Investigate a wallet using the real FastAPI backend.
 *
 * Sends:
 * {
 *   wallet_address: "...",
 *   max_hops: 2
 * }
 */
export async function investigateWallet(
  walletAddress,
  maxHops = 2
) {
  const response = await fetch(
    `${API_BASE_URL}/investigate`,
    {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        wallet_address: walletAddress,
        max_hops: maxHops,
      }),
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Investigation failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export { API_BASE_URL };