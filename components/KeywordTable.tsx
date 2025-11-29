import React, { useMemo, useState } from 'react';
import { KeywordResult } from '../types';
import { ExternalLink, Tag, Filter } from 'lucide-react';

interface KeywordTableProps {
  data: KeywordResult[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: (select: boolean) => void;
  onParentFilter: (parent: string | null) => void;
  parentFilter: string | null;
}

const KeywordTable: React.FC<KeywordTableProps> = ({
  data,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onParentFilter,
  parentFilter
}) => {
  const [filterText, setFilterText] = useState('');
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  // --- Client-side clustering logic ---
  const clusters = useMemo(() => {
    const counts: Record<string, number> = {};
    const stops = new Set(["the", "is", "in", "در", "با", "از", "که", "به", "برای", "how", "what", "best", "vs", "or", "دانلود", "خرید"]);
    
    data.forEach(row => {
      row.keyword.split(/[\s-]+/).forEach(w => {
        if (w.length > 2 && !stops.has(w) && isNaN(Number(w))) {
            counts[w] = (counts[w] || 0) + 1;
        }
      });
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20 clusters
  }, [data]);

  // --- Filtering ---
  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (parentFilter && row.parentSeed !== parentFilter) return false;
      if (activeCluster && !row.keyword.includes(activeCluster)) return false;
      if (filterText && !row.keyword.toLowerCase().includes(filterText.toLowerCase())) return false;
      return true;
    });
  }, [data, parentFilter, activeCluster, filterText]);

  const allSelected = filteredData.length > 0 && filteredData.every(r => selectedIds.has(r.id));

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Filters Bar */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex gap-4">
           <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Filter keywords..." 
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
              />
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-secondary" />
           </div>
        </div>

        {/* Clusters */}
        {clusters.length > 0 && (
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            <button 
                onClick={() => setActiveCluster(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!activeCluster ? 'bg-primary text-white border-primary' : 'bg-surface text-secondary border-border hover:border-primary hover:text-white'}`}
            >
                All
            </button>
            {clusters.map(([word, count]) => (
               <button 
                key={word}
                onClick={() => setActiveCluster(word === activeCluster ? null : word)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${word === activeCluster ? 'bg-primary text-white border-primary' : 'bg-surface text-secondary border-border hover:border-primary hover:text-white'}`}
            >
                {word} <span className="opacity-60 text-[10px]">{count}</span>
            </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Header */}
      <div className="flex items-center px-4 h-10 bg-surface border-b border-border text-xs font-bold text-secondary uppercase sticky top-0 z-10">
        <div className="w-12 flex justify-center">
            <input 
                type="checkbox" 
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="rounded border-slate-600 bg-background text-primary focus:ring-primary cursor-pointer"
            />
        </div>
        <div className="flex-1 px-4">Keyword</div>
        <div className="w-1/4 px-4 hidden md:block">Source Context</div>
        <div className="w-32 px-4 hidden sm:block">Type</div>
        <div className="w-24 px-4 text-right">Providers</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {filteredData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-secondary">
                <p>No keywords found.</p>
            </div>
        ) : (
            <table className="w-full text-sm text-left">
                <tbody>
                    {filteredData.map(row => {
                         const isSelected = selectedIds.has(row.id);
                         let tagColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                         if (row.tag === 'FA-AZ' || row.tag === 'FA-2CHAR') tagColor = 'bg-pink-500/10 text-pink-400 border-pink-500/20';
                         if (row.tag === 'SEED') tagColor = 'bg-primary/10 text-primary border-primary/20';

                         return (
                            <tr 
                                key={row.id} 
                                className={`border-b border-border hover:bg-white/5 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                            >
                                <td className="w-12 py-3 flex justify-center items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(row.id)}
                                        className="rounded border-slate-600 bg-background text-primary focus:ring-primary cursor-pointer"
                                    />
                                </td>
                                <td className="flex-1 px-4 py-3">
                                    <div className="flex items-center gap-2 group">
                                        <a 
                                            href={`https://www.google.com/search?q=${encodeURIComponent(row.keyword)}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-slate-500 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                        <span 
                                            className="font-medium text-slate-200 cursor-pointer select-text" 
                                            onClick={() => onToggleSelect(row.id)}
                                        >
                                            {row.keyword}
                                        </span>
                                    </div>
                                    {row.metadata?.intent && (
                                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                        {row.metadata.intent}
                                      </span>
                                    )}
                                </td>
                                <td className="w-1/4 px-4 py-3 hidden md:table-cell">
                                    <div 
                                        onClick={() => onParentFilter(parentFilter === row.parentSeed ? null : row.parentSeed)}
                                        className={`cursor-pointer text-xs truncate max-w-[150px] ${parentFilter === row.parentSeed ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="Click to filter by this parent seed"
                                    >
                                        {row.parentSeed}
                                    </div>
                                </td>
                                <td className="w-32 px-4 py-3 hidden sm:table-cell">
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${tagColor}`}>
                                        {row.tag}
                                    </span>
                                </td>
                                <td className="w-24 px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        {row.source.slice(0, 3).map(s => (
                                            <div key={s} className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-[8px] text-slate-400 uppercase" title={s}>
                                                {s[0]}
                                            </div>
                                        ))}
                                        {row.source.length > 3 && (
                                            <span className="text-[9px] text-slate-500">+{row.source.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                         );
                    })}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default KeywordTable;
