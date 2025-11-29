import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KeywordTable from './components/KeywordTable';
import { KeywordResult, SearchOptions, ProviderType, QueueItem } from './types';
import { FA_CHARS, replacePlaceholder } from './utils/helpers';
import { fetchSuggestions } from './services/providers';
import { analyzeKeywordsWithGemini } from './services/geminiService';

const DEFAULT_OPTIONS: SearchOptions = {
  seed: '',
  gl: 'IR',
  providers: [ProviderType.Google],
  strategies: {
    faAz: true,
    faDouble: false,
    enAzPrefix: false,
    enAzSuffix: false,
    questions: false,
    deep: false,
    middleGap: false,
  },
};

const App: React.FC = () => {
  const [options, setOptions] = useState<SearchOptions>(() => {
    try {
        const saved = localStorage.getItem('kp_opts');
        return saved ? JSON.parse(saved) : DEFAULT_OPTIONS;
    } catch { return DEFAULT_OPTIONS; }
  });

  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parentFilter, setParentFilter] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const abortController = useRef<AbortController | null>(null);
  
  // Save preferences
  useEffect(() => {
    localStorage.setItem('kp_opts', JSON.stringify(options));
  }, [options]);

  // Generate Queue Logic
  const generateQueue = (seed: string): QueueItem[] => {
    const cleanSeed = seed.trim();
    // Check for explicit placeholders
    const hasExplicit = cleanSeed.includes('{}') || cleanSeed.includes('_');
    const baseQ = cleanSeed.replace('{}', '').replace('_', '').trim();
    
    const list: QueueItem[] = [{ q: baseQ, tag: 'SEED' }];
    
    // 1. Explicit Placeholder or Suffix/Prefix Mode
    // If user put {} or _, replacePlaceholder will find it. 
    // If not, replacePlaceholder appends to end (standard behavior).
    
    // Persian A-Z
    if (options.strategies.faAz) {
        FA_CHARS.forEach(c => list.push({ q: replacePlaceholder(cleanSeed, c), tag: 'FA-AZ' }));
    }

    // Persian Double
    if (options.strategies.faDouble) {
        FA_CHARS.forEach(c1 => {
            FA_CHARS.forEach(c2 => list.push({ q: replacePlaceholder(cleanSeed, c1 + c2), tag: 'FA-2CHAR' }));
        });
    }

    // 2. Middle Gap (Auto-Fill)
    // Only runs if NO explicit placeholder is used, to avoid conflicts
    if (options.strategies.middleGap && !hasExplicit) {
        const words = baseQ.split(/\s+/);
        if (words.length > 1) {
            for (let i = 1; i < words.length; i++) {
                // Construct pattern with placeholder: "Word1 {} Word2"
                const pre = words.slice(0, i).join(' ');
                const post = words.slice(i).join(' ');
                const pattern = `${pre} {} ${post}`;
                
                // Apply enabled alphabets to this gap
                if (options.strategies.faAz) {
                     FA_CHARS.forEach(c => list.push({ q: replacePlaceholder(pattern, c), tag: 'FA-GAP' }));
                }
                
                // If English strategies are enabled, apply English alphabet too
                if (options.strategies.enAzSuffix || options.strategies.enAzPrefix) {
                     "abcdefghijklmnopqrstuvwxyz".split('').forEach(c => 
                        list.push({ q: replacePlaceholder(pattern, c), tag: 'EN-GAP' })
                     );
                }
            }
        }
    }

    // English Strategies (Manual construction usually implies Suffix/Prefix logic explicitly)
    if (options.strategies.enAzSuffix) {
        "abcdefghijklmnopqrstuvwxyz".split('').forEach(c => list.push({ q: `${cleanSeed} ${c}`, tag: 'A-Z' }));
    }
    
    if (options.strategies.enAzPrefix) {
        "abcdefghijklmnopqrstuvwxyz".split('').forEach(c => list.push({ q: `${c} ${cleanSeed}`, tag: 'PASF' }));
    }

    if (options.strategies.questions) {
        ["how to", "what is", "best", "vs", "review"].forEach(m => list.push({ q: `${m} ${cleanSeed}`, tag: 'QUES' }));
    }

    return list;
  };

  const handleStart = async () => {
    if (!options.seed.trim()) return;

    // Reset
    setIsRunning(true);
    setKeywords([]);
    setSelectedIds(new Set());
    setProgress(0);
    abortController.current = new AbortController();

    const queue = generateQueue(options.seed);
    let completed = 0;
    const totalEst = queue.length * (options.strategies.deep ? 2 : 1); // rough estimate
    
    const seenKeywords = new Set<string>();

    const processItem = async (item: QueueItem) => {
        if (abortController.current?.signal.aborted) return;

        const promises = options.providers.map(p => fetchSuggestions(p, item.q, options.gl));
        const results = await Promise.allSettled(promises);
        
        const newKeywords: KeywordResult[] = [];
        
        results.forEach((res, idx) => {
            if (res.status === 'fulfilled') {
                const provider = options.providers[idx];
                res.value.forEach(kwStr => {
                    const cleanKw = kwStr.toLowerCase().trim();
                    if (cleanKw.length < 2) return;
                    
                    const id = btoa(unescape(encodeURIComponent(cleanKw))); // Simple deterministic ID

                    if (seenKeywords.has(id)) {
                        return; 
                    }

                    seenKeywords.add(id);
                    newKeywords.push({
                        id,
                        keyword: cleanKw,
                        source: [provider],
                        parentSeed: item.q,
                        tag: cleanKw === options.seed.replace('{}','').replace('_','').trim().toLowerCase() ? 'SEED' : item.tag
                    });
                });
            }
        });

        if (newKeywords.length > 0) {
            setKeywords(prev => [...prev, ...newKeywords]);
        }
    };

    // Process in chunks of 3 concurrent requests
    const CHUNK_SIZE = 3;
    for (let i = 0; i < queue.length; i += CHUNK_SIZE) {
        if (abortController.current?.signal.aborted) break;
        
        const chunk = queue.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(processItem));
        
        completed += chunk.length;
        setProgress((completed / totalEst) * 100);
        
        // Small delay to be nice to APIs
        await new Promise(r => setTimeout(r, 200));
    }

    // DEEP RECURSIVE PHASE
    if (options.strategies.deep && !abortController.current?.signal.aborted) {
        // Take top 20 discovered keywords and run A-Z on them
        const topDiscovered = Array.from(seenKeywords).slice(0, 20); // simplified logic
    }

    setIsRunning(false);
    setProgress(100);
    setTimeout(() => setProgress(0), 1000);
  };

  const handleStop = () => {
    if (abortController.current) {
        abortController.current.abort();
    }
    setIsRunning(false);
  };

  const handleCopy = () => {
    const dataToCopy = selectedIds.size > 0 
        ? keywords.filter(k => selectedIds.has(k.id))
        : keywords;
    
    const text = dataToCopy.map(k => k.keyword).join('\n');
    navigator.clipboard.writeText(text);
    alert(`Copied ${dataToCopy.length} keywords`);
  };

  const handleExport = () => {
     const dataToExport = selectedIds.size > 0 
        ? keywords.filter(k => selectedIds.has(k.id))
        : keywords;
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Keyword,Tag,Source,Parent\n"
        + dataToExport.map(k => `"${k.keyword.replace(/"/g, '""')}","${k.tag}","${k.source.join('|')}","${k.parentSeed}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `keywords_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAiAnalysis = async () => {
      // Analyze selected keywords using Gemini
      const targets = selectedIds.size > 0 
        ? keywords.filter(k => selectedIds.has(k.id))
        : keywords.slice(0, 100); // Limit to 100 if none selected
      
      if (targets.length === 0) return;

      setIsAiProcessing(true);
      try {
          // We'll ask for search intent
          const result = await analyzeKeywordsWithGemini(targets.map(k => k.keyword), 'intent');
          if (result) {
              setKeywords(prev => prev.map(k => {
                  if (result[k.keyword]) {
                      return { ...k, metadata: { ...k.metadata, intent: result[k.keyword] } };
                  }
                  return k;
              }));
          }
      } catch (e) {
          alert("AI Analysis failed. Check console or API Key.");
      } finally {
          setIsAiProcessing(false);
      }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background text-slate-100 font-sans">
      <Sidebar 
        options={options} 
        setOptions={setOptions} 
        isRunning={isRunning} 
        onStart={handleStart} 
        onStop={handleStop}
        progress={progress}
      />
      
      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header 
          keywordCount={keywords.length} 
          selectedCount={selectedIds.size}
          onCopy={handleCopy}
          onExport={handleExport}
          onAIAnalysis={handleAiAnalysis}
          isProcessing={isAiProcessing}
        />
        
        <main className="flex-1 overflow-hidden relative">
          <KeywordTable 
            data={keywords} 
            selectedIds={selectedIds}
            onToggleSelect={(id) => setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            })}
            onToggleAll={(select) => {
                if (select) {
                    const ids = keywords.map(k => k.id);
                    setSelectedIds(new Set(ids));
                } else {
                    setSelectedIds(new Set());
                }
            }}
            onParentFilter={setParentFilter}
            parentFilter={parentFilter}
          />

          {isAiProcessing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-surface border border-border p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-medium animate-pulse">Gemini is analyzing intents...</p>
                  </div>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;