/**
 * Phase 0 & Phase 5 Security Rules Verification Suite (Dirty Dozen Payloads)
 * Verifies all 12 adversarial payloads against the Firestore rules invariants.
 */

export interface SimulatedAuth {
  uid: string;
  token: {
    email?: string;
    email_verified?: boolean;
  };
}

export const DIRTY_DOZEN_PAYLOADS = [
  { id: 1, name: 'Unauthenticated Write', auth: null, expected: 'PERMISSION_DENIED' },
  {
    id: 2,
    name: 'Unverified Email Spoof',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: false } },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing on Create (ownerId != auth.uid)',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    override: { ownerId: 'user_2' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow / Ghost Field Injection on Create',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    override: { isVerifiedAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection on Update',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    override: { secretFlag: 'hacked' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immutable ownerId Mutation on Update',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    override: { ownerId: 'user_2' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable createdAt Mutation on Update',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    override: { createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client Timestamp Forgery on updatedAt',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    override: { updatedAt: '2099-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Resource / ID Poisoning (Invalid or >128 char docId)',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    docId: 'inv$bad/id_with_illegal_chars',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unbounded Array / Value Poisoning (items.size() > 50)',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    override: { items: new Array(60).fill({}) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Bypass (updating VOID invoice)',
    auth: { uid: 'user_1', token: { email: 'dvshpillai@gmail.com', email_verified: true } },
    existingStatus: 'VOID',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Cross-Tenant PII Read / Blanket List',
    auth: { uid: 'user_2', token: { email: 'other@gmail.com', email_verified: true } },
    targetOwnerId: 'user_1',
    expected: 'PERMISSION_DENIED',
  },
];
