import { ProviderType } from '../types';
import { jsonp, fetchProxy } from '../utils/helpers';

// Helper to strip HTML tags from suggestions
const clean = (str: any): string => {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]+>/g, '');
};

const Providers = {
  [ProviderType.Google]: async (q: string, gl: string, cp?: number) => {
    // Use Chrome client to support cursor position (cp)
    let url = `https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}&gl=${gl}`;
    if (typeof cp === 'number') {
        url += `&cp=${cp}`;
    }
    const data = await jsonp(url);
    return (data && data[1]) ? data[1] : [];
  },
  [ProviderType.YouTube]: async (q: string, gl: string) => {
    const data = await jsonp(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(q)}&gl=${gl}`);
    return (data && data[1] && Array.isArray(data[1])) ? data[1].map((x: any) => x[0]) : [];
  },
  [ProviderType.Amazon]: async (q: string) => {
    const data = await jsonp(`https://completion.amazon.com/search/complete?method=completion&mkt=1&q=${encodeURIComponent(q)}&search-alias=aps`);
    return (data && data[1]) ? data[1] : [];
  },
  [ProviderType.Bing]: async (q: string) => {
    const data = await fetchProxy(`https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}`);
    return (data && data[1]) ? data[1] : [];
  },
  [ProviderType.DuckDuckGo]: async (q: string) => {
    const data = await fetchProxy(`https://duckduckgo.com/ac/?q=${encodeURIComponent(q)}&type=list`);
    // DDG sometimes returns [{phrase: "..."}] or just strings
    if (Array.isArray(data)) {
        return data.map((x: any) => x.phrase || x);
    }
    return [];
  },
  [ProviderType.Yahoo]: async (q: string) => {
      const data = await fetchProxy(`https://search.yahoo.com/sugg/gossip/gossip-us-ura?command=${encodeURIComponent(q)}&output=json`);
      if (data && data.gossip && data.gossip.results) {
          return data.gossip.results.map((x: any) => x.key);
      }
      return [];
  },
  [ProviderType.GoogleCSE1]: async (q: string) => {
      // CSE ID: 006368593537057042503:efxu7xprihg
      const cx = '006368593537057042503:efxu7xprihg';
      const data = await jsonp(`https://clients1.google.com/complete/search?client=partner-generic&ds=cse&cx=${cx}&q=${encodeURIComponent(q)}`);
      return (data && data[1]) ? data[1] : [];
  },
  [ProviderType.GoogleCSE2]: async (q: string) => {
      // CSE ID: f65f6a13598034679
      const cx = 'f65f6a13598034679';
      const data = await jsonp(`https://clients1.google.com/complete/search?client=partner-generic&ds=cse&cx=${cx}&q=${encodeURIComponent(q)}`);
      return (data && data[1]) ? data[1] : [];
  }
};

export async function fetchSuggestions(provider: ProviderType, query: string, gl: string, cp?: number): Promise<string[]> {
  try {
    const fn = Providers[provider];
    if (fn) {
        // Pass cursor position if supported (currently only used in Google provider logic above)
        const results = await fn(query, gl, cp);
        return results.map(clean).filter((s: string) => s.length > 0);
    }
    return [];
  } catch (err) {
    console.warn(`Provider ${provider} failed`, err);
    return [];
  }
}