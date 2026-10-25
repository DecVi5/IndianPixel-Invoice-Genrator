export interface StudioAddonTier {
  id: string;
  name: string;
  price: number;
}

export interface StudioAddonDefinition {
  id: 'rush' | 'revisions' | 'subbrand' | 'trademark';
  title: string;
  tagline: string;
  badge: string;
  iconName: string;
  whenClientNeedsIt: string;
  whatIsDelivered: string;
  unit: string;
  defaultPrice: number;
  sacCode: string;
  tiers?: StudioAddonTier[];
}

export const STUDIO_ADDONS: StudioAddonDefinition[] = [
  {
    id: 'rush',
    title: 'Fast-Track Rush Delivery',
    tagline: 'Turnaround compressed by 35%–50% with daily feedback sprints',
    badge: 'Urgent Expedite',
    iconName: 'Zap',
    sacCode: '998311',
    whenClientNeedsIt:
      'Launch date moved up, urgent investor demo, or immediate retail deadline.',
    whatIsDelivered:
      'Guaranteed priority queue, daily feedback loops, and turnaround reduced by 35%–50% (e.g., standard 3-week project delivered in 8–10 business days).',
    unit: 'Sprint',
    defaultPrice: 4999,
    tiers: [
      {
        id: 'tier-01',
        name: 'Brand Foundation (Tier 01)',
        price: 4999,
      },
      {
        id: 'tier-02',
        name: 'Brand Rebuild (Tier 02)',
        price: 6999,
      },
      {
        id: 'tier-03',
        name: 'Brand Ecosystem (Tier 03)',
        price: 11999,
      },
    ],
  },
  {
    id: 'revisions',
    title: 'Extra Creative Concepts & Revisions',
    tagline: '2 new concept presentation boards + 2 refinement rounds',
    badge: 'Art Direction',
    iconName: 'Palette',
    sacCode: '998314',
    whenClientNeedsIt:
      'If the client wants to see radically different art styles, alternate naming layouts, or additional iterations beyond the standard package allowance.',
    whatIsDelivered:
      '2 new concept presentation boards + 2 refinement rounds.',
    unit: 'Round',
    defaultPrice: 3999,
  },
  {
    id: 'subbrand',
    title: 'Sub-Brand & Sister Venture Identity',
    tagline: 'Distinct child mark inheriting core parent DNA and prestige',
    badge: 'Multi-Brand',
    iconName: 'Boxes',
    sacCode: '998314',
    whenClientNeedsIt:
      "When a business launches a child brand, spin-off company, or distinct product division that must inherit the parent brand's prestige while having its own distinct mark.",
    whatIsDelivered:
      'Sub-brand logo system, adapted color and font hierarchy, social media avatar set, and master vector package.',
    unit: 'Sub-Brand',
    defaultPrice: 6999,
  },
  {
    id: 'trademark',
    title: 'Trademark-Ready Asset Kit',
    tagline: 'Monochrome proofs & dimensioned vector masters for IP registry filing',
    badge: 'IP Filing',
    iconName: 'ShieldCheck',
    sacCode: '998319',
    whenClientNeedsIt:
      'When filing for IP registration with the Trademark Registry (IP India / USPTO).',
    whatIsDelivered:
      'Strict monochrome/black & white vector proofs, safe-zone/clear-space dimension sheets, and pure vector EPS/TIFF master assets formatted to exact legal filing guidelines.',
    unit: 'Mark',
    defaultPrice: 2499,
  },
];
