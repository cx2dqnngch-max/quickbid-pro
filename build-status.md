# QuickBid Pro — iOS Build Status

## Build 3 (Save Button Fix)

- **Build URL:** https://expo.dev/accounts/aspag/projects/quickbid-pro/builds/4ffc23c3-e306-47e7-9e56-0dbb17447994
- **Build Number:** 3
- **Version:** 1.0.0
- **Platform:** iOS
- **Profile:** production
- **Submitted:** 2026-04-10

## What was fixed in Build 3

1. **Async race condition (primary cause):** `AppContext.tsx` — `addEstimate` and `addInvoice` called `setEstimates`/`setInvoices` inside a state updater callback and returned immediately. The caller (`save()`) then called `router.replace('/estimate/ID')` before React had committed the state update. The detail screen rendered, tried `estimates.find(e => e.id === id)`, found nothing (state not committed yet), and showed "Estimate not found". Fixed by adding `await flushUpdates()` (a `setTimeout(resolve, 0)` promise) after each `setState` call in all add/update/delete methods. This yields to the event loop, allowing React to commit state before the caller navigates.

2. **Silent validation failure (hit before Bug 1):** `estimate/new.tsx` and `invoice/new.tsx` — The `validate()` function stored per-item errors in `errors['item_0']`, `errors['item_1']`, etc. but the JSX only rendered `errors.lineItems` (the "no items" error). If the user had a line item with an empty title (the default), validation failed silently. Fixed by adding visible error text under each `LineItemRow` for per-item errors, plus an `Alert.alert("Cannot Save", ...)` so the user always sees what's wrong. The catch block now shows a "Save Failed" alert instead of silently failing.

3. **Safety net:** Both detail screens (`estimate/[id].tsx`, `invoice/[id].tsx`) now show an `ActivityIndicator` for up to 800ms if the record isn't immediately found, then fall back to the error screen. A `useEffect` syncs the form when the context data commits after async navigation.

## Previous Builds

- **Build 2 (Launch Crash Fix):** https://expo.dev/accounts/aspag/projects/quickbid-pro/builds/d4668553-6660-4d3d-b49d-b38fd26f3912
- **Build 1 (SDK Fix):** https://expo.dev/accounts/aspag/projects/quickbid-pro/builds/fe3606e9-15b3-4e20-a771-49002622048b
- **Build 0 (Initial, Failed):** https://expo.dev/accounts/aspag/projects/quickbid-pro/builds/39bf7f50-fbdc-4510-a71c-06ebca7ae0c5

## Build Configuration

- **Credentials**: Local (dist.p12 + profile.mobileprovision)
- **Bundle ID**: com.quickbidpro.app

## Build Credits Note

Your account has used 100% of included build credits for this month. Additional usage will be billed at pay-as-you-go rates.
See billing: https://expo.dev/accounts/aspag/settings/billing

## Next Steps (After Build Completes)

1. Monitor build at the Build URL above (~20 min)
2. Once finished, run `eas submit --platform ios --profile production` to submit to App Store Connect
3. Complete App Store listing details on App Store Connect
