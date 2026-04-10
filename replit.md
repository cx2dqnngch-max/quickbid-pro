# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### QuickBid Pro (artifacts/quickbid-pro) - Expo Mobile App

A production-ready iPhone app for solo home-service business owners.

**Features:**
- 3-step onboarding (business name, contact info, preferences)
- Dashboard with quick action buttons and outstanding revenue display
- Customer management (full CRUD with searchable list)
- Estimate builder (line items, discount, deposit, notes, terms)
- Invoice builder (same as estimate + payment status)
- Convert estimate → invoice in one tap
- Mark invoice paid/unpaid
- Share as PDF via native share sheet
- History with filter tabs (all/estimates/invoices/paid/unpaid)
- Settings (business profile, document defaults, numbering prefixes)
- Freemium paywall with Pro subscription screen (RevenueCat TODO)

**Tech:**
- Expo Router (file-based navigation)
- AsyncStorage for local-first data persistence
- React Context (AppContext) for global state
- No backend required for v1
- Inter font, blue professional palette (#1a56db)

**Data Models:**
- `BusinessProfile` - stored in AsyncStorage
- `Customer` - CRUD with document history
- `Estimate` - with LineItems, discount, deposit
- `Invoice` - with payment status, paid date
- `AppSettings` - subscription status and usage counters

**Files:**
- `app/_layout.tsx` - Root layout with AppProvider, font loading, onboarding redirect
- `app/onboarding.tsx` - 3-step onboarding flow
- `app/(tabs)/index.tsx` - Home/Dashboard
- `app/(tabs)/customers.tsx` - Customer list
- `app/(tabs)/history.tsx` - Document history with filters
- `app/(tabs)/settings.tsx` - Settings screen
- `app/customer/new.tsx` - New customer form
- `app/customer/[id].tsx` - Customer detail/edit
- `app/estimate/new.tsx` - New estimate builder
- `app/estimate/[id].tsx` - Estimate detail/edit/convert
- `app/invoice/new.tsx` - New invoice builder
- `app/invoice/[id].tsx` - Invoice detail/edit/mark paid
- `context/AppContext.tsx` - Global app state with AsyncStorage
- `constants/colors.ts` - Design tokens (navy blue professional palette)
- `types/models.ts` - TypeScript interfaces for all data models
- `utils/calculations.ts` - Financial calculations, formatters, ID generator
- `utils/pdf.ts` - HTML template for estimate/invoice PDFs
- `components/StatusBadge.tsx` - Colored status indicator
- `components/DocCard.tsx` - Estimate/invoice card component
- `components/LineItemRow.tsx` - Editable line item row
- `components/FormField.tsx` - Labeled text input with error state
- `components/CustomerPicker.tsx` - Modal customer selector
- `components/TotalsCard.tsx` - Subtotal/discount/total summary
- `components/PaywallSheet.tsx` - Pro subscription upsell modal
