
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calculator,
  ShieldCheck,
  DollarSign,
  Trash2,
  Copy,
  Check,
  Sun,
  Moon,
  Palette,
  ChevronDown,
  Ship,
  Keyboard,
  Info,
  Lock,
  Settings,
  X,
  Activity,
  ChevronRight,
  Hash,
  Database,
  Zap,
  HelpCircle,
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';

const VERSION = '4.2.1';

const DEFAULT_SETTINGS = {
  logo: 'https://teuglobal.com/wp-content/uploads/2023/10/TEU-Global-Logo.png',
  minBilling: 65.00,
  sellRatePercent: 0.40,
  pgaMultiplier: 3,
};

const PALETTES = {
  classic: { name: 'Logistics Pro', primary: '#004B8D', accent: '#FF6600', ring: 'ring-blue-500/30' },
  emerald: { name: 'Eco Transit', primary: '#064E3B', accent: '#10B981', ring: 'ring-emerald-500/30' },
  indigo: { name: 'Cyber Fleet', primary: '#312E81', accent: '#818CF8', ring: 'ring-indigo-500/30' },
  rose: { name: 'Global Tech', primary: '#881337', accent: '#FB7185', ring: 'ring-rose-500/30' },
};

type PaletteKey = keyof typeof PALETTES;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'without' | 'with'>('without');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [palette, setPalette] = useState<PaletteKey>('classic');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Admin States
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminSettings, setAdminSettings] = useState(() => {
    const saved = localStorage.getItem('teu_admin_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [tempSettings, setTempSettings] = useState(adminSettings);

  // Quick Calc State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpression, setCalcExpression] = useState('');

  const COLORS = PALETTES[palette];

  // Input States
  const [invoiceValue, setInvoiceValue] = useState<string>('');
  const [dutiesValue, setDutiesValue] = useState<string>('');
  const [pgaInvoiceValue, setPgaInvoiceValue] = useState<string>('');
  const [nonPgaInvoiceValue, setNonPgaInvoiceValue] = useState<string>('');

  const totalBondValue = useMemo(() => {
    if (activeTab === 'without') {
      const inv = parseFloat(invoiceValue) || 0;
      const dut = parseFloat(dutiesValue) || 0;
      return (inv + dut).toString();
    } else {
      const pga = parseFloat(pgaInvoiceValue) || 0;
      const nonPga = parseFloat(nonPgaInvoiceValue) || 0;
      return ((pga * adminSettings.pgaMultiplier) + nonPga).toString();
    }
  }, [activeTab, invoiceValue, dutiesValue, pgaInvoiceValue, nonPgaInvoiceValue, adminSettings.pgaMultiplier]);

  const sellResult = useMemo(() => {
    const baseValue = parseFloat(totalBondValue) || 0;
    const rawSell = (baseValue * adminSettings.sellRatePercent) / 100;
    return {
      value: rawSell.toFixed(6),
      isBelowMin: baseValue > 0 && rawSell < adminSettings.minBilling
    };
  }, [totalBondValue, adminSettings]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (setter: (val: string) => void, value: string) => {
    setter(value);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleClear = () => {
    setInvoiceValue('');
    setDutiesValue('');
    setPgaInvoiceValue('');
    setNonPgaInvoiceValue('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(`$${text}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcDisplay('0');
      setCalcExpression('');
    } else if (val === 'Backspace') {
      setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      setCalcExpression(prev => prev.slice(0, -1));
    } else if (val === '.') {
      const parts = calcExpression.split(/[+\-*/×÷]/);
      const lastPart = parts[parts.length - 1] || '';
      if (!lastPart.includes('.')) {
        const nextVal = (calcDisplay === '0' || calcDisplay === 'Error' || calcDisplay === '') ? '0.' : calcDisplay + '.';
        const nextExpr = (calcExpression === '') ? '0.' : calcExpression + '.';
        setCalcDisplay(nextVal);
        setCalcExpression(nextExpr);
      }
    } else if (val === '=') {
      try {
        const cleanExpr = calcExpression.replace(/×/g, '*').replace(/÷/g, '/');
        if (/[^0-9+\-*/.]/.test(cleanExpr)) throw new Error();
        const result = eval(cleanExpr);
        const resultStr = String(Number.isInteger(result) ? result : parseFloat(result.toFixed(8)));
        setCalcDisplay(resultStr);
        setCalcExpression(resultStr);
      } catch {
        setCalcDisplay('Error');
        setCalcExpression('');
      }
    } else {
      const isOperator = ['+', '-', '×', '÷'].includes(val);
      if (calcDisplay === '0' && !isOperator) {
        setCalcDisplay(val);
        setCalcExpression(val);
      } else {
        setCalcDisplay(prev => prev === 'Error' ? val : prev + val);
        setCalcExpression(prev => prev + val);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const { key } = e;
      if (/[0-9]/.test(key)) handleCalcBtn(key);
      else if (key === '.') handleCalcBtn('.');
      else if (key === '+') handleCalcBtn('+');
      else if (key === '-') handleCalcBtn('-');
      else if (key === '*') handleCalcBtn('×');
      else if (key === '/') handleCalcBtn('÷');
      else if (key === 'Enter' || key === '=') { e.preventDefault(); handleCalcBtn('='); }
      else if (key === 'Escape' || key.toLowerCase() === 'c') handleCalcBtn('C');
      else if (key === 'Backspace') handleCalcBtn('Backspace');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calcExpression, calcDisplay]);

  const checkPassword = () => {
    if (adminPassword === '332') {
      setShowPasswordPrompt(false);
      setShowAdminPanel(true);
      setTempSettings(adminSettings);
      setAdminPassword('');
    } else {
      alert('Access Denied');
      setAdminPassword('');
    }
  };

  const saveSettings = () => {
    setAdminSettings(tempSettings);
    localStorage.setItem('teu_admin_settings', JSON.stringify(tempSettings));
    setShowAdminPanel(false);
  };

  const getTooltip = (btn: string) => {
    const map: Record<string, string> = {
      '7': '7', '8': '8', '9': '9', '÷': 'Divide [/]',
      '4': '4', '5': '5', '6': '6', '×': 'Multiply [*]',
      '1': '1', '2': '2', '3': '3', '-': 'Subtract [-]',
      'C': 'Clear [Esc]', '0': '0', '.': 'Decimal [.]', '+': 'Add [+]',
      '=': 'Solve [Enter]'
    };
    return map[btn] || '';
  };

  return (
    <div className="min-h-screen pb-12 bg-light-bg dark:bg-dark-bg transition-colors duration-300" style={{ '--brand-primary': COLORS.primary, '--brand-accent': COLORS.accent } as any}>
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 glass border-b border-r border-orange-500 dark:border-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center ml-auto justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-2.5 bg-white rounded-2xl shadow-md border-b border-r border-blue-500 dark:border-blue-700 flex items-center justify-center w-40 h-20 overflow-hidden card-lift">
              <img src={adminSettings.logo} alt="TEU Global" className="max-h-full object-contain" />
            </div>
            <div className="hidden lg:block border-l-2 border-slate-200 dark:border-slate-700 pl-6">
              <h1 className="text-xl md:text-3xl font-black" style={{ color: COLORS.accent }}>TRADE EXPEDITORS USA, INC.</h1>
                <h1 className="text-xl md:text-3xl font-black" style={{ color: COLORS.primary }}>DBA TEU GLOBAL</h1>

              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">SEB Architecture Engine </span>
                <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider animate-pulse">Live Protocol</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
              <Zap size={12} className="text-amber-500 fill-amber-500" />
              ACCURACY VERIFIED V {VERSION}
            </div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300 border-b border-r border-blue-500 dark:border-blue-700 hover:border-orange-500 dark:hover:border-orange-700"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300 border-b border-r border-blue-500 dark:border-orange-700 hover:border-orange-500 dark:hover:border-orange-700"
                title="Color Palettes"
              >
                <Palette size={22} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-4 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-b border-r border-blue-500 dark:border-blue-700 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-2 mb-2">System Themes</p>
                    {(Object.keys(PALETTES) as PaletteKey[]).map(key => (
                      <button key={key} onClick={() => { setPalette(key); setIsMenuOpen(false); }} className={`w-full px-3 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all group ${palette === key ? 'bg-slate-50 dark:bg-slate-700' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full ring-2 ring-offset-2 ring-transparent group-hover:ring-slate-300" style={{ backgroundColor: PALETTES[key].primary }} />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{PALETTES[key].name}</span>
                        </div>
                        {palette === key && <Check size={14} className="text-slate-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowPasswordPrompt(true)} 
              className="ml-2 p-3 rounded-xl bg-slate-900 text-white hover:bg-black transition-all shadow-lg dark:bg-brand-blue dark:hover:bg-blue-600 flex items-center gap-2"
            >
              <Lock size={18} />
              <span className="text-xs font-black uppercase tracking-widest hidden md:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
<main className="max-w-8xl mx-auto px-6 mt-8 relative flex gap-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          <div className="lg:col-span-8 flex flex-col gap-10 max-w-[800px]">
            {/* Dashboard Header Card */}
            <div className="bg-white dark:bg-dark-surface rounded-5xl p-10 border-b border-r border-blue-500 dark:border-blue-700 hover:border-orange-500 dark:hover:border-orange-700 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-all -rotate-12 translate-x-12 -translate-y-8">
                <Database size={300} />
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="space-y-4 max-w-lg">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest">Entry Optimization</span>
                    <span className="px-3 py-1 bg-brand-orange/10 text-brand-orange rounded-full text-[10px] font-black uppercase tracking-widest">Single Entry Bond</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Bond Liability Logic</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">
                    Automated SEB analysis engine adhering to 19 CFR Customs regulations. Integrated PGA scaling for multi-agency compliance.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-3xl border-b border-r border-blue-500 dark:border-blue-700 hover:border-orange-500 dark:hover:border-orange-700 self-start md:self-center shadow-inner">
                  <button onClick={() => setActiveTab('without')} className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'without' ? 'bg-blue-400 dark:bg-orange-400 shadow-3xl text-slate-900 dark:text-white translate-y-[-2px]' : 'text-slate-500 hover:text-slate-700'}`}>Standard Bond</button>
                  <button onClick={() => setActiveTab('with')} className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'with' ? 'bg-orange-500 dark:bg-blue-400 shadow-3xl text-slate-900 dark:text-white translate-y-[-2px]' : 'text-slate-500 hover:text-slate-700'}`}>PGA Compliance Bond</button>
                </div>
              </div>
            </div>

            {/* Core Calculator Area */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Panel */}
              <div className="bg-white dark:bg-dark-surface rounded-5xl p-10 border-b border-r border-blue-500 dark:border-orange-700 hover:border-orange-500 dark:hover:border-blue-700 shadow-lg space-y-10 flex flex-col transition-all hover:shadow-2xl ">
                <div className="space-y-8">
                  <div className="py-6 px-8 mx-full flex ml-max rounded-5xl items-center justify-between text-white relative z-10 border-b border-r border-orange-600" style={{ backgroundColor: COLORS.primary }}>
                    <h3 className="text-m font-black uppercase tracking-[0.3em] text-White flex items-center gap-2">
                      <ArrowRightLeft size={16} className="text-brand-blue" />
                      Dynamic Parameters
                    </h3>
                    <div className="tooltip-trigger relative">
                      <HelpCircle size={18} className="text-slate-300 cursor-help hover:text-slate-400 transition-colors" />
                      <div className="tooltip-content absolute left-1/2 bottom-full mb-3 bg-slate-900 text-white text-[10px] py-2 px-4 rounded-xl whitespace-nowrap opacity-0 invisible transition-all font-black uppercase tracking-widest shadow-2xl z-50">
                        Enter cargo & duty values
                      </div>
                    </div>
                  </div>
                  
                  {activeTab === 'without' ? (
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-m font-black text-Black dark:text-white uppercase tracking-[0.1em] ml-1">Total Invoice Value</label>
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 font-black text-lg">$</div>
                          <input type="number" value={invoiceValue} onChange={e => handleInputChange(setInvoiceValue, e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border-b border-r border-orange-600 dark:border-blue-500 hover:border-blue-500 dark:hover:border-orange-500 rounded-3xl py-5 pl-12 pr-6 text-2xl font-black focus:border-brand-blue focus:ring-8 focus:ring-brand-blue/5 transition-all outline-none text-slate-800 dark:text-white placeholder:text-slate-300" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-m font-black text-Black dark:text-white uppercase tracking-[0.1em] ml-1">Estimated Duties</label>
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-700 font-black text-lg">$</div>
                          <input type="number" value={dutiesValue} onChange={e => handleInputChange(setDutiesValue, e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border-b border-r border-blue-700 dark:border-orange-500 hover:border-orange-500 dark:hover:border-blue-500 rounded-3xl py-5 pl-12 pr-6 text-2xl font-black focus:border-brand-blue focus:ring-8 focus:ring-brand-blue/5 transition-all outline-none text-slate-800 dark:text-white placeholder:text-slate-300" placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[14px] font-black text-Black dark:text-white uppercase tracking-[0.1em] ml-1">Invoice Value with PGA 
                         </label> <br /> <label className="text-[12px] underline text-red-400 dark:text-white lowercase tracking-[0.1em] ml-1">(which falls other Gov agency compliance)  </label>
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-orange/50 font-black text-lg">$</div>
                          <input type="number" value={pgaInvoiceValue} onChange={e => handleInputChange(setPgaInvoiceValue, e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border-b border-r border-blue-700 dark:border-orange-500 hover:border-orange-500 dark:hover:border-blue-500 rounded-3xl py-5 pl-12 pr-6 text-2xl font-black focus:border-brand-orange focus:ring-8 focus:ring-brand-orange/5 transition-all outline-none text-slate-800 dark:text-white placeholder:text-slate-300" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-Black dark:text-white uppercase tracking-[0.1em] ml-1">Invoice Value non PGA compliance</label>
                        <div className="relative group">
                          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">$</div>
                          <input type="number" value={nonPgaInvoiceValue} onChange={e => handleInputChange(setNonPgaInvoiceValue, e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border-b border-r border-orange-600 dark:border-blue-500 hover:border-blue-500 dark:hover:border-orange-500 rounded-3xl py-5 pl-12 pr-6 text-2xl font-black focus:border-brand-blue focus:ring-8 focus:ring-brand-blue/5 transition-all outline-none text-slate-800 dark:text-white placeholder:text-slate-300" placeholder="0.00" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-blue-400 dark:border-orange-400 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-blue text-green-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-green-500">System Ready</span>
                  </div>
                  <button 
                    onClick={handleClear} 
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    <Trash2 size={14} /> Clear Buffer
                  </button>
                </div>
              </div>

              {/* Result Panel */}
              <div className="bg-slate-900 dark:bg-[#080C14] rounded-5xl p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between group border border-slate-800/50 card-lift">
                <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-all rotate-12 translate-x-12">
                   <ShieldCheck size={280} className="text-brand-blue" />
                </div>
                
                <div className="space-y-12 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="w-6 h-0.5 bg-brand-blue rounded-full" />
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400">Terminal Output</h3>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-6xl font-black tracking-tighter text-white drop-shadow-lg">${sellResult.value}</span>
                       <span className="text-[10px] font-bold text-blue-300/60 uppercase tracking-widest mt-2">Calculated Buy Value</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Liability Exposure</label>
                      <Ship size={16} className={`text-slate-600 ${isLoading ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between group/result">
                      <span className="text-2xl font-mono text-slate-100 font-black tracking-tight">${totalBondValue}</span>
                      <button 
                        onClick={() => handleCopy(sellResult.value, 'out')} 
                        className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 hover:scale-110 active:scale-95 transition-all text-white border border-white/10"
                        title="Copy Result"
                      >
                        {copiedId === 'out' ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-10 space-y-5 relative z-10">
                  {sellResult.isBelowMin ? (
                    <div className="flex items-center gap-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] animate-in fade-in slide-in-from-bottom-2">
                      <AlertCircle size={18} className="shrink-0" />
                      Minimum Billing Applies: ${adminSettings.minBilling.toFixed(2)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em]">
                      <Zap size={18} className="shrink-0 fill-emerald-500/20" />
                      Standard Multiplier Logic Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-10">
          
 {/* Regulatory Insights Card */}
            <div className="bg-white dark:bg-dark-surface rounded-5xl p-10 border border-slate-200 dark:border-slate-800 shadow-md space-y-8 transition-all hover:shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Compliance Matrix</h3>
              <div className="space-y-6">
                <div className="flex gap-5 group/item">
                  <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center shrink-0 font-black text-xs shadow-lg shadow-brand-blue/20 group-hover/item:scale-110 transition-transform">01</div>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-wider">SEB liabilities are fixed at {adminSettings.sellRatePercent}% of cumulative entry value + estimated duties.</p>
                </div>
                <div className="flex gap-5 group/item">
                  <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center shrink-0 font-black text-xs shadow-lg shadow-brand-orange/20 group-hover/item:scale-110 transition-transform">02</div>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-wider">PGA-regulated commodities trigger a {adminSettings.pgaMultiplier}x scalar on the base commodity value.</p>
                </div>
                <div className="flex gap-5 group/item">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 font-black text-xs shadow-lg group-hover/item:scale-110 transition-transform">03</div>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-wider">A minimum billing threshold of ${adminSettings.minBilling.toFixed(2)} applies to all single entry protocols.</p>
                </div>
              </div>
            </div>

         
            {/* Quick Tool Calculator */}
            <div className="bg-white dark:bg-dark-surface rounded-5xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden flex flex-col group transition-all hover:shadow-xl">
              <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                  <Calculator size={18} className="text-brand-blue" />
                  Quick Utility
                </h3>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                </div>
              </div>
              <div className="p-8 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="bg-slate-900 rounded-3xl p-8 text-right space-y-2 shadow-2xl border border-slate-800 min-h-[120px] flex flex-col justify-end group/calc">
                   <div className="text-[11px] font-mono text-slate-500 uppercase tracking-widest truncate h-4">{calcExpression || 'SYSTEM IDLE'}</div>
                   <div className="text-4xl font-black font-mono text-white tracking-tighter truncate leading-none">{calcDisplay}</div>
                </div>
              </div>
              <div className="px-8 pb-10 grid grid-cols-4 gap-3">
                {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', 'C', '0', '.', '+'].map(btn => (
                  <div key={btn} className="relative tooltip-trigger">
                    <button 
                      onClick={() => handleCalcBtn(btn)} 
                      className={`w-full h-14 rounded-2xl text-lg font-black transition-all active:scale-95 border-2 ${btn === 'C' ? 'bg-red-50 dark:bg-red-900/10 text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-blue dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}
                    >
                      {btn}
                    </button>
                    <div className="tooltip-content absolute left-1/2 bottom-full mb-3 bg-slate-900 text-white text-[9px] py-1.5 px-3 rounded-xl whitespace-nowrap opacity-0 invisible transition-all font-black uppercase tracking-widest shadow-2xl z-50">
                      {getTooltip(btn)}
                    </div>
                  </div>
                ))}
                <div className="col-span-4 relative tooltip-trigger pt-2">
                   <button 
                    onClick={() => handleCalcBtn('=')} 
                    className="w-full h-16 rounded-2xl text-base font-black bg-brand-blue text-white hover:bg-blue-600 transition-all shadow-xl shadow-brand-blue/20 uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                   >
                     EXECUTE SOLVE
                   </button>
                   <div className="tooltip-content absolute left-1/2 bottom-full mb-3 bg-slate-900 text-white text-[9px] py-1.5 px-3 rounded-xl whitespace-nowrap opacity-0 invisible transition-all font-black uppercase tracking-widest shadow-2xl z-50">Solve Protocol [Enter]</div>
                </div>
              </div>
              <div className="px-10 pb-8 text-center">
                <div className="inline-flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
                   <Keyboard size={14} className="text-slate-500" /> 
                   Keyboard Entry Linked
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-[1440px] mx-auto w-full px-10 py-16 flex flex-col md:flex-row items-center justify-between gap-10 border-t border-slate-200 dark:border-slate-800 mt-20">
        <div className="flex items-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all cursor-pointer group">
          <img src={adminSettings.logo} alt="TEU Global" className="h-8 transition-transform group-hover:scale-105" />
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Trade Expeditors USA</span>
        </div>
        <div className="text-center md:text-right space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} Trade Expeditors USA, Inc.</p>
          <div className="flex items-center justify-center md:justify-end gap-2">
             <Activity size={12} className="text-brand-blue" />
             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Secured Hybrid Infrastructure • Dev: JUNAID ABBASI</p>
          </div>
        </div>
      </footer>

      {/* Admin Modals */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 glass backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-dark-surface w-full max-w-2xl rounded-5xl shadow-3xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in duration-500">
            <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-blue rounded-2xl text-white shadow-xl shadow-brand-blue/20">
                  <Settings size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">System Parameters</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Logic Configuration</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdminPanel(false)} 
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-red-500"
              >
                <X size={28} />
              </button>
            </div>
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Minimum Billing Threshold ($)</label>
                  <input type="number" value={tempSettings.minBilling} onChange={e => setTempSettings({...tempSettings, minBilling: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-4 px-6 font-black outline-none focus:border-brand-blue transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Global Sell Rate (%)</label>
                  <input type="number" step="0.01" value={tempSettings.sellRatePercent} onChange={e => setTempSettings({...tempSettings, sellRatePercent: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-4 px-6 font-black outline-none focus:border-brand-blue transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">PGA Compliance Multiplier (X)</label>
                  <input type="number" value={tempSettings.pgaMultiplier} onChange={e => setTempSettings({...tempSettings, pgaMultiplier: parseInt(e.target.value) || 1})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-4 px-6 font-black outline-none focus:border-brand-blue transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cdn Asset Endpoint (Logo)</label>
                  <input type="text" value={tempSettings.logo} onChange={e => setTempSettings({...tempSettings, logo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-4 px-6 font-black outline-none focus:border-brand-blue transition-all" />
                </div>
              </div>
              <div className="flex gap-5 pt-6">
                <button 
                  onClick={() => setTempSettings(DEFAULT_SETTINGS)} 
                  className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Reset Defaults
                </button>
                <button 
                  onClick={saveSettings} 
                  className="flex-[2] py-5 bg-brand-blue text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-brand-blue/30 hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                >
                  <Check size={20} /> Commit All Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 glass backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-dark-surface w-full max-w-sm rounded-5xl shadow-3xl p-12 text-center border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center text-brand-blue mx-auto mb-8 shadow-inner">
               <Lock size={32} />
            </div>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Root Access</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Enter System Credential</p>
            <div className="relative mb-10">
              <input 
                type="password" 
                autoFocus 
                value={adminPassword} 
                onChange={e => setAdminPassword(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && checkPassword()} 
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-6 text-center text-4xl font-mono tracking-[0.5em] focus:border-brand-blue outline-none shadow-inner" 
                placeholder="****"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowPasswordPrompt(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
              <button onClick={checkPassword} className="flex-[2] py-5 bg-slate-900 dark:bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-black dark:hover:bg-blue-600 shadow-xl shadow-black/10 dark:shadow-brand-blue/20">Authenticate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
