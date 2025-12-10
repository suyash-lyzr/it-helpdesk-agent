# Demo Mode Setup - Complete

This document explains the demo mode implementation for the `suyash@lyzr.ai` account.

## What Was Implemented

### 1. Demo Account Detection

- **File**: `src/lib/demo-utils.ts`
- **Functions**:
  - `isDemoAccount(email)`: Checks if an email is a demo account
  - `shouldShowPremiumLock(email)`: Returns whether to show premium locks (false for demo accounts)
- **Demo account**: `suyash@lyzr.ai`

### 2. Premium Features Unlocked

All premium features are now accessible for demo accounts without any locks or upsell modals:

#### Components Updated:

- ✅ **Forecast Chart** (`src/components/admin/forecast-chart.tsx`)
  - No premium overlay
  - All forecast features accessible
- ✅ **Report Builder** (`src/components/admin/report-builder.tsx`)
  - Full report generation capabilities
  - Scheduling enabled
- ✅ **Alert Rules** (`src/components/admin/alert-rules.tsx`)
  - Complete alert configuration
  - All automation features available
- ✅ **Knowledge Base** (`src/app/knowledge-base/page.tsx`)
  - Premium badge hidden
  - AI-powered features accessible
- ✅ **Admin Dashboard** (`src/components/admin-tickets-dashboard.tsx`)
  - All analytics unlocked
  - No feature restrictions

### 3. Demo Data Seeding

#### Seed Function

- **File**: `src/lib/seed-demo-data.ts`
- **Features**:
  - Generates 20 diverse, realistic tickets
  - Mix of incidents, access requests, and service requests
  - Various priorities (low, medium, high)
  - Different statuses (open, in_progress, resolved, closed)
  - Multiple teams (Network, Endpoint Support, Application Support, IAM, Security, DevOps)
  - Realistic timestamps (last 7 days)
  - Some tickets include CSAT scores
  - Detailed descriptions and collected_details

#### API Endpoint

- **Endpoint**: `/api/admin/seed-demo-data`
- **Methods**:
  - `GET`: Check if demo data exists
  - `POST`: Seed demo tickets (demo accounts only)
- **Security**: Only demo accounts can seed data

#### UI Integration

- **Location**: Tickets page (`src/app/tickets/page.tsx`)
- **Feature**: "Seed Demo Data" button
- **Visibility**: Only shows for demo accounts when no tickets exist
- **Behavior**: One-click seeding of 20 demo tickets

## How to Use Demo Mode

### For Demo Account (suyash@lyzr.ai)

1. **Login**: Sign in with `suyash@lyzr.ai`

2. **Seed Demo Data**:

   - Navigate to the Tickets page
   - If you have no tickets, you'll see a "Seed Demo Data" button
   - Click it to generate 20 realistic demo tickets
   - The button will show a loading state while seeding
   - You'll get a success toast when complete

3. **Explore Features**:

   - All premium features are unlocked
   - No "Premium" badges or upsell modals
   - Full access to:
     - Advanced analytics and forecasting
     - Report builder and scheduling
     - Alert rules and automation
     - Knowledge base AI features
     - All admin dashboard features

4. **Demo Tickets Include**:
   - **Incidents**: VPN issues, email problems, server outages, security alerts
   - **Access Requests**: Salesforce access, shared drive permissions, MFA resets
   - **Service Requests**: New laptop setups, software installations, AV support
   - **Various Statuses**: Open tickets needing attention, in-progress items, resolved tickets with CSAT
   - **Multiple Teams**: Distributed across Network, Security, IAM, Application Support, etc.

### For Regular Accounts

- Standard behavior remains unchanged
- Premium features show locks and upsell modals
- Demo data seeding is not available (403 error if attempted)

## Technical Details

### Demo Detection Flow

```typescript
// 1. User logs in and email is stored in AuthProvider
const { email } = useAuth();

// 2. Check if demo account
const isDemo = isDemoAccount(email); // true for suyash@lyzr.ai

// 3. Determine if premium locks should show
const showPremiumLock = shouldShowPremiumLock(email); // false for demo accounts

// 4. Pass to components
<ForecastChart demoMode={showPremiumLock} />; // demoMode=false for demo accounts
```

### Ticket Creation Details

Each demo ticket includes:

- Unique ID (auto-generated)
- Realistic title and description
- User name (various fictional employees)
- App/system affected
- Priority level
- Status (open, in_progress, resolved, closed)
- Suggested team assignment
- Collected details (JSON object with extra info)
- Timestamps (created_at, resolved_at for resolved tickets)
- CSAT scores for some resolved tickets
- First response times for in-progress/resolved tickets

### Data Persistence

- Demo tickets are stored in MongoDB like regular tickets
- Associated with the demo account's lyzrUserId
- Persist across sessions
- Can be viewed, updated, and deleted like normal tickets
- Analytics automatically compute from these tickets

## Files Modified

### New Files Created:

1. `src/lib/demo-utils.ts` - Demo account utilities
2. `src/lib/seed-demo-data.ts` - Demo ticket generation
3. `src/app/api/admin/seed-demo-data/route.ts` - API endpoint
4. `DEMO_MODE_SETUP.md` - This documentation

### Files Modified:

1. `src/components/admin-tickets-dashboard.tsx` - Added demo mode support
2. `src/components/admin/forecast-chart.tsx` - Receives demoMode prop
3. `src/components/admin/report-builder.tsx` - Receives demoMode prop
4. `src/components/admin/alert-rules.tsx` - Receives demoMode prop
5. `src/app/knowledge-base/page.tsx` - Hides premium upsell
6. `src/app/tickets/page.tsx` - Added seed button

## Testing Checklist

- ✅ Demo account (`suyash@lyzr.ai`) logs in successfully
- ✅ No premium locks visible in admin dashboard
- ✅ Forecast chart fully accessible
- ✅ Report builder available without restrictions
- ✅ Alert rules configuration unlocked
- ✅ Knowledge base premium badge hidden
- ✅ "Seed Demo Data" button appears when no tickets exist
- ✅ Clicking seed button creates 20 diverse tickets
- ✅ Tickets display correctly in tickets table
- ✅ Analytics compute correctly from demo tickets
- ✅ Regular accounts still see premium locks
- ✅ Non-demo accounts cannot access seed endpoint

## Video Recording Tips

When recording demo videos with `suyash@lyzr.ai`:

1. **Start Fresh**: Clear tickets if needed to show seeding process
2. **Show Variety**: Demo tickets cover many scenarios
3. **Explore Analytics**: Rich data for dashboard demonstrations
4. **No Distractions**: No premium upsells interrupt the flow
5. **Realistic Data**: Tickets look like real support scenarios

## Support

If you need to:

- Add more demo accounts: Update the `DEMO_ACCOUNTS` array in `demo-utils.ts`
- Modify demo tickets: Edit the `demoTickets` array in `seed-demo-data.ts`
- Adjust ticket quantity: Change the loop in `seedDemoTickets` function
- Clear demo data: Delete tickets manually or add a clear endpoint

## Security Notes

- Demo mode is email-based (simple implementation)
- API endpoint validates demo account status
- Regular accounts cannot seed data (403 Forbidden)
- Demo tickets are user-scoped (lyzrUserId)
- No special database setup required
