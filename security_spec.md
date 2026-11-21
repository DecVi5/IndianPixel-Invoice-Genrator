# Phase 0: Payload-First Security TDD Specification (`security_spec.md`)

## 1. Data Invariants
1. **Identity & Ownership Invariant**: Every document in `/invoices/{invoiceId}` and `/studioConfigs/{configId}` MUST contain an `ownerId` string (`^[a-zA-Z0-9_\-]+$`, max 128 chars) that strictly equals `request.auth.uid`, and the authenticated user MUST have `request.auth.token.email_verified == true`.
2. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) MUST validate the path variable (`invoiceId` or `configId`) using `isValidId()`, and for `/studioConfigs/{configId}`, `configId` MUST equal `request.auth.uid`.
3. **Strict Key & Schema Blueprint**: `isValidStudioInvoice(data)` and `isValidStudioConfig(data)` MUST enforce `hasAll` and `hasOnly` on `create` and validate every field's type, string length bounds, numeric bounds, and bounded list sizes (`items.size() >= 1 && items.size() <= 50 && items[0] is map`, `milestones.size() == 3 && milestones[0] is map`).
4. **Immutable & Temporal Fields**: `ownerId` and `createdAt` are strictly immutable on `update`. `createdAt` MUST equal `request.time` on `create`, and `updatedAt` MUST equal `request.time` on both `create` and `update`.
5. **Terminal State Locking**: Once an invoice reaches terminal status `masterStatus == 'VOID'`, no subsequent client updates are permitted.
6. **PII & Query Isolation**: Because invoices and studio configs contain client/studio PII (`email`, `phone`, `address`, `pan`, `accountNumber`), `get` and `list` operations MUST strictly verify `resource.data.ownerId == request.auth.uid`. No blanket `isSignedIn()` reads are allowed.

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, Integrity, and State)
1. **Payload 1 (Unauthenticated Write)**: `auth = null`, attempting `create` on `/invoices/inv_1`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Spoof)**: `auth = { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: false } }`, attempting `create` on `/invoices/inv_1`. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Identity Spoofing on Create)**: `auth = { uid: 'user_1' }`, payload sets `ownerId: 'user_2'`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Shadow / Ghost Field Injection on Create)**: Valid invoice payload plus extra field `"isVerifiedAdmin": true`. Expected: `PERMISSION_DENIED` via `hasOnly()`.
5. **Payload 5 (Shadow Field Injection on Update)**: Valid update payload on `/invoices/inv_1` adding `"secretFlag": "hacked"`. Expected: `PERMISSION_DENIED` via `affectedKeys().hasOnly(...)`.
6. **Payload 6 (Immutable `ownerId` Mutation on Update)**: Attempting to change `ownerId` from `'user_1'` to `'user_2'` during `update`. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Immutable `createdAt` Mutation on Update)**: Attempting to modify `createdAt` during `update`. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Client Timestamp Forgery)**: Passing a past or future timestamp instead of `request.time` for `updatedAt`. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Resource / ID Poisoning)**: Creating a document with a 200-character ID or invalid characters (`inv$bad/id`). Expected: `PERMISSION_DENIED` via `isValidId()`.
10. **Payload 10 (Unbounded Array / Value Poisoning)**: Passing `items: []` or an `items` array with 100 elements (`> 50` max) or `projectName` exceeding 300 chars. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (Terminal State Bypass)**: Attempting to update an invoice whose existing `masterStatus` is `'VOID'`. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Cross-Tenant PII Read / Blanket List)**: Authenticated `'user_2'` attempting `get` or `list` on `'user_1'`'s `/invoices` or `/studioConfigs/user_1`. Expected: `PERMISSION_DENIED`.
