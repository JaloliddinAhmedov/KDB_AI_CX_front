export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/["'{}[\]]/g, ' ')
    .replace(/\b(faqId|questionUz|answerUz|questionRu|answerRu|questionEn|answerEn)\b:?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseJsonFaqsFromString(rawText: string): any[] {
  if (!rawText) return [];
  const faqs: any[] = [];
  
  try {
    const trimmed = rawText.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.faqs) ? parsed.faqs : [parsed]);
      for (const item of items) {
        const qUz = (item.questionUz || item.question_uz || item.question || item.q || '').trim();
        const aUz = (item.answerUz || item.answer_uz || item.answer || item.a || '').trim();
        const qRu = (item.questionRu || item.question_ru || '').trim();
        const aRu = (item.answerRu || item.answer_ru || '').trim();
        const qEn = (item.questionEn || item.question_en || '').trim();
        const aEn = (item.answerEn || item.answer_en || '').trim();

        if (qUz && aUz) faqs.push({ q: qUz, a: aUz, lang: 'uz' });
        if (qRu && aRu) faqs.push({ q: qRu, a: aRu, lang: 'ru' });
        if (qEn && aEn) faqs.push({ q: qEn, a: aEn, lang: 'en' });
      }
    }
  } catch {
    // ignore
  }

  if (faqs.length === 0) {
    const uzRegex = /"questionUz"\s*:\s*"([^"]+)"[\s\S]*?"answerUz"\s*:\s*"([^"]+)"/g;
    let match;
    while ((match = uzRegex.exec(rawText)) !== null) {
      const q = match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
      const a = match[2].replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
      if (q && a) faqs.push({ q, a, lang: 'uz' });
    }
  }

  return faqs;
}

export function generateClientSideAnswer(userMessage: string, contextText: string): string {
  const query = userMessage.trim();
  const lowerQuery = query.toLowerCase();

  if (!contextText || contextText.trim().length === 0) {
    return `Assalomu alaykum! Men KDB Bank O'zbekiston AI assistentiman. Bank xizmatlari, kredit stavkalari, depozitlar va tariflar bo'yicha qanday savollaringiz bor?`;
  }

  const allFaqs: { doc: string; q: string; a: string }[] = [];
  const jsonFaqs = parseJsonFaqsFromString(contextText);
  jsonFaqs.forEach(f => {
    allFaqs.push({ doc: "KDB Bank Rasmiy FAQ", q: f.q, a: f.a });
  });

  // Extract from text format (Q: ... A: ... or bullet updates)
  const lines = contextText.split('\n');
  let currentQ = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^(?:Q:|\d+\.\s*Q:|Savol\s*\(UZ\):|Вопрос\s*\(RU\):|Question\s*\(EN\):|Savol:)\s*/i)) {
      currentQ = trimmed.replace(/^(?:Q:|\d+\.\s*Q:|Savol\s*\(UZ\):|Вопрос\s*\(RU\):|Question\s*\(EN\):|Savol:)\s*/i, '').trim();
    } else if (trimmed.match(/^(?:A:|\d+\.\s*A:|Javob\s*\(UZ\):|Ответ\s*\(RU\):|Answer\s*\(EN\):|Javob:)\s*/i) && currentQ) {
      const currentA = trimmed.replace(/^(?:A:|\d+\.\s*A:|Javob\s*\(UZ\):|Ответ\s*\(RU\):|Answer\s*\(EN\):|Javob:)\s*/i, '').trim();
      allFaqs.push({ doc: "KDB Bank Hujjati", q: currentQ, a: currentA });
      currentQ = '';
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('[DIQQAT') || trimmed.startsWith('[YANGI')) {
      // Direct update rule bullet point
      const ruleText = trimmed.replace(/^[-•]\s*/, '').trim();
      if (ruleText.length > 15) {
        allFaqs.push({ doc: "KDB Bank Qoida Yangilanishi", q: ruleText, a: ruleText });
      }
    }
  }

  const stopWords = new Set(['va', 'bu', 'u', 'bir', 'bilan', 'uchun', 'haqida', 'kerak', 'mumkin', 'edi', 'ham', 'yoki', 'nima', 'qanday', 'qancha', 'qachon', 'qayerda', 'qaysi', 'ga', 'ni', 'da', 'dan']);
  const queryTokens = lowerQuery
    .replace(/[?!,.:;()"'`]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  let bestFaq: { doc: string; q: string; a: string; score: number } | null = null;

  for (const faq of allFaqs) {
    let score = 0;
    const cleanQ = faq.q.toLowerCase();
    const cleanA = faq.a.toLowerCase();

    for (const token of queryTokens) {
      if (cleanQ.includes(token)) score += 5;
      if (cleanA.includes(token)) score += 2;
    }

    if (cleanQ.includes(lowerQuery) || lowerQuery.includes(cleanQ)) {
      score += 20;
    }

    if ((lowerQuery.includes('tashqi savdo') || lowerQuery.includes('shartnoma')) && (cleanQ.includes('tashqi savdo') || cleanA.includes('ccd@kdb.uz'))) {
      score += 15;
    }
    if (lowerQuery.includes('pochta') && (cleanA.includes('@') || cleanQ.includes('pochta') || cleanQ.includes('mail'))) {
      score += 10;
    }

    if (score > 0 && (!bestFaq || score > bestFaq.score)) {
      bestFaq = { doc: faq.doc, q: faq.q, a: faq.a, score };
    }
  }

  if (bestFaq && bestFaq.score >= 3) {
    const cleanAns = sanitizeText(bestFaq.a);
    return `**KDB Bank O'zbekiston:**\n\n${cleanAns}\n\n*Qo'shimcha ma'lumotlar uchun KDB Bank O'zbekiston rasmiy sayti (www.kdb.uz) yoki Call Center (78 120 80 00) orqali bog'lanishingiz mumkin.*`;
  }

  return `**KDB Bank O'zbekiston:**\n\nSizning so'rovingiz bo'yicha bank bazasidan ma'lumot qidirildi. Aniqroq ma'lumot olish uchun savolingizni to'liqroq yozing yoki rasmiy sayt (www.kdb.uz) orqali ma'lumot oling.`;
}
