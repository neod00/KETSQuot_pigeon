import { StoredCbamApplication } from '@/lib/cbam';

const escapeXml = (str: string | number | undefined | null) => {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

export const generateP1173EnquiryDocx = async (app: StoredCbamApplication) => {
  if (typeof window === 'undefined') return;

  const [{ default: PizZip }, { default: saveAs }] = await Promise.all([
    import('pizzip'),
    import('file-saver'),
  ]);

  const templatePath = '/templates/P1173_CBAM_Client_Enquiry_Form_Template.docx';
  const response = await fetch(templatePath);
  if (!response.ok) throw new Error(`템플릿 파일을 찾을 수 없습니다: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();

  const zip = new PizZip(arrayBuffer);
  const rawXml = zip.file('word/document.xml')?.asText();
  if (!rawXml) throw new Error('문서 document.xml을 읽을 수 없습니다.');
  let xml: string = rawXml;

  const check = (condition: boolean) => (condition ? '☒' : '☐');

  const clientName = app.companyName || '';
  const contactName = app.contactName || '';
  const contactAddress = app.address || '';
  const country = app.country || '대한민국';
  const phone = app.phone || '';
  const email = app.email || '';
  const sites = app.sites || '';
  const consultant = app.notes?.includes('컨설턴트') ? app.notes : 'N/A';

  const isImporter = app.clientType === 'importer';
  const isOperator = app.clientType === 'operator';
  const objectiveText = `${check(isImporter)} To verify the Importer’s CBAM Declaration/ 수입자의 CBAM 신고서 검증\n${check(isOperator)} To verify the third country Operator’s CBAM report / 제3국 생산자의 CBAM 보고서 검증`;

  const isPre = app.serviceType === 'pre_verification';
  const isVerif = app.serviceType === 'verification';
  const isOther = app.serviceType === 'other';
  const serviceText = `${check(isPre)} Pre-Verification (Gap analysis)  ${check(isVerif)} Verification  ${check(isOther)} Other:`;

  const years = app.verificationYears || [];
  const yearsCol1 = ['2024', '2025', '2026', '2027']
    .map(y => `${check(years.includes(y))} ${y}`)
    .join('  ');
  const yearsCol2 = ['2028', '2029', '2030', '2031']
    .map(y => `${check(years.includes(y))} ${y}`)
    .join('  ');

  const goods = app.cbamGoods || [];
  const goodsCol1 = [
    `${check(goods.includes('시멘트') || goods.includes('Cement'))} Cement`,
    `${check(goods.includes('비료') || goods.includes('Fertilisers'))} Fertilisers`,
    `${check(goods.includes('알루미늄') || goods.includes('Aluminium'))} Aluminium`,
  ].join('  ');
  const goodsCol2 = [
    `${check(goods.includes('철강') || goods.includes('Iron & Steel'))} Iron & Steel`,
    `${check(goods.includes('수소') || goods.includes('Hydrogen'))} Hydrogen`,
    `${check(goods.includes('전력') || goods.includes('Electricity'))} Electricity`,
  ].join('  ');

  const dataLocation = app.dataLocation || '본사 ERP / 사업장 서버';
  const remoteText = `${check(app.remoteAccess === 'yes')} Yes  ${check(app.remoteAccess === 'partial')} Partially  ${check(app.remoteAccess === 'no')} No`;

  const ms = app.managementSystems || [];
  const msText = `${check(ms.includes('ISO 9001'))} ISO 9001  ${check(ms.includes('ISO 14001'))} ISO 14001  ${check(ms.includes('ISO 45001'))} ISO 45001  ${check(ms.includes('ISO 50001'))} ISO 50001  ${check(ms.includes('ISO 27001'))} ISO 27001  ${check(ms.includes('기타'))} other:`;
  const personnel = app.dataPersonnel ? `${app.dataPersonnel} 명` : '';

  const operators = app.operatorCount ? `${app.operatorCount} 개 사업자` : '';
  const processes = app.processCount ? `${app.processCount} 개 공정` : '';
  const goodsCount = app.goodsCount ? `${app.goodsCount} 개 품목` : '';
  const cnCodes = app.cnCodes || '';
  const mmdText = `${check(app.mmdStatus === 'clear')} Yes (명확함)  ${check(app.mmdStatus === 'complex')} Partially (복잡·불명확)  ${check(app.mmdStatus === 'none')} No  ${check(app.mmdStatus === 'not_applicable')} N/A`;
  const carbonPriceText = `${check(app.carbonPrice === 'yes')} Yes  ${check(app.carbonPrice === 'no')} No`;
  const prevVerifiedText = `${check(app.previouslyVerified === 'yes')} Yes  ${check(app.previouslyVerified === 'no')} No`;
  const emissions = app.embeddedEmissionsKt ? `${app.embeddedEmissionsKt} kT of CO2e` : '';
  const procDesc = app.productionProcesses || '';
  const fuels = app.fuelStreams || '';
  const complexityText = `${check(app.goodsComplexity === 'simple')} Simple good/ 단순상품  ${check(app.goodsComplexity === 'complex' || app.goodsComplexity === 'both')} Complex good/ 복합상품`;
  const biomassText = `${check(app.biomass === 'none')} No biomass fuel streams/ 바이오매스 없음  ${check(app.biomass !== 'none')} Utilisation of biomass/ 바이오매스 사용`;

  // Row index mappings:
  // Row 1: Client name (tc 1)
  // Row 2: Contact (tc 1)
  // Row 3: Address (tc 1)
  // Row 4: Country (tc 1)
  // Row 5: Phone (tc 1)
  // Row 6: Email (tc 1)
  // Row 7: Sites (tc 1)
  // Row 8: Consultant (tc 1)
  // Row 10: Objective (tc 1)
  // Row 11: Service (tc 1)
  // Row 12: Scope (tc 1, tc 2)
  // Row 13: Goods (tc 1, tc 2)
  // Row 15: Location (tc 1)
  // Row 16: Remote (tc 1)
  // Row 17: MS (tc 1)
  // Row 18: Personnel (tc 1)
  // Row 20: Operators (tc 1)
  // Row 21: Processes count (tc 1)
  // Row 22: Goods count (tc 1)
  // Row 23: CN codes (tc 1)
  // Row 24: MMD (tc 1)
  // Row 25: Carbon price (tc 1)
  // Row 26: Previously verified (tc 1)
  // Row 28: Emissions size (tc 1)
  // Row 29: Production processes (tc 1)
  // Row 30: Fuel streams (tc 1)
  // Row 31: Simple/complex (tc 1)
  // Row 32: Biomass (tc 1)

  const rowCellPatches: Record<number, Record<number, { text: string; bold?: boolean }>> = {
    1: { 1: { text: clientName, bold: true } },
    2: { 1: { text: contactName, bold: false } },
    3: { 1: { text: contactAddress, bold: false } },
    4: { 1: { text: country, bold: false } },
    5: { 1: { text: phone, bold: false } },
    6: { 1: { text: email, bold: false } },
    7: { 1: { text: sites, bold: false } },
    8: { 1: { text: consultant, bold: false } },
    10: { 1: { text: objectiveText, bold: false } },
    11: { 1: { text: serviceText, bold: false } },
    12: { 1: { text: yearsCol1, bold: false }, 2: { text: yearsCol2, bold: false } },
    13: { 1: { text: goodsCol1, bold: false }, 2: { text: goodsCol2, bold: false } },
    15: { 1: { text: dataLocation, bold: false } },
    16: { 1: { text: remoteText, bold: false } },
    17: { 1: { text: msText, bold: false } },
    18: { 1: { text: personnel, bold: false } },
    20: { 1: { text: operators, bold: false } },
    21: { 1: { text: processes, bold: false } },
    22: { 1: { text: goodsCount, bold: false } },
    23: { 1: { text: cnCodes, bold: true } },
    24: { 1: { text: mmdText, bold: false } },
    25: { 1: { text: carbonPriceText, bold: false } },
    26: { 1: { text: prevVerifiedText, bold: false } },
    28: { 1: { text: emissions, bold: false } },
    29: { 1: { text: procDesc, bold: false } },
    30: { 1: { text: fuels, bold: false } },
    31: { 1: { text: complexityText, bold: false } },
    32: { 1: { text: biomassText, bold: false } },
  };

  let rowCounter = 0;
  xml = xml.replace(/<w:tr[\s\S]*?<\/w:tr>/g, (trXml) => {
    const rIdx = rowCounter;
    rowCounter += 1;

    const cellPatchConfig = rowCellPatches[rIdx];
    if (!cellPatchConfig) return trXml;

    let cellCounter = 0;
    return trXml.replace(/<w:tc[\s\S]*?<\/w:tc>/g, (tcXml) => {
      const cIdx = cellCounter;
      cellCounter += 1;

      const patch = cellPatchConfig[cIdx];
      if (!patch) return tcXml;

      const tcPrMatch = tcXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/);
      const tcPr = tcPrMatch ? tcPrMatch[0] : '';
      const bTag = patch.bold ? '<w:b/>' : '';
      const lines = patch.text.split('\n');
      const pXmls = lines.map(line =>
        `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr>${bTag}<w:rFonts w:ascii="Malgun Gothic" w:eastAsia="Malgun Gothic" w:hAnsi="Malgun Gothic"/><w:sz w:val="19"/></w:rPr><w:t>${escapeXml(line)}</w:t></w:r></w:p>`
      ).join('');

      return `<w:tc>${tcPr}${pXmls}</w:tc>`;
    });
  });

  zip.file('word/document.xml', xml);
  const out = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const safeFileName = `P1173_CBAM_신청서_${(app.companyName || '고객사').replace(/[\\/:*?"<>|]/g, '_')}_${app.reference}.docx`;
  saveAs(out, safeFileName);
};
