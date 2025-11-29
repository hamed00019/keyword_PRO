import React from 'react';
import { Search, Download, Copy, BrainCircuit } from 'lucide-react';

interface HeaderProps {
  keywordCount: number;
  selectedCount: number;
  onCopy: () => void;
  onExport: () => void;
  onAIAnalysis: () => void;
  isProcessing: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  keywordCount, 
  selectedCount, 
  onCopy, 
  onExport, 
  onAIAnalysis,
  isProcessing 
}) => {
  return (
    <header className="h-16 bg-surface/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.location.reload()}>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-lg font-bold text-slate-100 tracking-tight">
          Keyword<span className="text-primary">Pro</span> <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">AI</span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-xs text-secondary font-medium uppercase tracking-wider">Total</span>
            <span className="text-sm font-bold text-slate-200">{keywordCount} found</span>
        </div>

        <button 
          onClick={onAIAnalysis}
          disabled={keywordCount === 0 || isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BrainCircuit className="w-4 h-4" />
          <span className="hidden sm:inline">AI Smart Analyze</span>
        </button>

        <div className="h-6 w-px bg-border mx-1"></div>

        <button 
          onClick={onCopy}
          disabled={keywordCount === 0}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-border hover:border-slate-500 text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-50"
          title="Copy to Clipboard"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">{selectedCount > 0 ? `Copy (${selectedCount})` : 'Copy All'}</span>
        </button>

        <button 
          onClick={onExport}
          disabled={keywordCount === 0}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-border hover:border-slate-500 text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-50"
          title="Export CSV"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
