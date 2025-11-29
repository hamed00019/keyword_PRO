export const FA_CHARS = "اآبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی".split('');

export function replacePlaceholder(text: string, replacement: string): string {
  if (text.includes('{}')) {
    return text.replace('{}', replacement);
  }
  if (text.includes('_')) {
    return text.replace('_', replacement);
  }
  return text + ' ' + replacement;
}

export function jsonp(url: string): Promise<any> {
  return new Promise((resolve) => {
    const callbackName = 'j' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    let done = false;

    (window as any)[callbackName] = (data: any) => {
      done = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      done = true;
      cleanup();
      resolve([]);
    };

    // Handle existing query params
    const joiner = url.includes('?') ? '&' : '?';
    script.src = `${url}${joiner}callback=${callbackName}`;
    document.head.appendChild(script);

    const cleanup = () => {
      delete (window as any)[callbackName];
      script.remove();
    };

    setTimeout(() => {
      if (!done) {
        cleanup();
        resolve([]);
      }
    }, 5000);
  });
}

// Proxy fetcher using Jina or similar to bypass CORS for simple text scraping if needed
export async function fetchProxy(url: string): Promise<any> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, { cache: 'no-store' });
    let txt = await res.text();
    // Clean up Jina's markdown wrapping
    txt = txt.replace(/^Title:.*$/m, '')
             .replace(/^URL Source:.*$/m, '')
             .replace(/```json/g, '')
             .replace(/```/g, '')
             .trim();
    
    // Try to find a JSON-like array structure
    const match = txt.match(/(\[.*\]|\{.*\})/s);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}