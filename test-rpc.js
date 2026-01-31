// Quick RPC test script
// Run with: node test-rpc.js

const { Connection } = require("@solana/web3.js");

async function testRPC() {
  // Using the RPC from your .env file
  const rpcUrl = "https://solana-devnet.g.alchemy.com/v2/oIR6ATbMj-qf0E7QxDyWh";
  console.log("Testing RPC endpoint:", rpcUrl);
  console.log("");

  try {
    const connection = new Connection(rpcUrl, "confirmed");

    // Test 1: Get version
    console.log("Test 1: Getting version...");
    const version = await connection.getVersion();
    console.log("✓ Version:", version);
    console.log("");

    // Test 2: Get recent blockhash
    console.log("Test 2: Getting recent blockhash...");
    const start = Date.now();
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const elapsed = Date.now() - start;
    console.log("✓ Blockhash:", blockhash);
    console.log("✓ Latency:", elapsed, "ms");
    console.log("");

    // Test 3: Get slot
    console.log("Test 3: Getting current slot...");
    const slot = await connection.getSlot();
    console.log("✓ Current slot:", slot);
    console.log("");

    console.log("✅ RPC endpoint is working correctly!");
    console.log("");

    if (elapsed > 1000) {
      console.log("⚠️  Warning: High latency detected (", elapsed, "ms)");
      console.log("   Consider using a faster RPC endpoint for better performance.");
    }
  } catch (error) {
    console.error("❌ RPC test failed:");
    console.error(error.message);
    console.log("");
    console.log("Possible issues:");
    console.log("1. Invalid API key in .env file");
    console.log("2. Network connectivity issues");
    console.log("3. RPC endpoint is down or rate-limited");
    console.log("");
    console.log("Solutions:");
    console.log("- Verify your NEXT_PUBLIC_SOLANA_RPC_ENDPOINT in .env");
    console.log("- Get a new API key from: https://www.alchemy.com/");
    console.log("- Try Helius: https://www.helius.dev/ (100k free requests/day)");
  }
}

testRPC();
