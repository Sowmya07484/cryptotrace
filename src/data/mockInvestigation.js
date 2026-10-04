const mockInvestigation = {
  wallet: {
    address: "0x1234567890abcdef1234567890abcdef12345678",
    chain: "Ethereum",
    balance: "2.45 ETH",
  },

  risk: {
    score: 78,
    level: "HIGH",
  },

  verdict: {
    type: "ACTIONABLE",
    label: "Exchange identified",
  },

  hops: [
    {
      hop: 0,
      address: "0x123456...1234",
      label: "Victim Wallet",
      amount: "2.45 ETH",
    },
    {
      hop: 1,
      address: "0x567890...5678",
      label: "Intermediary",
      amount: "2.40 ETH",
    },
    {
      hop: 2,
      address: "0xabcdef...abcd",
      label: "Exchange",
      amount: "2.38 ETH",
    },
  ],

  reasons: [
    "Exchange address identified",
    "Rapid fund movement detected",
    "Fan-in / fan-out pattern detected",
  ],
};

export default mockInvestigation;