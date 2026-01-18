# Agent & Partner Dashboard

Separate frontend for Partner + Agent (customer site stays separate).

## Setup

```bash
cd Agent-Partner-Dashboard
npm install
npm run dev
```

Note: your backend CORS allowlist includes `http://localhost:5173`, so this dashboard runs on port `5173` by default.

If you prefer pnpm:

```bash
pnpm install
pnpm dev
```

## Env

Copy `.env.example` to `.env` and fill values:

- `VITE_GOOGLE_MAPS_API_KEY` (optional but enables map)
- `VITE_API_URL` (later wire to your existing Node backend)
- `VITE_PARTNER_LAT`, `VITE_PARTNER_LNG` (for 5km radius filtering)

## Roles

Use the Login screen to choose role:
- Partner: desktop-optimized dashboard
- Agent: mobile-first field dashboard (real backend)

## Agent backend wiring

- Agent login: `/agent/login` (calls `POST /auth/login` with `userType: "agent"`)
- Nearby orders: `GET /agent/nearby-orders`
- My pickups: `GET /agent/my-pickups`
- Start pickup: `PATCH /orders/:id/assign`
- Complete pickup: `PATCH /orders/:id/complete`
- Cancel pickup: `PATCH /orders/:id/cancel`

Token is stored in `localStorage` under key `token` to match your existing backend auth middleware.
