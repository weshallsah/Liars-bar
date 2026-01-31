# Fixing the 403 RPC Error

## Problem
You're getting `403 Forbidden` errors from Solana's public RPC endpoint because it has strict rate limits.

## Solution
Use a custom RPC endpoint from a free provider.

## Quick Setup (5 minutes)

### Option 1: Helius (Recommended - 100k requests/day free)

1. Go to https://www.helius.dev/
2. Sign up for a free account
3. Create a new project
4. Select **Devnet** as the network
5. Copy your RPC URL (looks like: `https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY`)
6. Update your `.env.local` file:

```bash
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
NEXT_PUBLIC_SOLANA_WS_ENDPOINT=wss://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

### Option 2: QuickNode

1. Go to https://www.quicknode.com/
2. Sign up and create a Solana Devnet endpoint
3. Copy your HTTP and WSS URLs
4. Update `.env.local` with your endpoints

### Option 3: Alchemy

1. Go to https://www.alchemy.com/
2. Create a new app with Solana Devnet
3. Copy your RPC endpoints
4. Update `.env.local` with your endpoints

## After Setup

1. **Restart your dev server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Clear your browser cache** or open in incognito mode

3. **Test the connection**: Try creating a table again

## Verify It's Working

Check your browser console - you should no longer see 403 errors. Instead, you'll see successful API calls.

## Free Tier Limits

- **Helius**: 100,000 requests/day
- **QuickNode**: 10M credits/month (~100k requests)
- **Alchemy**: 300M compute units/month

All three are more than enough for development!
