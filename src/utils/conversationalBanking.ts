import { BankAccount, BankTransaction, ComplianceCheckData, TransferPayload, SavedBeneficiary } from '../types';

export const INITIAL_USER_ACCOUNTS: BankAccount[] = [
  {
    id: 'ACC-UZS-01',
    name: 'UZS Asosiy Jamg\'arma Hisobi',
    accountNumber: '20208000900123456001',
    balance: 48750000,
    currency: 'UZS',
    type: 'Checking',
    cardMask: '8600 •••• •••• 9124',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'ACC-USD-02',
    name: 'USD Xalqaro MasterCard (KDB)',
    accountNumber: '20206840300987654002',
    balance: 3850,
    currency: 'USD',
    type: 'Card',
    cardMask: '5440 •••• •••• 3381',
    color: 'from-emerald-600 to-teal-700'
  },
  {
    id: 'ACC-CORP-03',
    name: 'KDB Biznes & Korporativ Hisob',
    accountNumber: '20208000500876543003',
    balance: 142600000,
    currency: 'UZS',
    type: 'Corporate',
    cardMask: '9860 •••• •••• 7740',
    color: 'from-slate-800 to-slate-900'
  },
  {
    id: 'ACC-HUMO-04',
    name: 'Humo To\'lov Kartasi',
    accountNumber: '20208000100456789004',
    balance: 6400000,
    currency: 'UZS',
    type: 'Card',
    cardMask: '9860 •••• •••• 1158',
    color: 'from-orange-500 to-amber-600'
  }
];

export const INITIAL_SAVED_BENEFICIARIES: SavedBeneficiary[] = [
  {
    id: 'ben-1',
    name: 'Akmal Karimov',
    cardOrAccount: '8600 4912 3018 7741',
    type: 'Uzcard',
    bankName: 'KDB Bank / Milliy Kliring',
    avatarColor: 'bg-indigo-600',
    lastUsed: 'Bugun, 08:30'
  },
  {
    id: 'ben-2',
    name: 'Apex Logistics MChJ',
    cardOrAccount: '20208000700443322001',
    type: 'Account',
    bankName: 'KDB Bank Korporativ Filiali',
    avatarColor: 'bg-slate-700',
    lastUsed: 'Kecha, 16:45'
  },
  {
    id: 'ben-3',
    name: 'Dilshod Alimov',
    cardOrAccount: '9860 1204 8832 9901',
    type: 'Humo',
    bankName: 'Humo To\'lov Tizimi',
    avatarColor: 'bg-amber-600',
    lastUsed: '28 Avgust'
  },
  {
    id: 'ben-4',
    name: 'Elena Smirnova',
    cardOrAccount: '5440 2209 1145 3388',
    type: 'MasterCard',
    bankName: 'KDB Bank Xalqaro',
    avatarColor: 'bg-emerald-600',
    lastUsed: '25 Avgust'
  },
  {
    id: 'ben-5',
    name: 'Shaxnoza Rahimova',
    cardOrAccount: '8600 5501 9920 1432',
    type: 'Uzcard',
    bankName: 'Milliy Bank (NBU)',
    avatarColor: 'bg-purple-600',
    lastUsed: '20 Avgust'
  }
];

export function getSavedBeneficiaries(): SavedBeneficiary[] {
  try {
    const saved = localStorage.getItem('kdb_saved_beneficiaries');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error
  }
  return INITIAL_SAVED_BENEFICIARIES;
}

export function saveBeneficiary(newBen: Omit<SavedBeneficiary, 'id'> & { id?: string }): SavedBeneficiary {
  const current = getSavedBeneficiaries();
  
  // Clean card/account string for comparison
  const cleanInput = newBen.cardOrAccount.replace(/\s+/g, '');
  
  // Check if already exists by card or name
  const existingIndex = current.findIndex(
    b => b.cardOrAccount.replace(/\s+/g, '') === cleanInput || 
         (b.name.trim().toLowerCase() === newBen.name.trim().toLowerCase() && newBen.name.trim().length > 2)
  );

  const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-blue-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const formattedBeneficiary: SavedBeneficiary = {
    id: newBen.id || (existingIndex >= 0 ? current[existingIndex].id : `ben-${Date.now()}`),
    name: newBen.name.trim(),
    cardOrAccount: formatCardOrAccount(newBen.cardOrAccount),
    type: newBen.type || detectCardOrAccountType(newBen.cardOrAccount),
    bankName: newBen.bankName || (newBen.cardOrAccount.startsWith('20208') ? 'KDB Bank Hisob' : 'Milliy To\'lov Shlyuzi'),
    avatarColor: (existingIndex >= 0 && current[existingIndex].avatarColor) ? current[existingIndex].avatarColor : randomColor,
    lastUsed: 'Hozirgina'
  };

  let updated: SavedBeneficiary[];
  if (existingIndex >= 0) {
    // Update existing and move to front
    updated = [
      formattedBeneficiary,
      ...current.filter((_, i) => i !== existingIndex)
    ];
  } else {
    // Prepend new beneficiary
    updated = [formattedBeneficiary, ...current];
  }

  try {
    localStorage.setItem('kdb_saved_beneficiaries', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save beneficiary to storage:', e);
  }

  return formattedBeneficiary;
}

export function detectCardOrAccountType(numberStr: string): SavedBeneficiary['type'] {
  const clean = (numberStr || '').replace(/\D/g, '');
  if (clean.startsWith('8600')) return 'Uzcard';
  if (clean.startsWith('9860')) return 'Humo';
  if (clean.startsWith('5') || clean.startsWith('2')) {
    if (clean.length === 16 && (clean.startsWith('51') || clean.startsWith('52') || clean.startsWith('53') || clean.startsWith('54') || clean.startsWith('55'))) {
      return 'MasterCard';
    }
  }
  if (clean.startsWith('4') && clean.length === 16) return 'Visa';
  if (clean.length === 20 || clean.startsWith('20208')) return 'Account';
  return 'Other';
}

export function formatCardOrAccount(value: string): string {
  if (!value) return '';
  const clean = value.replace(/\s+/g, '');
  if (clean.length <= 16 && /^\d+$/.test(clean)) {
    // Format as 4-4-4-4
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }
  return value.trim();
}

export const EXCHANGE_RATES = {
  USD_UZS_BUY: 12820,
  USD_UZS_SELL: 12890,
  EUR_UZS_BUY: 13900,
  EUR_UZS_SELL: 14050,
  RUB_UZS_BUY: 140,
  RUB_UZS_SELL: 146
};

export function formatCurrency(amount: number, currency: string = 'UZS'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
  if (currency === 'EUR') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  }
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
}

export function parseBankingIntent(userMessage: string): {
  intent: 'balance' | 'transfer' | 'compliance' | 'exchange' | 'history' | 'general';
  data?: any;
} {
  const text = userMessage.trim();
  const lower = text.toLowerCase();

  // 1. Balance Intent
  if (
    lower.includes('balans') ||
    lower.includes('balance') ||
    lower.includes('hisobim') ||
    lower.includes('kartam') ||
    lower.includes('pulim qancha') ||
    lower.includes('hisoblarim') ||
    lower.includes('hisob holati') ||
    lower.includes('mablag') ||
    lower === '1' ||
    lower === 'balansni tekshirish'
  ) {
    return { intent: 'balance' };
  }

  // 2. Exchange Intent
  if (
    lower.includes('kurs') ||
    lower.includes('valyuta') ||
    lower.includes('ayirboshla') ||
    lower.includes('almashtir') ||
    lower.includes('exchange') ||
    lower.includes('convert') ||
    lower.includes('dollar kursi')
  ) {
    // Check if amount is specified
    const numMatch = text.match(/(\d[\d\s,.]*)\s*(\$|usd|dollar|so'm|som|uzs|evro|eur)?/i);
    let amount = 100;
    if (numMatch) {
      const cleanNum = parseFloat(numMatch[1].replace(/[\s,]/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) amount = cleanNum;
    }
    return { intent: 'exchange', data: { defaultAmount: amount } };
  }

  // 3. History Intent
  if (
    lower.includes('tarix') ||
    lower.includes('history') ||
    lower.includes('oxirgi to\'lov') ||
    lower.includes('oxirgi tolov') ||
    lower.includes('so\'nggi tranzaksiya') ||
    lower.includes('statement') ||
    lower.includes('cheklar')
  ) {
    return { intent: 'history' };
  }

  // 4. Compliance Check Intent
  if (
    (lower.includes('compliance') || lower.includes('aml') || lower.includes('tekshir') || lower.includes('sanction') || lower.includes('xavf')) &&
    !lower.includes('o\'tkaz') && !lower.includes('otkaz') && !lower.includes('send') && !lower.includes('transfer')
  ) {
    // Extract beneficiary if given e.g. "Apex Logistics ni compliancedan tekshir"
    let beneficiary = 'Akmal Karimov';
    const match = text.match(/(?:tekshir|haqida|uchun|kor(?:ish)?)\s*[:]?\s*([A-Za-z0-9\s'ʻ`]+)/i) ||
                  text.match(/([A-Za-z0-9\s'ʻ`]+?)\s*(?:ni|ning|ga)?\s*(?:compliance|aml|tekshir)/i);
    if (match && match[1] && match[1].trim().length > 2) {
      beneficiary = match[1].trim();
    }
    return { 
      intent: 'compliance', 
      data: runComplianceCheck(beneficiary, 5000000, 'UZS') 
    };
  }

  // 5. Transfer Intent (Natural Language regex)
  const isTransferWord = 
    lower.includes('o\'tkaz') ||
    lower.includes('otkaz') ||
    lower.includes('o‘tkaz') ||
    lower.includes('transfer') ||
    lower.includes('send') ||
    lower.includes('tashla') ||
    lower.includes('yubor') ||
    lower.includes('to\'la') ||
    lower.includes('tola') ||
    lower.includes('pay') ||
    lower.includes('o\'tkazish') ||
    lower.includes('pul o\'tkaz');

  if (isTransferWord) {
    // Try to extract amount: e.g. "1 500 000 so'm", "1500000", "$500", "500$"
    let amount = 1500000;
    let currency: 'UZS' | 'USD' = 'UZS';

    // Dollar check
    const dollarMatch = text.match(/(?:\$|usd|dollar)\s*([\d\s,.]+)|([\d\s,.]+)\s*(?:\$|usd|dollar)/i);
    if (dollarMatch) {
      const val = dollarMatch[1] || dollarMatch[2];
      const parsed = parseFloat(val.replace(/[\s,]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        currency = 'USD';
      }
    } else {
      // UZS check: match numbers like 1 500 000, 500000, 200.000
      const uzsMatch = text.match(/([\d]{1,3}(?:[\s.,]\d{3})*|\d+)\s*(?:so['‘`]?m|uzs|sum)?/i);
      if (uzsMatch) {
        const cleaned = uzsMatch[1].replace(/[\s.,]/g, '');
        const parsed = parseInt(cleaned, 10);
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed;
          currency = 'UZS';
        }
      }
    }

    // Extract potential card or account number: 16 digits (e.g. 8600 1234 5678 9012) or 20 digits
    const cardMatch = text.match(/(?:8600|9860|5\d{3}|4\d{3})\s*(?:\d{4}\s*){3}/) || 
                      text.match(/\b(\d{16})\b/) ||
                      text.match(/\b(20208\d{15})\b/);

    let cardOrAccount = '';
    if (cardMatch) {
      cardOrAccount = formatCardOrAccount(cardMatch[0]);
    }

    const savedBeneficiaries = getSavedBeneficiaries();

    // Try to match against saved beneficiaries first
    let matchedBen = savedBeneficiaries.find(b => {
      const matchName = b.name.toLowerCase();
      return lower.includes(matchName.toLowerCase()) || 
             (cardOrAccount && b.cardOrAccount.replace(/\s+/g, '') === cardOrAccount.replace(/\s+/g, ''));
    });

    let beneficiary = matchedBen ? matchedBen.name : 'Akmal Karimov';
    if (!matchedBen) {
      const nameMatch = 
        text.match(/(?:to|ga|uchun|karta)\s*([A-Za-z0-9\s'ʻ`]+?)(?:\s*(?:ga|ga|nomiga|\d|$|\.))/i) ||
        text.match(/^([A-Za-z\s'ʻ`]+?)\s*(?:ga|uchun)\s*/i);

      if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
        const cleanName = nameMatch[1].trim().replace(/\b(so'm|som|uzs|dollar|usd|transfer|otkaz|o'tkaz|karta|kartasiga|hisobiga|to'la|tola)\b/gi, '').trim();
        if (cleanName.length > 2) {
          beneficiary = cleanName;
        }
      }
    }

    if (matchedBen && !cardOrAccount) {
      cardOrAccount = matchedBen.cardOrAccount;
    } else if (!cardOrAccount) {
      cardOrAccount = currency === 'USD' ? '5440 2209 1145 3388' : '8600 4912 3018 7741';
    }

    const compliance = runComplianceCheck(beneficiary, amount, currency);

    const transferPayload: TransferPayload = {
      id: `TRX-${Date.now().toString().slice(-6)}`,
      fromAccount: currency === 'USD' ? 'ACC-USD-02' : 'ACC-UZS-01',
      toBeneficiary: beneficiary,
      toCardOrAccount: cardOrAccount,
      amount,
      currency,
      purpose: `${beneficiary} hisobiga tezkor to'lov`,
      commission: 0,
      status: 'Draft',
      compliance
    };

    return {
      intent: 'transfer',
      data: transferPayload
    };
  }

  return { intent: 'general' };
}

export function runComplianceCheck(beneficiary: string, amount: number, currency: string): ComplianceCheckData {
  const lowerName = beneficiary.toLowerCase();
  
  // Simulated sanctions/high risk keywords
  const isHighRisk = lowerName.includes('unknown') || lowerName.includes('offshore') || lowerName.includes('crypto_anon');
  const isLargeAmount = (currency === 'UZS' && amount >= 50000000) || (currency === 'USD' && amount >= 5000);

  let riskScore = 2; // Default super clean score (2/100)
  if (isLargeAmount) riskScore += 12;
  if (isHighRisk) riskScore += 75;

  return {
    beneficiary,
    amount,
    currency,
    riskScore,
    amlStatus: riskScore < 30 ? 'Passed' : (riskScore < 70 ? 'Review' : 'Flagged'),
    sanctionCheck: isHighRisk ? 'Match Found' : 'Clean',
    kycLevel: 'Verified',
    limitStatus: 'Approved',
    notes: [
      'OFAC / UN / Central Bank of Uzbekistan Sanction list: 0 matches found (Clean)',
      `Beneficiary identity check: ${beneficiary} verified via National Interbank ID`,
      `AML Pattern Analysis: Routine behavioral score (${riskScore}/100 - Low Risk)`,
      'Daily transaction limit validation: Within standard authorized limits (100,000,000 UZS)'
    ]
  };
}
