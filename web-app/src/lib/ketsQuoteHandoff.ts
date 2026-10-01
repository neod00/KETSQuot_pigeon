export const KETS_QUOTE_HANDOFF_KEY = 'kets_quote_to_contract';

export interface KetsQuoteHandoff {
    quotType: '1' | '2' | '3';
    companyName: string;
    contactPerson: string;
    docId: string;
    issueDate: string;
    verificationTarget: string;
    invYear: string;
    invS1Days: string;
    invS2Days: string;
    invS3Days: string;
    invExpenses: number;
    invFinalCost: number;
    mpYear: string;
    mpS1Days: string;
    mpS2Days: string;
    mpS3Days: string;
    mpExpenses: number;
    mpFinalCost: number;
    vatType: string;
    hqAddress: string;
    businessRegistration: string;
    industryType: string;
    contractContact: string;
    materiality: string;
}

const asNumber = (value: string | number) => Number(value) || 0;

export function mapKetsQuoteToContract(quote: KetsQuoteHandoff) {
    const isPlan = quote.quotType === '2';
    const isCombined = quote.quotType === '3';
    const primary = isPlan
        ? [quote.mpS1Days, quote.mpS2Days, quote.mpS3Days, quote.mpExpenses, quote.mpFinalCost]
        : [quote.invS1Days, quote.invS2Days, quote.invS3Days, quote.invExpenses, quote.invFinalCost];

    const finalCost = (value: string | number) => Math.floor(asNumber(value) * (quote.vatType === '포함' ? 1.1 : 1));

    return {
        contractType: isPlan ? 'plan' as const : isCombined ? 'combined' as const : 'statement' as const,
        companyName: quote.companyName,
        proposalNo: quote.docId,
        sourceQuoteNo: quote.docId,
        proposalDate: quote.issueDate,
        hqAddress: quote.hqAddress,
        targetSites: quote.verificationTarget || quote.hqAddress,
        ghgDeclarationPeriod: quote.invYear,
        planTargetYear: quote.mpYear,
        materiality: quote.materiality,
        auditRate: 1050000,
        s1Days: asNumber(primary[0]),
        s2Days: asNumber(primary[1]),
        s3Days: asNumber(primary[2]),
        expenses: asNumber(primary[3]),
        manualFinalCost: finalCost(primary[4]),
        isManualCost: true,
        planS1Days: asNumber(quote.mpS1Days),
        planS2Days: asNumber(quote.mpS2Days),
        planS3Days: asNumber(quote.mpS3Days),
        planExpenses: asNumber(quote.mpExpenses),
        planManualFinalCost: finalCost(quote.mpFinalCost),
        planIsManualCost: isCombined,
        vatType: quote.vatType,
        businessRegistration: quote.businessRegistration,
        clientContact: quote.contractContact || quote.contactPerson,
        industryType: quote.industryType,
    };
}
