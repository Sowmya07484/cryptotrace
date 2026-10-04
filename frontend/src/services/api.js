const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function investigateWallet(walletAddress) {
  const response = await fetch(
    `${API_BASE_URL}/investigate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `Request failed: ${response.status}`
    );
  }

  return response.json();
}