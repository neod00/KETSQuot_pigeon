'use client';

export const P827_SCOPE3_CATEGORIES = [
    '구매한 제품 & 서비스 Purchased goods and services',
    '자본재 Capital goods',
    'Scope 1이나 2에 포함되지 않는 연료 & 에너지 관련 활동 Fuel- and energy-related activities',
    '업스트림 운송 & 유통 Upstream transportation and distribution',
    '사업장에서 발생된 폐기물 Waste generated in operations',
    '출장 Business travel',
    '직원 출퇴근 Employee commuting',
    '업스트림 임차 자산 Upstream leased assets',
    '다운스트림 운송 & 유통 Downstream transportation and distribution',
    '판매된 제품의 가공 Processing of sold products',
    '판매된 제품의 사용 Use of sold products',
    '판매된 제품의 폐기 End-of-life treatment of sold products',
    '다운스트림 임대 자산 Downstream leased assets',
    '프랜차이즈 Franchises',
    '투자 Investments (Sovereign debt)',
] as const;

export type P827VerificationStandard = 'isae' | 'iso14064';

export const P827_VERIFICATION_STANDARD_LABELS: Record<P827VerificationStandard, string> = {
    isae: 'INTERNATIONAL STANDARD ON ASSURANCE ENGAGEMENTS (ISAE) 3000 / INTERNATIONAL STANDARD ON ASSURANCE ENGAGEMENTS (ISAE) 3410',
    iso14064: 'ISO 14064-3:2019 (온실가스선언에 대한 타당성 평가 및 검증을 위한 사용규칙 및 지침)',
};

export interface P827QuoteOutputData {
    companyName: string;
    serviceDescription: string;
    proposalDateLong: string;
    proposalNo: string;
    contactName: string;
    contactTitle: string;
    contactPhone: string;
    contactMobile: string;
    contactEmail: string;
    verificationYear: string;
    verificationStandard: P827VerificationStandard;
    assuranceLevel: string;
    materialityLevel: string;
    targetSites: string;
    scope3Categories: boolean[];
    applicationFeeText: string;
    stage1Days: string;
    stage1Cost: string;
    stage2Days: string;
    stage2Cost: string;
    stage3Days: string;
    stage3Cost: string;
    expenses: string;
    totalDays: string;
    totalCost: string;
    finalCost: string;
    vatType: string;
    auditRate: string;
    quoteValidityDays: string;
}

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const W14 = 'http://schemas.microsoft.com/office/word/2010/wordml';
const TEMPLATE_PATH = '/templates/LRQA_P827_GHG_Quote_Template.docx';

const safeFilePart = (value: string) => (value || '기업명').replace(/[/\\?%*:|"<>]/g, '-');
const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function setParagraphText(paragraphs: Element[], index: number, value: string) {
    const paragraph = paragraphs[index];
    if (!paragraph) throw new Error(`P827 quote template paragraph ${index} is missing.`);
    const texts = Array.from(paragraph.getElementsByTagNameNS(W, 't'));
    if (!texts.length) throw new Error(`P827 quote template paragraph ${index} has no text node.`);
    texts[0].textContent = value || ' ';
    texts.slice(1).forEach((text) => { text.textContent = ''; });
}

function setParagraphLines(paragraphs: Element[], index: number, lines: string[]) {
    const paragraph = paragraphs[index];
    if (!paragraph) return;
    const events: Array<{ type: 'text'; node: Element } | { type: 'break' }> = [];
    const walk = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.namespaceURI === W && element.localName === 'br') {
                events.push({ type: 'break' });
                return;
            }
            if (element.namespaceURI === W && element.localName === 't') {
                events.push({ type: 'text', node: element });
                return;
            }
        }
        Array.from(node.childNodes).forEach(walk);
    };
    walk(paragraph);
    let lineIndex = 0;
    const assigned = new Set<number>();
    events.forEach((event) => {
        if (event.type === 'break') {
            lineIndex += 1;
            return;
        }
        if (!assigned.has(lineIndex)) {
            event.node.textContent = lines[lineIndex] || ' ';
            assigned.add(lineIndex);
        } else {
            event.node.textContent = '';
        }
    });
}

function updateVerificationDropdown(xml: XMLDocument, value: string) {
    const sdts = Array.from(xml.getElementsByTagNameNS(W, 'sdt'));
    for (const sdt of sdts) {
        const tag = sdt.getElementsByTagNameNS(W, 'tag')[0];
        if (tag?.getAttributeNS(W, 'val') !== 'verification_standard') continue;
        const textNodes = Array.from(sdt.getElementsByTagNameNS(W, 't'));
        if (textNodes.length) {
            textNodes[0].textContent = value;
            textNodes.slice(1).forEach((node) => { node.textContent = ''; });
        }
        break;
    }
}

function updateScope3Checkboxes(xml: XMLDocument, selected: boolean[]) {
    const sdts = Array.from(xml.getElementsByTagNameNS(W, 'sdt')).filter(
        (sdt) => sdt.getElementsByTagNameNS(W14, 'checkbox').length > 0,
    );
    if (sdts.length !== P827_SCOPE3_CATEGORIES.length) {
        throw new Error(`Scope 3 checkbox count mismatch: ${sdts.length}`);
    }
    sdts.forEach((sdt, index) => {
        const isChecked = Boolean(selected[index]);
        const checked = sdt.getElementsByTagNameNS(W14, 'checked')[0];
        checked?.setAttributeNS(W14, 'w14:val', isChecked ? '1' : '0');
        const texts = Array.from(sdt.getElementsByTagNameNS(W, 't'));
        if (texts.length) {
            texts[0].textContent = isChecked ? '☒' : '☐';
            texts.slice(1).forEach((node) => { node.textContent = ''; });
        }
    });
}

function patchQuoteDocumentXml(sourceXml: string, data: P827QuoteOutputData) {
    const xml = new DOMParser().parseFromString(sourceXml, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length) {
        throw new Error('P827 quote template XML could not be parsed.');
    }
    const paragraphs = Array.from(xml.getElementsByTagNameNS(W, 'p'));
    if (paragraphs.length < 601) throw new Error('Unexpected P827 quote template structure.');

    const selectedCount = data.scope3Categories.filter(Boolean).length;
    const targetLines = (data.targetSites || '본사 및 대상 사업장').split(/\r?\n/).filter(Boolean);
    const verificationStandard = P827_VERIFICATION_STANDARD_LABELS[data.verificationStandard];

    setParagraphText(paragraphs, 6, data.companyName || '고객사명');
    setParagraphText(paragraphs, 8, data.serviceDescription);
    setParagraphText(paragraphs, 11, `일자 : ${data.proposalDateLong}`);
    setParagraphText(paragraphs, 13, `${data.contactName} ${data.contactTitle}`.trim());
    setParagraphText(paragraphs, 14, `No. ${data.proposalNo}`);
    setParagraphText(paragraphs, 15, `T ${data.contactPhone}`);
    setParagraphLines(paragraphs, 16, [`H ${data.contactMobile}`, `E ${data.contactEmail}`, 'W lrqa.com']);

    setParagraphText(paragraphs, 76, `${data.verificationYear}년도 온실가스 Scope 1,2,3 제3자 검증(1년)`);
    setParagraphText(paragraphs, 84, verificationStandard);
    setParagraphText(paragraphs, 86, `Scope 1,2,3 : ${data.assuranceLevel}`);
    setParagraphText(paragraphs, 90, data.materialityLevel);
    setParagraphText(paragraphs, 94, `1) Scope 1,2 : ${targetLines[0] || '본사 및 대상 사업장'}`);
    setParagraphText(paragraphs, 95, targetLines[1] ? `: ${targetLines.slice(1).join(', ')}` : ' ');
    setParagraphText(paragraphs, 96, `2) Scope 3 : 총 ${selectedCount}개 카테고리(고객 제공 목록 기준)`);
    setParagraphText(paragraphs, 132, `☞ 세부 검토대상 ${selectedCount}개 카테고리는 착수자료에서 확정`);

    setParagraphText(paragraphs, 141, data.applicationFeeText);
    setParagraphText(paragraphs, 144, `${data.stage1Days} days`);
    setParagraphText(paragraphs, 145, data.stage1Cost);
    setParagraphText(paragraphs, 148, `${data.stage2Days} days`);
    setParagraphText(paragraphs, 149, data.stage2Cost);
    setParagraphText(paragraphs, 152, `${data.stage3Days} days`);
    setParagraphText(paragraphs, 153, data.stage3Cost);
    setParagraphText(paragraphs, 157, data.expenses);
    setParagraphText(paragraphs, 158, '출장비 및 기타 제경비 포함');
    setParagraphText(paragraphs, 160, `${data.totalDays} days`);
    setParagraphText(paragraphs, 161, data.totalCost);
    setParagraphText(paragraphs, 162, `VAT ${data.vatType}`);
    setParagraphText(paragraphs, 164, `${data.totalDays} days`);
    setParagraphText(paragraphs, 165, data.finalCost);
    setParagraphText(paragraphs, 166, `VAT ${data.vatType}`);
    setParagraphText(paragraphs, 169, `상기 심사 요율은 ${data.auditRate}원/MD이며, 최종 금액은 상호 협의에 따라 조정될 수 있습니다.`);
    setParagraphText(paragraphs, 170, `부가가치세(VAT)는 ${data.vatType}입니다.`);
    setParagraphText(paragraphs, 171, '교통비, 숙박비, 심사원 일비 등 제경비는 상기 제안금액에 포함되어 있습니다.');
    setParagraphText(paragraphs, 172, `검증은 ${data.assuranceLevel}, 중요성 ${data.materialityLevel} 기준으로 수행합니다.`);
    setParagraphText(paragraphs, 174, `본 견적의 유효기간은 제안 발행일로부터 ${data.quoteValidityDays}일입니다.`);

    [567, 597].forEach((index) => setParagraphText(paragraphs, index, `${data.contactName} ${data.contactTitle}`.trim()));
    [568, 598].forEach((index) => setParagraphText(paragraphs, index, `T ${data.contactPhone}`));
    [569, 599].forEach((index) => setParagraphText(paragraphs, index, `H ${data.contactMobile}`));
    [570, 600].forEach((index) => setParagraphText(paragraphs, index, `E ${data.contactEmail}`));

    updateVerificationDropdown(xml, verificationStandard);
    updateScope3Checkboxes(xml, data.scope3Categories);
    return new XMLSerializer().serializeToString(xml);
}

export async function generateP827QuoteDocx(data: P827QuoteOutputData) {
    const [{ default: PizZip }, { saveAs }] = await Promise.all([
        import('pizzip'),
        import('file-saver'),
    ]);
    const response = await fetch(TEMPLATE_PATH);
    if (!response.ok) throw new Error(`P827 quote template load failed (${response.status}).`);
    const zip = new PizZip(await response.arrayBuffer());
    const documentXml = zip.file('word/document.xml')?.asText();
    if (!documentXml) throw new Error('word/document.xml is missing from P827 quote template.');
    zip.file('word/document.xml', patchQuoteDocumentXml(documentXml, data));
    const blob = zip.generate({
        type: 'blob',
        compression: 'DEFLATE',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const date = data.proposalDateLong.replace(/[^0-9]/g, '');
    saveAs(blob, `LRQA_${safeFilePart(data.companyName)}_온실가스 배출량 Scope 1,2,3 제3자 검증비용 제안서_${date}.docx`);
}

const overlay = (left: number, top: number, html: string, extra = '') =>
    `<div class="overlay" style="left:${left}%;top:${top}%;${extra}">${html}</div>`;

function quotePage(data: P827QuoteOutputData, page: number) {
    const selected = data.scope3Categories.map((value) => value ? '☒' : '☐');
    const count = data.scope3Categories.filter(Boolean).length;
    const targetLines = (data.targetSites || '본사 및 대상 사업장').split(/\r?\n/).filter(Boolean);
    let overlays = '';
    if (page === 1) {
        overlays += overlay(7.2, 24.2, escapeHtml(data.companyName || '고객사명'), 'font-size:16pt;font-weight:700;');
        overlays += overlay(7.2, 28.4, escapeHtml(data.serviceDescription), 'font-size:13pt;font-weight:700;');
        overlays += overlay(7.2, 32.7, `일자 : ${escapeHtml(data.proposalDateLong)}`, 'font-size:10pt;');
        overlays += overlay(7.2, 35.5, `${escapeHtml(data.contactName)} ${escapeHtml(data.contactTitle)}<br>No. ${escapeHtml(data.proposalNo)}<br>T ${escapeHtml(data.contactPhone)}<br>H ${escapeHtml(data.contactMobile)}<br>E ${escapeHtml(data.contactEmail)}<br>W lrqa.com`, 'font-size:9pt;line-height:1.45;');
    }
    if (page === 3) {
        overlays += overlay(26.0, 21.5, `${escapeHtml(data.verificationYear)}년도 온실가스 Scope 1,2,3 제3자 검증(1년)`, 'font-size:9.5pt;');
        overlays += overlay(26.0, 30.4, escapeHtml(P827_VERIFICATION_STANDARD_LABELS[data.verificationStandard]), 'font-size:8.5pt;width:66%;line-height:1.25;');
        overlays += overlay(26.0, 34.0, `Scope 1,2,3 : ${escapeHtml(data.assuranceLevel)}`, 'font-size:9pt;');
        overlays += overlay(26.0, 39.4, escapeHtml(data.materialityLevel), 'font-size:9pt;');
        overlays += overlay(26.0, 43.2, `1) Scope 1,2 : ${escapeHtml(targetLines[0] || '본사 및 대상 사업장')}`, 'font-size:8.8pt;');
        if (targetLines.length > 1) overlays += overlay(26.0, 45.1, `: ${escapeHtml(targetLines.slice(1).join(', '))}`, 'font-size:8.8pt;');
        overlays += overlay(26.0, 47.1, `2) Scope 3 : 총 ${count}개 카테고리(고객 제공 목록 기준)`, 'font-size:8.8pt;');
        const checkboxTops = [50.4, 52.15, 53.9, 56.8, 58.65, 60.4, 62.2, 64.0, 65.75, 67.55, 69.3, 71.05, 72.85, 74.6, 76.35];
        selected.forEach((glyph, index) => {
            overlays += overlay(76.15, checkboxTops[index], glyph, 'font-family:"Segoe UI Symbol","Arial Unicode MS",sans-serif;font-size:10pt;');
        });
        overlays += overlay(26.0, 78.7, `☞ 세부 검토대상 ${count}개 카테고리는 착수자료에서 확정`, 'font-size:8pt;');
    }
    if (page === 4) {
        const rows = [19.7, 22.2, 24.55, 26.95, 29.35, 31.7, 34.1];
        overlays += overlay(40.3, rows[0], '-', 'font-size:9pt;');
        overlays += overlay(58.5, rows[0], escapeHtml(data.applicationFeeText), 'font-size:9pt;');
        overlays += overlay(40.3, rows[1], `${escapeHtml(data.stage1Days)} days`, 'font-size:9pt;');
        overlays += overlay(58.5, rows[1], escapeHtml(data.stage1Cost), 'font-size:9pt;');
        overlays += overlay(40.3, rows[2], `${escapeHtml(data.stage2Days)} days`, 'font-size:9pt;');
        overlays += overlay(58.5, rows[2], escapeHtml(data.stage2Cost), 'font-size:9pt;');
        overlays += overlay(40.3, rows[3], `${escapeHtml(data.stage3Days)} days`, 'font-size:9pt;');
        overlays += overlay(58.5, rows[3], escapeHtml(data.stage3Cost), 'font-size:9pt;');
        overlays += overlay(58.5, rows[4], escapeHtml(data.expenses), 'font-size:9pt;');
        overlays += overlay(78.0, rows[4], '출장비 및 기타 제경비 포함', 'font-size:8pt;');
        overlays += overlay(40.3, rows[5], `${escapeHtml(data.totalDays)} days`, 'font-size:9pt;font-weight:700;');
        overlays += overlay(58.5, rows[5], escapeHtml(data.totalCost), 'font-size:9pt;font-weight:700;');
        overlays += overlay(78.0, rows[5], `VAT ${escapeHtml(data.vatType)}`, 'font-size:8pt;');
        overlays += overlay(40.3, rows[6], `${escapeHtml(data.totalDays)} days`, 'font-size:9pt;font-weight:700;');
        overlays += overlay(58.5, rows[6], escapeHtml(data.finalCost), 'font-size:9pt;font-weight:700;');
        overlays += overlay(78.0, rows[6], `VAT ${escapeHtml(data.vatType)}`, 'font-size:8pt;');
        const notes = [
            `상기 심사 요율은 ${data.auditRate}원/MD이며, 최종 금액은 상호 협의에 따라 조정될 수 있습니다.`,
            `부가가치세(VAT)는 ${data.vatType}입니다.`,
            '교통비, 숙박비, 심사원 일비 등 제경비는 상기 제안금액에 포함되어 있습니다.',
            `검증은 ${data.assuranceLevel}, 중요성 ${data.materialityLevel} 기준으로 수행합니다.`,
        ];
        overlays += overlay(8.0, 38.1, notes.map((note) => `•&nbsp; ${escapeHtml(note)}`).join('<br>'), 'font-size:8.2pt;line-height:1.55;width:86%;');
        overlays += overlay(7.2, 82.4, `본 견적의 유효기간은 제안 발행일로부터 ${escapeHtml(data.quoteValidityDays)}일입니다.`, 'font-size:8.5pt;width:88%;');
    }
    if (page === 9) {
        overlays += overlay(7.6, 16.4, `${escapeHtml(data.contactName)} ${escapeHtml(data.contactTitle)}<br><br>T ${escapeHtml(data.contactPhone)}<br>H ${escapeHtml(data.contactMobile)}<br>E ${escapeHtml(data.contactEmail)}`, 'font-size:11pt;font-weight:600;line-height:1.65;');
    }
    return `<section class="page"><img src="/templates/p827-quote-pages/page-${page}.png" alt=""><div class="layer">${overlays}</div></section>`;
}

export function printP827Quote(data: P827QuoteOutputData) {
    const title = `LRQA_${safeFilePart(data.companyName)}_온실가스 제3자 검증비용 제안서`;
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
        @page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#dbe2ea}.page{position:relative;width:210mm;height:297mm;margin:8mm auto;background:#fff;overflow:hidden;page-break-after:always}.page:last-child{page-break-after:auto}.page>img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}.layer{position:absolute;inset:0}.overlay{position:absolute;font-family:Arial,"Malgun Gothic",sans-serif;color:#111;white-space:normal}.overlay br{display:block}@media print{html,body{background:#fff}.page{margin:0;box-shadow:none}.overlay{-webkit-print-color-adjust:exact;print-color-adjust:exact}}@media screen{.page{box-shadow:0 4px 20px rgba(15,23,42,.2)}}
    </style></head><body>${Array.from({ length: 9 }, (_, i) => quotePage(data, i + 1)).join('')}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),700));<\/script></body></html>`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('팝업이 차단되었습니다. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}
