import React from 'react';
import { Settings, Play, Square, MapPin, Globe, HelpCircle, Split } from 'lucide-react';
import { SearchOptions, ProviderType } from '../types';

interface SidebarProps {
  options: SearchOptions;
  setOptions: React.Dispatch<React.SetStateAction<SearchOptions>>;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  progress: number;
}

const PROVIDER_LABELS: Record<string, string> = {
  [ProviderType.Google]: 'Google',
  [ProviderType.YouTube]: 'YouTube',
  [ProviderType.Amazon]: 'Amazon',
  [ProviderType.Bing]: 'Bing',
  [ProviderType.DuckDuckGo]: 'DuckDuckGo',
  [ProviderType.Yahoo]: 'Yahoo',
  [ProviderType.GoogleCSE1]: 'Google CSE 1',
  [ProviderType.GoogleCSE2]: 'Google CSE 2',
};

const Sidebar: React.FC<SidebarProps> = ({ 
  options, 
  setOptions, 
  isRunning, 
  onStart, 
  onStop,
  progress 
}) => {

  const toggleProvider = (p: ProviderType) => {
    setOptions(prev => {
      const has = prev.providers.includes(p);
      return {
        ...prev,
        providers: has ? prev.providers.filter(x => x !== p) : [...prev.providers, p]
      };
    });
  };

  const toggleStrategy = (key: keyof typeof options.strategies) => {
    setOptions(prev => ({
      ...prev,
      strategies: { ...prev.strategies, [key]: !prev.strategies[key] }
    }));
  };

  return (
    <aside className="w-full md:w-[320px] bg-surface border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        
        {/* Seed Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-3 h-3" /> Seed Keyword
          </label>
          <div className="relative">
             <input 
              type="text" 
              value={options.seed}
              onChange={e => setOptions(prev => ({...prev, seed: e.target.value}))}
              onKeyDown={e => e.key === 'Enter' && !isRunning && onStart()}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600"
              placeholder="e.g. خرید گوشی _ سامسونگ"
              dir="auto"
            />
            <div className="absolute right-3 top-3.5 text-xs text-slate-500 pointer-events-none">
              ⏎
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Use <code className="text-accent bg-accent/10 px-1 rounded">{'{}'}</code> or <code className="text-accent bg-accent/10 px-1 rounded">_</code> as placeholders for letters.<br/>
            Use <code className="text-accent bg-accent/10 px-1 rounded">*</code> as a wildcard (Google fill-in-the-blank).
          </p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-3 h-3" /> Region (GL)
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={options.gl}
              onChange={e => setOptions(prev => ({...prev, gl: e.target.value}))}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary uppercase"
              placeholder="IR"
            />
            <Globe className="absolute right-3 top-2.5 w-4 h-4 text-slate-600" />
          </div>
        </div>

        {/* Providers */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Providers</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(ProviderType).map(p => (
              <label key={p} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white p-2 rounded hover:bg-white/5 transition-colors select-none">
                <input 
                  type="checkbox" 
                  checked={options.providers.includes(p)}
                  onChange={() => toggleProvider(p)}
                  className="rounded border-slate-600 bg-background text-primary focus:ring-offset-background focus:ring-primary"
                />
                <span className="capitalize">{PROVIDER_LABELS[p] || p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Strategies */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider text-pink-400">Persian Strategies</label>
          <div className="space-y-1">
             <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-white/5">
                <input 
                  type="checkbox" 
                  checked={options.strategies.faAz}
                  onChange={() => toggleStrategy('faAz')}
                  className="rounded border-slate-600 bg-background text-pink-500 focus:ring-pink-500"
                />
                <span className="flex items-center gap-1.5">
                  Persian A-Z (الف تا ی)
                  <div className="group relative inline-flex items-center justify-center">
                    <HelpCircle className="w-3 h-3 text-slate-500 hover:text-pink-400 transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <p className="text-[10px] leading-relaxed text-slate-300 mb-2">
                        Replaces <code className="text-pink-400 font-mono">{'{}'}</code> or <code className="text-pink-400 font-mono">_</code> with Persian alphabet characters.
                      </p>
                      <div className="text-[9px] font-mono text-pink-300 bg-black/30 p-2 rounded border border-white/5">
                        Input: "گوشی _ سامسونگ"<br/>
                        <span className="text-slate-500 text-[8px] my-1 block">↓ Generates</span>
                        "گوشی ا سامسونگ"<br/>
                        "گوشی ب سامسونگ"<br/>
                        ...
                      </div>
                    </div>
                  </div>
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-white/5">
                <input 
                  type="checkbox" 
                  checked={options.strategies.faDouble}
                  onChange={() => toggleStrategy('faDouble')}
                  className="rounded border-slate-600 bg-background text-pink-500 focus:ring-pink-500"
                />
                <span>Persian Double (aa-yy) <span className="text-orange-400 text-[10px] ml-1">Slow</span></span>
              </label>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider text-indigo-400">General Strategies</label>
          <div className="space-y-1">
             <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-white/5">
                <input 
                  type="checkbox" 
                  checked={options.strategies.middleGap}
                  onChange={() => toggleStrategy('middleGap')}
                  className="rounded border-slate-600 bg-background text-indigo-400 focus:ring-indigo-400"
                />
                <span className="flex items-center gap-1.5">
                  Middle Gap / Fill Spaces
                   <div className="group relative inline-flex items-center justify-center">
                    <Split className="w-3 h-3 text-slate-500 hover:text-indigo-400 transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                      <p className="text-[10px] leading-relaxed text-slate-300">
                         For "قیمت طراحی", it searches "قیمت ا طراحی", "قیمت ب طراحی"...
                        <br/><br/>
                        <span className="text-indigo-300 font-mono">Cursor aware:</span> It tells Google the cursor is exactly after the inserted letter to get the best suggestions.
                      </p>
                    </div>
                  </div>
                </span>
              </label>
             <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-white/5">
                <input 
                  type="checkbox" 
                  checked={options.strategies.enAzSuffix}
                  onChange={() => toggleStrategy('enAzSuffix')}
                  className="rounded border-slate-600 bg-background text-indigo-500 focus:ring-indigo-500"
                />
                <span>English A-Z (Suffix)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-white/5">
                <input 
                  type="checkbox" 
                  checked={options.strategies.questions}
                  onChange={() => toggleStrategy('questions')}
                  className="rounded border-slate-600 bg-background text-indigo-500 focus:ring-indigo-500"
                />
                <span>Questions (How, What...)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-white/5">
                <input 
                  type="checkbox" 
                  checked={options.strategies.deep}
                  onChange={() => toggleStrategy('deep')}
                  className="rounded border-slate-600 bg-background text-green-500 focus:ring-green-500"
                />
                <span>Deep Recursive Mode</span>
              </label>
          </div>
        </div>

      </div>

      <div className="p-5 border-t border-border bg-surface z-10 space-y-3">
        {isRunning && (
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div 
                    className="bg-primary h-full transition-all duration-300 ease-out"
                    style={{width: `${Math.min(progress, 100)}%`}}
                ></div>
            </div>
        )}
        
        {!isRunning ? (
            <button 
                onClick={onStart}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
                <Play className="w-4 h-4 fill-current" /> Start Research
            </button>
        ) : (
            <button 
                onClick={onStop}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
            >
                <Square className="w-4 h-4 fill-current" /> Stop Operation
            </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;