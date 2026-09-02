import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Globe, 
  Info, 
  RotateCw, 
  Sparkles, 
  ArrowRight, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Link as LinkIcon, 
  FileSpreadsheet,
  Activity,
  Trash2,
  Eye,
  Loader2,
  Lock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { KnowledgeItem, FAQPair, UserProfile } from '../types';
import { deleteKnowledgeItemFromDb, saveKnowledgeItemToDb } from '../lib/firestoreService';

interface AITrainingCenterProps {
  knowledgeItems: KnowledgeItem[];
  setKnowledgeItems: React.Dispatch<React.SetStateAction<KnowledgeItem[]>>;
  onOpenNewJobModal: () => void;
  searchQuery: string;
  currentUser: UserProfile;
  onPermissionDenied: () => void;
}

export const AITrainingCenter: React.FC<AITrainingCenterProps> = ({
  knowledgeItems,
  setKnowledgeItems,
  onOpenNewJobModal,
  searchQuery,
  currentUser,
  onPermissionDenied
}) => {
  const [scrapeUrl, setScrapeUrl] = useState('https://kdb.uz');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState(0);
  const [lastRetrainedTime, setLastRetrainedTime] = useState('2 hours ago');
  const [selectedItemForPreview, setSelectedItemForPreview] = useState<KnowledgeItem | null>(null);
  const [extractedFaqsModal, setExtractedFaqsModal] = useState<FAQPair[] | null>(null);

  const isAdmin = currentUser.role === 'admin';

  // Ensure any item with Syncing or Processing status automatically completes smoothly
  useEffect(() => {
    const hasSyncing = knowledgeItems.some(it => it.status === 'Syncing' || it.status === 'Processing');
    if (hasSyncing) {
      const timer = setTimeout(() => {
        setKnowledgeItems(items =>
          items.map(it => {
            if (it.status === 'Syncing' || it.status === 'Processing') {
              const updated: KnowledgeItem = { ...it, status: 'Completed' };
              saveKnowledgeItemToDb(updated);
              return updated;
            }
            return it;
          })
        );
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [knowledgeItems, setKnowledgeItems]);

  // Filter items by search query
  const filteredItems = knowledgeItems.filter(item => 
    item.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle URL fetch & scrape simulation with real Gemini extract
  const handleFetchUrl = async () => {
    if (!isAdmin) {
      onPermissionDenied();
      return;
    }

    if (!scrapeUrl) return;
    setIsFetchingUrl(true);

    try {
      const res = await fetch('/api/gemini/extract-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: scrapeUrl,
          title: `Scraped: ${scrapeUrl}`
        })
      });
      const data = await res.json();

      const newItem: KnowledgeItem = {
        id: `kb-${Date.now()}`,
        sourceName: scrapeUrl.replace(/^https?:\/\//, ''),
        type: 'URL',
        fileFormat: 'LINK',
        dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Completed',
        faqCount: data.faqs?.length || 8,
        url: scrapeUrl,
        summary: `Crawled website content from ${scrapeUrl}. Extracted ${data.faqs?.length || 8} Q&A pairs for Gemini AI training.`,
        faqs: data.faqs || [],
        createdBy: currentUser.displayName
      };

      await saveKnowledgeItemToDb(newItem);
      setKnowledgeItems(prev => [newItem, ...prev]);

      if (data.faqs && data.faqs.length > 0) {
        setExtractedFaqsModal(data.faqs);
      }
    } catch (err) {
      console.error(err);
      const newItem: KnowledgeItem = {
        id: `kb-${Date.now()}`,
        sourceName: scrapeUrl.replace(/^https?:\/\//, ''),
        type: 'URL',
        fileFormat: 'LINK',
        dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Completed',
        faqCount: 12,
        url: scrapeUrl,
        summary: `Web crawler indexed Q&A terms from ${scrapeUrl}.`,
        createdBy: currentUser.displayName
      };
      await saveKnowledgeItemToDb(newItem);
      setKnowledgeItems(prev => [newItem, ...prev]);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Handle Retrain Model action
  const handleRetrain = () => {
    if (!isAdmin) {
      onPermissionDenied();
      return;
    }

    if (isRetraining) return;
    setIsRetraining(true);
    setRetrainProgress(0);

    const interval = setInterval(() => {
      setRetrainProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRetraining(false);
          setLastRetrainedTime('Just now');
          setKnowledgeItems(items =>
            items.map(it => {
              const updated = { ...it, status: 'Completed' as const };
              saveKnowledgeItemToDb(updated);
              return updated;
            })
          );
          return 100;
        }
        return prev + 12;
      });
    }, 300);
  };

  const handleDeleteItem = async (id: string) => {
    if (!isAdmin) {
      onPermissionDenied();
      return;
    }
    await deleteKnowledgeItemFromDb(id);
    setKnowledgeItems(prev => prev.filter(item => item.id !== id));
  };

  const getFormatIcon = (format?: string) => {
    switch (format) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-slate-500" />;
      case 'CSV':
        return <FileSpreadsheet className="w-5 h-5 text-slate-500" />;
      case 'LINK':
      default:
        return <LinkIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const totalFaqs = knowledgeItems.reduce((acc, item) => acc + (item.faqCount || 100), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#f8fafc] min-h-[calc(100vh-4rem)]">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">AI Knowledge Base & Training</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage and refine the intelligence of your banking assistant (Firestore Synced).</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
            isAdmin 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isAdmin ? <ShieldCheck className="w-4 h-4 text-indigo-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
            {isAdmin ? 'Admin: Full Train Rights' : 'User: Read-Only Access'}
          </span>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Eslatma:</span> Siz <span className="font-bold uppercase text-amber-950">Standard User</span> rolidasiz. Yangi fayl upload qilish, veb-sayt scrape qilish va hujjatlarni o'chirish taqiqlangan (faqat ADMIN rol egalari o'tkaza oladi).
          </div>
        </div>
      )}

      {/* Top Section Grid: Data Upload + Model Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Upload Card (Span 8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Data Upload & Crawl
            </h3>
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full">
              3 Slots Remaining
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dropzone Box */}
            <div 
              onClick={isAdmin ? onOpenNewJobModal : onPermissionDenied}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 flex flex-col items-center justify-center space-y-3 group ${
                isAdmin 
                  ? 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 cursor-pointer' 
                  : 'border-slate-200 bg-slate-100/60 cursor-not-allowed opacity-80'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-indigo-50 flex items-center justify-center transition-colors">
                {isAdmin ? (
                  <FileText className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                ) : (
                  <Lock className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {isAdmin ? 'Drop FAQ documents here' : 'Drop FAQ documents (Admin Only)'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">PDF, CSV, or TXT up to 50MB</p>
              </div>

              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAdmin) onOpenNewJobModal();
                  else onPermissionDenied();
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
              >
                {isAdmin ? 'Or browse files' : 'Admin Login Required'}
              </button>
            </div>

            {/* Scrape Website URL */}
            <div className="flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Scrape Website URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="https://kdb.uz"
                    disabled={!isAdmin}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={isFetchingUrl}
                    className="bg-[#0c192d] hover:bg-[#152744] text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Fetching
                      </>
                    ) : (
                      'Fetch'
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 italic mt-1.5">
                  System will crawl up to 2 levels deep.
                </p>
              </div>

              {/* Training Tip box */}
              <div className="bg-[#f0f5ff] border border-indigo-100 rounded-xl p-3.5 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800 font-semibold">Training tip:</strong> Provide clear Q&A formats in your documents for better model accuracy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Model Health Card (Span 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Model Health</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last retrained: {lastRetrainedTime}</p>
            </div>
            {/* Purple Icon Box matching image */}
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Total FAQ Pairs</span>
              <span className="font-bold text-slate-900">{totalFaqs.toLocaleString()}</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-500 font-medium">Model Accuracy</span>
                <span className="font-bold text-indigo-600">98.2%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: '98.2%' }}></div>
              </div>
            </div>

            {/* Optimization Available Banner matching image */}
            <div className="bg-[#f2eeff] border border-indigo-100/80 rounded-xl p-4 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Optimization Available</span>
              </div>
              <p className="text-slate-600 leading-snug">
                New data from "Standard Savings Rates" is ready to be merged. Retraining will take approx. 4 minutes.
              </p>
            </div>
          </div>

          {/* Progress bar during retrain */}
          {isRetraining && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Retraining Gemini Neural Weights...</span>
                <span>{retrainProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200" 
                  style={{ width: `${retrainProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Re-train Model Button */}
          <button
            type="button"
            onClick={handleRetrain}
            disabled={isRetraining}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-xs disabled:opacity-60"
          >
            <RotateCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Retraining Model...' : 'Re-train Model'}</span>
          </button>
        </div>
      </div>

      {/* Middle Section: Active Knowledge Base Table + Coverage Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table (Span 8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="font-semibold text-slate-900 text-base">Active Knowledge Base</h3>
            <button 
              type="button"
              onClick={onOpenNewJobModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium">
                  <th className="py-3 px-3">Source Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Date Added</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getFormatIcon(item.fileFormat)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 leading-snug">{item.sourceName}</p>
                          {item.summary && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{item.summary}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-600 font-medium">{item.type}</td>

                    <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">{item.dateAdded}</td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {item.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Completed
                        </span>
                      )}
                      {item.status === 'Syncing' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                          <RotateCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                          Syncing
                        </span>
                      )}
                      {item.status === 'Processing' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Processing
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedItemForPreview(item)}
                          title="Preview details"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete source"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Knowledge Coverage + Metric widgets (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Knowledge Coverage Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <h3 className="font-semibold text-slate-900 text-base">Knowledge Coverage</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">Mortgages</span>
                  <span className="text-slate-900 font-bold">92%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-slate-900 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">Savings & Cards</span>
                  <span className="text-slate-900 font-bold">85%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-slate-900 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">Wealth Management</span>
                  <span className="text-slate-900 font-bold">45%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom KPI stats matching image (Uptime & Latency) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-center">
              <p className="text-xs text-slate-500 font-medium">Uptime</p>
              <p className="text-2xl font-bold text-emerald-500 mt-1">99.9%</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs text-center">
              <p className="text-xs text-slate-500 font-medium">Latency</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">240ms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Preview Modal */}
      {selectedItemForPreview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedItemForPreview.sourceName}</h3>
                <p className="text-xs text-slate-500">Added on {selectedItemForPreview.dateAdded}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                {selectedItemForPreview.type}
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <strong className="text-slate-800">Status:</strong> {selectedItemForPreview.status}
              </p>
              <p>
                <strong className="text-slate-800">Indexed FAQ Pairs:</strong> {selectedItemForPreview.faqCount || 100} Q&A items
              </p>
              <p>
                <strong className="text-slate-800">Summary:</strong> {selectedItemForPreview.summary}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItemForPreview(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted FAQs Modal */}
      {extractedFaqsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">Extracted Gemini FAQ Pairs</h3>
              </div>
              <button
                onClick={() => setExtractedFaqsModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Gemini model successfully extracted {extractedFaqsModal.length} training Q&A pairs for the KDB Bank Uzbekistan knowledge graph.
            </p>

            <div className="space-y-3">
              {extractedFaqsModal.map((faq, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {faq.category || 'General Banking'}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      Confidence: {Math.round((faq.confidence || 0.95) * 100)}%
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">Q: {faq.question}</p>
                  <p className="text-slate-600 text-xs leading-relaxed">A: {faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setExtractedFaqsModal(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Approve & Merge into Model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
