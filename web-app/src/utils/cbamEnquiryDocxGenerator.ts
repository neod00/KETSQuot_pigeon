import { StoredCbamApplication, CbamApplicationInput } from '@/lib/cbam';

// Utility for safe XML string escaping
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

  // Checkbox helpers
  const check = (condition: boolean) => (condition ? '☒' : '☐');

  // Values map
  const clientName = app.companyName || '';
  const contactName = app.contactName || '';
  const contactAddress = app.address || '';
  const country = app.country || '대한민국';
  const phone = app.phone || '';
  const email = app.email || '';
  const sites = app.sites || '';
  const consultant = app.notes?.includes('컨설턴트') ? app.notes : 'N/A';

  // Years (2024 - 2031)
  const years = app.verificationYears || [];
  const yearsCol1 = ['2024', '2025', '2026', '2027']
    .map(y => `${check(years.includes(y))} ${y}`)
    .join('  ');
  const yearsCol2 = ['2028', '2029', '2030', '2031']
    .map(y => `${check(years.includes(y))} ${y}`)
    .join('  ');

  // Nature of goods
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

  // Service required
  const isPre = app.serviceType === 'pre_verification';
  const isVerif = app.serviceType === 'verification';
  const isOther = app.serviceType === 'other';
  const serviceText = `${check(isPre)} Pre-Verification (Gap analysis)  ${check(isVerif)} Verification  ${check(isOther)} Other:`;

  // Objective
  const isImporter = app.clientType === 'importer';
  const isOperator = app.clientType === 'operator';
  const objectiveText = `${check(isImporter)} To verify the Importer’s CBAM Declaration/ 수입자의 CBAM 신고서 검증\n${check(isOperator)} To verify the third country Operator’s CBAM report / 제3국 생산자의 CBAM 배출량 보고서 검증`;

  // Data management
  const dataLocation = app.dataLocation || 'Headquarters ERP / Site server';
  const remoteText = `${check(app.remoteAccess === 'yes')} Yes  ${check(app.remoteAccess === 'partial')} Partially  ${check(app.remoteAccess === 'no')} No`;

  const ms = app.managementSystems || [];
  const msText = `${check(ms.includes('ISO 9001'))} ISO 9001  ${check(ms.includes('ISO 14001'))} ISO 14001  ${check(ms.includes('ISO 45001'))} ISO 45001  ${check(ms.includes('ISO 50001'))} ISO 50001  ${check(ms.includes('ISO 27001'))} ISO 27001  ${check(ms.includes('기타'))} other:`;
  const personnel = app.dataPersonnel || '1';

  // Table 1 Size of datasets
  const operators = app.operatorCount || '1';
  const processes = app.processCount || '1';
  const goodsCount = app.goodsCount || '1';
  const cnCodes = app.cnCodes || 'N/A';
  const mmdText = `${check(app.mmdStatus === 'clear')} Yes  ${check(app.mmdStatus === 'none' || app.mmdStatus === 'complex')} No`;
  const carbonPriceText = `${check(app.carbonPrice === 'yes')} Yes  ${check(app.carbonPrice === 'no')} No`;
  const prevVerifiedText = `${check(app.previouslyVerified === 'yes')} Yes  ${check(app.previouslyVerified === 'no')} No`;
  const emissions = app.embeddedEmissionsKt ? `${app.embeddedEmissionsKt} kT of CO2e` : '-';
  const procDesc = app.productionProcesses || '-';
  const fuels = app.fuelStreams || '-';
  const complexityText = `${check(app.goodsComplexity === 'simple')} Simple good/ 단순상품  ${check(app.goodsComplexity === 'complex' || app.goodsComplexity === 'both')} Complex good/ 복합상품`;
  const biomassText = `${check(app.biomass === 'none')} No biomass fuel streams/ 바이오매스 없음  ${check(app.biomass !== 'none')} Utilisation of biomass fuel streams/ 바이오매스 사용`;

  // Direct targeted replacements for row cells in Table 0
  const patchTable0 = () => {
    // Client Name
    xml = xml.replace(/(<w:tr[\s\S]*?Client's name[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(clientName)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Contact
    xml = xml.replace(/(<w:tr[\s\S]*?Contact for correspondence[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(contactName)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Address
    xml = xml.replace(/(<w:tr[\s\S]*?Contact address[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(contactAddress)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Country
    xml = xml.replace(/(<w:tr[\s\S]*?Country where the Client is registered[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(country)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Phone
    xml = xml.replace(/(<w:tr[\s\S]*?Contact phone number[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(phone)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Email
    xml = xml.replace(/(<w:tr[\s\S]*?Contact email[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(email)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Sites
    xml = xml.replace(/(<w:tr[\s\S]*?Site\(s\) to be verified[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(sites)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Consultant
    xml = xml.replace(/(<w:tr[\s\S]*?Consultant if any[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(consultant)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Objective
    xml = xml.replace(/(<w:tr[\s\S]*?Objective of the engagement[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(objectiveText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Service
    xml = xml.replace(/(<w:tr[\s\S]*?Service required 요청 서비스[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(serviceText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Scope Years
    xml = xml.replace(/(<w:tr[\s\S]*?Scope \(tick the year\(s\)[\s\S]*?<\/w:tr>)/, (tr) => {
      let tcCount = 0;
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc) => {
        tcCount += 1;
        if (tcCount === 2) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(yearsCol1)}</w:t></w:r></w:p>`);
        }
        if (tcCount === 3) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(yearsCol2)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Goods
    xml = xml.replace(/(<w:tr[\s\S]*?Nature of CBAM goods[\s\S]*?<\/w:tr>)/, (tr) => {
      let tcCount = 0;
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc) => {
        tcCount += 1;
        if (tcCount === 2) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(goodsCol1)}</w:t></w:r></w:p>`);
        }
        if (tcCount === 3) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(goodsCol2)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Location
    xml = xml.replace(/(<w:tr[\s\S]*?Location where data is retained[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(dataLocation)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Remote
    xml = xml.replace(/(<w:tr[\s\S]*?Is data digitalized and remotely accessible[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(remoteText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // MS
    xml = xml.replace(/(<w:tr[\s\S]*?Management system in place and certified[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(msText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Personnel
    xml = xml.replace(/(<w:tr[\s\S]*?How many persons are in charge of collecting[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(personnel)}명</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
  };

  const patchTable1 = () => {
    // Operators
    xml = xml.replace(/(<w:tr[\s\S]*?How many CBAM goods operators do you deal with[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(operators)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Processes count
    xml = xml.replace(/(<w:tr[\s\S]*?How many production processes are involved[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(processes)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Goods count
    xml = xml.replace(/(<w:tr[\s\S]*?How many CBAM goods are involved[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(goodsCount)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // CN Codes
    xml = xml.replace(/(<w:tr[\s\S]*?Specify the 8 digits CN codes[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:b/><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(cnCodes)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // MMD
    xml = xml.replace(/(<w:tr[\s\S]*?is the MMD \(Monitoring Methodology Documentation\) provided[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(mmdText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Carbon price
    xml = xml.replace(/(<w:tr[\s\S]*?Is information on a carbon price due in the relevant jurisdiction[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(carbonPriceText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Embedded emissions previously verified
    xml = xml.replace(/(<w:tr[\s\S]*?already verified by an accredited Verification Body[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(prevVerifiedText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Estimated size
    xml = xml.replace(/(<w:tr[\s\S]*?Estimated size of embedded emissions[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(emissions)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Specify production processes
    xml = xml.replace(/(<w:tr[\s\S]*?Specify production processes[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(procDesc)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Specify fuel streams
    xml = xml.replace(/(<w:tr[\s\S]*?Specify fuel streams[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(fuels)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Simple or complex
    xml = xml.replace(/(<w:tr[\s\S]*?Specify if the CBAM goods manufacturer are simple or complex[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(complexityText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
    // Biomass
    xml = xml.replace(/(<w:tr[\s\S]*?Biomass fuel streams[\s\S]*?<\/w:tr>)/, (tr) => {
      return tr.replace(/(<w:tc[\s\S]*?<\/w:tc>)/g, (tc, i) => {
        if (i === 1) {
          return tc.replace(/<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g, '').replace(/(<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(biomassText)}</w:t></w:r></w:p>`);
        }
        return tc;
      });
    });
  };

  patchTable0();
  patchTable1();

  zip.file('word/document.xml', xml);
  const out = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  const safeFileName = `P1173_CBAM_신청서_${(app.companyName || '고객사').replace(/[\\/:*?"<>|]/g, '_')}_${app.reference}.docx`;
  saveAs(out, safeFileName);
};
