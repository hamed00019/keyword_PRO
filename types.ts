export interface KeywordResult {
  id: string;
  keyword: string;
  source: string[]; // e.g. ['google', 'youtube']
  parentSeed: string;
  tag: string; // e.g. 'SEED', 'FA-AZ', 'QUES'
  metadata?: {
    intent?: string;
    volume?: string;
  };
}

export enum ProviderType {
  Google = 'google',
  YouTube = 'youtube',
  Amazon = 'amazon',
  Bing = 'bing',
  DuckDuckGo = 'duckduckgo',
  Yahoo = 'yahoo',
  GoogleCSE1 = 'google_cse_1',
  GoogleCSE2 = 'google_cse_2',
}

export interface SearchOptions {
  seed: string;
  gl: string; // Geo location e.g., 'IR', 'US'
  providers: ProviderType[];
  strategies: {
    faAz: boolean;
    faDouble: boolean;
    enAzPrefix: boolean;
    enAzSuffix: boolean;
    questions: boolean;
    deep: boolean;
    middleGap: boolean; // Auto-fill spaces between words
  };
}

export interface QueueItem {
  q: string;
  tag: string;
  depth?: number;
  cursorPos?: number; // Cursor position for context-aware suggestions
}