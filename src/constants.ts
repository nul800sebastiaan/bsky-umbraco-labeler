import { Account, Label } from './types.js';

export const LABELS: Label[] = [
  {
    identifier: 'umbraco-hq',
    locales: [
      { lang: 'en', name: 'Umbraco HQ', description: 'A verified Umbraco HQ member'}
    ]
  },
  {
    identifier: 'umbraco-mvp',
    locales: [
      { lang: 'en', name: 'Umbraco MVP', description: 'A verified Umbraco MVP member'}
    ]
  }
];

export const UMB_HQ_MEMBERS : Account[] = [
  {
    did: 'did:plc:2bbkkjbpadqmyysvdrxbvpa',
    handle: 'mattbrailsford.dev'
  }
]