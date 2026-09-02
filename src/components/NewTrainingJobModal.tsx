import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Globe, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle2,
  FileCheck,
  Edit3,
  RefreshCw,
  Lightbulb,
  FileCode2
} from 'lucide-react';
import { KnowledgeItem } from '../types';
import { saveKnowledgeItemToDb } from '../lib/firestoreService';
import { extractTextFromPdf } from '../lib/pdfExtractor';

interface NewTrainingJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKnowledgeItem: (item: KnowledgeItem) => void;
  initialJobType?: 'document' | 'url' | 'rawText';
}

export const NewTrainingJobModal: React.FC<NewTrainingJobModalProps> = ({
  isOpen,
  onClose,
  onAddKnowledgeItem,
  initialJobType = 'document'
}) => {
  const [jobType, setJobType] = useState<'document' | 'url' | 'rawText'>(initialJobType);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [textCategory, setTextCategory] = useState<'update' | 'qa' | 'freeform'>('update');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setIsProcessing(false);
    setTitle('');
    setUrl('');
    setRawText('');
    setSelectedFile(null);
    onClose();
  };

  const applyTemplate = (templateType: 'email_update' | 'rate_update' | 'qa_sample' | 'policy_change') => {
    switch (templateType) {
      case 'email_update':
        setTitle("Valyuta bo'limi pochtasi va rekvizitlar o'zgarishi");
        setRawText(
`[DIQQAT: MA'LUMOT O'ZGARISHI / YANGILANISH]
Tashqi savdo shartnomalari va valyuta to'lov topshiriqnomalari bo'yicha muhim o'zgarish:
- Tashqi savdo shartnomalarini yuborish uchun yangilangan elektron pochta manzili: ccd-new@kdb.uz (yoki valyuta bo'limi ichki raqamlari: 820, 821, 822).
- Eski pochtaga yuborilgan xatlar avtomatik yo'naltiriladi, ammo yangi shartnomalarni to'g'ridan-to'g'ri yangi manzilga yuborish tavsiya etiladi.`
        );
        setTextCategory('update');
        break;

      case 'rate_update':
        setTitle("2026-yilgi yangilangan Kredit va Omonat stavkalari");
        setRawText(
`[YANGILANGAN STAVKALAR VA SHARTLAR]
KDB Bank O'zbekistonning 2026-yildan amal qiluvchi yangi stavkalari:
- Ipoteka va ko'chmas mulk krediti: yillik 21.5% (boshlang'ich to'lov 25% dan boshlanadi).
- Korporativ kreditlash: yillik 19% dan boshlab, muddat 36 oygacha.
- Milliy valyutadagi omonatlar (Depozitlar): yillik 23% gacha, oylik foiz to'lovlari bilan.`
        );
        setTextCategory('update');
        break;

      case 'qa_sample':
        setTitle("Bank operatsiyalari bo'yicha tezkor savol-javoblar");
        setRawText(
`Savol: Plastik karta PIN-kodi 3 marta noto'g'ri kiritilganda nima qilish kerak?
Javob: Humo kartalarini @humocardbot orqali yoki KDB Bank filiallarida shaxsni tasdiqlovchi hujjat bilan 5 daqiqada blokdan yechish mumkin.

Savol: Yuridik shaxslar uchun internet-banking (iDBA) parolini qanday tiklash mumkin?
Javob: iDBA kirish sahifasida "Parolni unutdim" tugmasini bosing va biriktirilgan elektron pochtaga kelgan bir martalik kodni kiriting.`
        );
        setTextCategory('qa');
        break;

      case 'policy_change':
        setTitle("Xorijiy valyutada to'lov topshiriqnomalari reglamenti");
        setRawText(
`[YANGI TARTIB VA NIZOM]
10 000 AQSh dollaridan yuqori bo'lgan barcha xorijiy valyutadagi to'lov topshiriqnomalari majburiy ravishda "Call-Back" avtorizatsiyasi va tashqi savdo shartnomasiga muvofiqlik ekspertizasidan o'tkaziladi.
Murojaat va maslahat uchun Call-markaz: 78 120 80 00.`
        );
        setTextCategory('freeform');
        break;
    }
  };

  const parseJsonFaqs = (raw: string): { faqs: any[]; summary: string; cleanedText: string } | null => {
    try {
      const trimmed = raw.trim();
      if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return null;
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.faqs) ? parsed.faqs : [parsed]);
      
      const extracted: any[] = [];
      const textLines: string[] = [];
      
      items.forEach((item: any, idx: number) => {
        const qUz = (item.questionUz || item.question_uz || item.question || item.q || '').trim();
        const aUz = (item.answerUz || item.answer_uz || item.answer || item.a || '').trim();
        const qRu = (item.questionRu || item.question_ru || '').trim();
        const aRu = (item.answerRu || item.answer_ru || '').trim();
        const qEn = (item.questionEn || item.question_en || '').trim();
        const aEn = (item.answerEn || item.answer_en || '').trim();
        
        const mainQ = (qUz || qRu || qEn).replace(/\s+/g, ' ');
        const mainA = (aUz || aRu || aEn).replace(/\s+/g, ' ');
        
        if (mainQ && mainA) {
          extracted.push({
            id: `faq-json-${Date.now()}-${idx}`,
            question: mainQ,
            answer: mainA,
            category: item.category || 'Bank Xizmatlari',
            confidence: 0.99
          });
          
          textLines.push(`[SAVOL-JAVOB ${idx + 1}]`);
          if (qUz && aUz) textLines.push(`Savol (UZ): ${qUz}\nJavob (UZ): ${aUz}`);
          if (qRu && aRu) textLines.push(`Вопрос (RU): ${qRu}\nОтвет (RU): ${aRu}`);
          if (qEn && aEn) textLines.push(`Question (EN): ${qEn}\nAnswer (EN): ${aEn}`);
          textLines.push('');
        }
      });
      
      if (extracted.length > 0) {
        return {
          faqs: extracted,
          summary: `JSON bazadan ${extracted.length} ta rasmiy bank savol-javoblari KDB Bank AI bazasiga muvaffaqiyatli indekslandi.`,
          cleanedText: textLines.join('\n')
        };
      }
    } catch {
      // not json
    }
    return null;
  };

  const parseTextDirectFaqs = (text: string, sourceTitle: string): any[] => {
    const faqs: any[] = [];
    const lines = text.split('\n');
    let currentQ = '';
    let currentA = '';

    for (const line of lines) {
      const trimmed = line.trim();
      const qMatch = trimmed.match(/^(?:Savol|Question|Вопрос|Q|\d+\.\s*Savol|\d+\.\s*Q):\s*(.*)/i);
      const aMatch = trimmed.match(/^(?:Javob|Answer|Ответ|A|\d+\.\s*Javob|\d+\.\s*A):\s*(.*)/i);

      if (qMatch) {
        if (currentQ && currentA) {
          faqs.push({
            id: `faq-txt-${Date.now()}-${faqs.length}`,
            question: currentQ,
            answer: currentA,
            category: 'Bank Qoidasi / Yangilanish',
            confidence: 0.99
          });
          currentA = '';
        }
        currentQ = qMatch[1].trim();
      } else if (aMatch && currentQ) {
        currentA = aMatch[1].trim();
      } else if (currentA) {
        currentA += ' ' + trimmed;
      }
    }

    if (currentQ && currentA) {
      faqs.push({
        id: `faq-txt-${Date.now()}-${faqs.length}`,
        question: currentQ,
        answer: currentA,
        category: 'Bank Qoidasi / Yangilanish',
        confidence: 0.99
      });
    }

    // If no Q: A: format, but has bullet points or change notes
    if (faqs.length === 0 && text.trim().length > 20) {
      faqs.push({
        id: `faq-txt-${Date.now()}-main`,
        question: `${sourceTitle} bo'yicha qanday yangilik va o'zgarishlar mavjud?`,
        answer: text.trim(),
        category: "Yangilangan Ma'lumot",
        confidence: 0.99
      });
    }

    return faqs;
  };

  const readFileContentSafely = async (file: File): Promise<string> => {
    try {
      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.endsWith('.pdf')) {
        const pdfText = await extractTextFromPdf(file);
        if (pdfText && pdfText.length > 30) {
          return pdfText;
        }
      }
      
      const text = await file.text();
      const cleaned = text.replace(/[^\x20-\x7E\t\r\n\u0400-\u04FF\u00A0-\u00FF]/g, ' ').trim();
      return cleaned || `Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    } catch {
      return `Uploaded file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const effectiveTitle = title.trim() || (selectedFile ? selectedFile.name : (jobType === 'rawText' ? "KDB Bank Matnli Qoida Yangilanishi" : url)) || 'KDB Bank Document';
      let format: 'PDF' | 'CSV' | 'TXT' | 'LINK' | 'JSON' = 'PDF';
      let fileContent = rawText;

      if (jobType === 'document' && selectedFile) {
        if (selectedFile.name.toLowerCase().endsWith('.csv')) format = 'CSV';
        else if (selectedFile.name.toLowerCase().endsWith('.txt')) format = 'TXT';
        else if (selectedFile.name.toLowerCase().endsWith('.json')) format = 'JSON';
        else format = 'PDF';
        
        fileContent = await readFileContentSafely(selectedFile);
      } else if (jobType === 'url') {
        format = 'LINK';
      } else if (jobType === 'rawText') {
        format = 'TXT';
      }

      // Check if file content or rawText is a JSON FAQ dataset
      const jsonParsed = parseJsonFaqs(fileContent || rawText || '');
      if (jsonParsed) {
        format = 'JSON';
      }

      let extractedFaqs: any[] = jsonParsed ? jsonParsed.faqs : [];
      let extractedSummary = jsonParsed ? jsonParsed.summary : `Indexed ${effectiveTitle} for KDB Bank Uzbekistan AI Knowledge Base.`;
      let cleanSnippetText = jsonParsed ? jsonParsed.cleanedText : fileContent;

      // Direct text parsing for rawText
      if (jobType === 'rawText' && rawText.trim()) {
        const directFaqs = parseTextDirectFaqs(rawText, effectiveTitle);
        if (directFaqs.length > 0) {
          extractedFaqs = directFaqs;
          extractedSummary = `KDB Bank tizimiga matnli yangilanish kiritildi: "${effectiveTitle}". ${directFaqs.length} ta qoida/savol-javob bazaga qo'shildi.`;
        }
      }

      if (extractedFaqs.length === 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const res = await fetch('/api/gemini/extract-faq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: jobType === 'url' ? url : undefined,
              rawContent: fileContent,
              title: effectiveTitle
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data.faqs && Array.isArray(data.faqs) && data.faqs.length > 0) {
              extractedFaqs = data.faqs;
            }
            if (data.summary) {
              extractedSummary = data.summary;
            }
          }
        } catch (err) {
          console.warn('Gemini extraction timed out or fallback activated:', err);
        }
      }

      // Fallback FAQs if extraction is still empty
      if (extractedFaqs.length === 0) {
        const previewSnippet = fileContent ? fileContent.slice(0, 500) : '';
        extractedFaqs = [
          {
            id: `faq-${Date.now()}-1`,
            question: `${effectiveTitle} bo'yicha asosiy shartlar va qoidalar nimalardan iborat?`,
            answer: previewSnippet ? `Hujjat/Qoidada quyidagilar belgilangan: ${previewSnippet}` : `KDB Bank O'zbekiston rasmiy nizomi va ${effectiveTitle} me'yorlari.`,
            category: jobType === 'rawText' ? "Qoida O'zgarishi" : (format === 'LINK' ? 'Online Banking' : 'Bank Mahsulotlari'),
            confidence: 0.98
          }
        ];
      }

      const newItem: KnowledgeItem = {
        id: `kb-${Date.now()}`,
        sourceName: effectiveTitle,
        type: jobType === 'url' ? 'URL' : (jobType === 'rawText' ? 'Raw Text' : 'Document'),
        fileFormat: format,
        dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Completed',
        faqCount: extractedFaqs.length,
        summary: extractedSummary,
        faqs: extractedFaqs,
        contentSnippet: (cleanSnippetText || fileContent || rawText || (jobType === 'url' ? `URL: ${url}` : '')).slice(0, 25000)
      };

      // 1. Update UI state immediately
      onAddKnowledgeItem(newItem);

      // 2. Persist to Firestore database (accessible to any device/user)
      saveKnowledgeItemToDb(newItem).catch((dbErr) => {
        console.warn('Firestore persistence async save:', dbErr);
      });

      // 3. Reset and Close Modal
      handleResetAndClose();
    } catch (error) {
      console.error('Training job failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">KDB Bank AI Train & Knowledge</h2>
              <p className="text-xs text-slate-500">O'qitish: Fayl yuklash, matnli o'zgarishlar kiritish yoki veb-sahifa indeksi</p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Job Type Selector */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setJobType('document')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              jobType === 'document'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-800 font-bold shadow-xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 mb-1 text-indigo-600" />
            <div className="font-semibold">Hujjat Yuklash</div>
            <div className="text-[10px] text-slate-500 font-normal mt-0.5">PDF, JSON, CSV, TXT</div>
          </button>

          <button
            type="button"
            onClick={() => setJobType('rawText')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              jobType === 'rawText'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-800 font-bold shadow-xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-4 h-4 mb-1 text-indigo-600" />
            <div className="font-semibold">Matnli O'qitish</div>
            <div className="text-[10px] text-slate-500 font-normal mt-0.5">Qoida & O'zgarishlar</div>
          </button>

          <button
            type="button"
            onClick={() => setJobType('url')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              jobType === 'url'
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-800 font-bold shadow-xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4 mb-1 text-indigo-600" />
            <div className="font-semibold">Veb-sayt Crawler</div>
            <div className="text-[10px] text-slate-500 font-normal mt-0.5">kdb.uz sahifalari</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mavzu yoki Manba Nomi {jobType === 'document' && selectedFile && !title ? '(Fayl nomidan olinadi)' : ''}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                jobType === 'rawText'
                  ? "Masalan: Valyuta bo'limi pochtasi yangilanishi yoki Yangi kredit shartlari"
                  : selectedFile ? selectedFile.name : "Masalan: KDB Bank 2026 Xizmatlar va Tariflar Nizomi"
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {jobType === 'document' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faylni tanlang (PDF, JSON, CSV, TXT)
              </label>
              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-2">
                {selectedFile ? (
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                    <FileCheck className="w-4 h-4" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center">
                    KDB Bank PDF hisobotlari, FAQ JSON fayllari yoki matnli hujjatlarni tanlang
                  </p>
                )}
                <input
                  type="file"
                  accept=".pdf,.json,.csv,.txt"
                  required={!selectedFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && !title) {
                      setTitle(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            </div>
          )}

          {jobType === 'rawText' && (
            <div className="space-y-3">
              {/* Quick Template Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Tayyor Namunalar (Bir marta bosib to'ldirish):</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Tezkor shablon</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate('email_update')}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200/80 cursor-pointer"
                  >
                    📧 Pochta / Aloqa o'zgarishi
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('rate_update')}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200/80 cursor-pointer"
                  >
                    📈 Foiz stavkalari o'zgarishi
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('qa_sample')}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200/80 cursor-pointer"
                  >
                    💬 Savol-Javob (Q&A)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('policy_change')}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200/80 cursor-pointer"
                  >
                    📋 Yangi Tartib / Nizom
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  O'qitish Matni / Yangi Qoida va Rekvizitlar:
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Fayldagi ma'lumotlar o'zgargan bo'lsa yoki yangi qoida kiritmoqchi bo'lsangiz matnni shu yerga yozing:\n\nMasalan:\nDiqqat: Tashqi savdo shartnomalari endi yangi ccd-updated@kdb.uz manziliga yuborilishi lozim.\nYoki Savol: ... Javob: ... shaklida kiritishingiz mumkin.`}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Maslahat: Matnli o'qitish eski fayllardagi ma'lumotlarni to'ldirish yoki o'zgargan rekvizitlarni bir zumda AI xotirasiga kiritish uchun juda qulay.
                </p>
              </div>
            </div>
          )}

          {jobType === 'url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                KDB Bank Veb-sayti URL manzili
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://kdb.uz/uz/interactive-services/exchange-rates"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetAndClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Indekslash & Modelni O'qitish...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>O'qitishni Boshlash (Train)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
