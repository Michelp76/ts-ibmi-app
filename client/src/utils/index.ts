export function classNames(...classes: unknown[]): string {
  return classes.filter(Boolean).join(' ')
}

// cf. type d'opérations/interrogations dans le back (root.ts)
export enum OperationType {
  DESCOBJET = 'descObject',
  SEARCHPROGS = 'searchProgsAndTables',
  SEARCHJOBLOG = 'searchJobLog'
}

export enum searchType {
  AUTOCOMPLETE = 'auto-complete',
  SEARCHSOURCE = 'search-in-source'
}
