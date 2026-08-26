export const generateDocx = async (data: any, templatePath: string = "/templates/DataVerification_template.docx") => {
    if (typeof window === 'undefined') {
        console.warn("generateDocx called on server side");
        return;
    }

    try {
        const [
            { default: Docxtemplater },
            { default: PizZip },
            { default: PizZipUtils },
            { saveAs }
        ] = await Promise.all([
            import("docxtemplater"),
            import("pizzip"),
            import("pizzip/utils/index.js"),
            import("file-saver")
        ]);

        PizZipUtils.getBinaryContent(templatePath, (error: Error | null, content: string) => {
            if (error) {
                console.error("Error loading docx template:", error);
                alert("워드 템플릿 파일을 찾을 수 없습니다.");
                return;
            }

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            try {
                // 데이터 바인딩
                doc.render(data);
            } catch (error: any) {
                console.error("Error rendering docx:", error);
                alert("워드 생성 중 오류가 발생했습니다.");
                return;
            }

            const out = doc.getZip().generate({
                type: "blob",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            // 파일 이름 생성 (LRQA_Service Agreement_GHG Protocol_기업명_2026.docx)
            const fileName = `LRQA_Service Agreement_GHG Protocol_${data.company_name || "기업명"}_2026.docx`.replace(/[/\\?%*:|"<>]/g, '-');
            saveAs(out, fileName);
        });
    } catch (e) {
        console.error("Failed to load required libraries", e);
    }
};

export type KetsContractType = 'statement' | 'plan' | 'combined';
export type KetsQuoteType = 'statement' | 'plan' | 'combined';

const KETS_TEMPLATE_CONFIG: Record<KetsContractType, { templatePath: string; fileLabel: string }> = {
    statement: {
        templatePath: '/templates/K-ETSemission_template.docx',
        fileLabel: '온실가스 명세서 검증',
    },
    plan: {
        templatePath: '/templates/K-ETS_plan_template.docx',
        fileLabel: '온실가스 배출량산정계획서 검증',
    },
    combined: {
        templatePath: '/templates/K-ETS_statement_plan_template.docx',
        fileLabel: '온실가스 명세서 및 배출량산정계획서 검증',
    },
};

const KETS_QUOTE_TEMPLATE_CONFIG: Record<KetsQuoteType, { templatePath: string; fileLabel: string }> = {
    statement: {
        templatePath: '/templates/LRQA_KETS_Statement_Quote_Template.docx',
        fileLabel: '온실가스 명세서 검증 비용 제안서',
    },
    plan: {
        templatePath: '/templates/LRQA_KETS_Plan_Quote_Template.docx',
        fileLabel: '온실가스 배출량산정계획서 검증 비용 제안서',
    },
    combined: {
        templatePath: '/templates/LRQA_KETS_Combined_Quote_Template.docx',
        fileLabel: '온실가스 명세서 및 배출량산정계획서 검증 비용 제안서',
    },
};

// K-ETS 검증 계약서용 DOCX 생성
export const generateKetsDocx = async (
    data: any,
    companyName: string = "기업명",
    contractType: KetsContractType = 'statement',
) => {
    if (typeof window === 'undefined') {
        console.warn("generateKetsDocx called on server side");
        return;
    }

    try {
        const [
            { default: Docxtemplater },
            { default: PizZip },
            { default: PizZipUtils },
            { saveAs }
        ] = await Promise.all([
            import("docxtemplater"),
            import("pizzip"),
            import("pizzip/utils/index.js"),
            import("file-saver")
        ]);

        const template = KETS_TEMPLATE_CONFIG[contractType] || KETS_TEMPLATE_CONFIG.statement;

        PizZipUtils.getBinaryContent(template.templatePath, (error: Error | null, content: string) => {
            if (error) {
                console.error("Error loading K-ETS docx template:", error);
                alert("K-ETS 워드 템플릿 파일을 찾을 수 없습니다.");
                return;
            }

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            try {
                // 데이터 바인딩
                doc.render(data);
            } catch (error: any) {
                console.error("Error rendering K-ETS docx:", error);
                alert("K-ETS 워드 생성 중 오류가 발생했습니다.");
                return;
            }

            const out = doc.getZip().generate({
                type: "blob",
                compression: "DEFLATE",
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });

            const fileName = `LRQA_${template.fileLabel} 제안서 계약서_${companyName || "기업명"}.docx`.replace(/[/\\?%*:|"<>]/g, '-');
            saveAs(out, fileName);
        });
    } catch (e) {
        console.error("Failed to load required libraries for K-ETS", e);
    }
};

// K-ETS 검증 견적서용 DOCX 생성
// 인쇄 미리보기와 같은 유형별 견적 내역을 공식 Word 서식에 채워 내려받습니다.
export const generateKetsQuoteDocx = async (
    data: Record<string, string>,
    companyName: string = '기업명',
    quoteType: KetsQuoteType = 'combined',
) => {
    if (typeof window === 'undefined') {
        console.warn('generateKetsQuoteDocx called on server side');
        return;
    }

    try {
        const [
            { default: Docxtemplater },
            { default: PizZip },
            { default: PizZipUtils },
            { saveAs },
        ] = await Promise.all([
            import('docxtemplater'),
            import('pizzip'),
            import('pizzip/utils/index.js'),
            import('file-saver'),
        ]);

        const template = KETS_QUOTE_TEMPLATE_CONFIG[quoteType] || KETS_QUOTE_TEMPLATE_CONFIG.combined;
        const content = await new Promise<string>((resolve, reject) => {
            PizZipUtils.getBinaryContent(template.templatePath, (error: Error | null, binary: string) => {
                if (error) reject(error);
                else resolve(binary);
            });
        });

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => '',
        });
        doc.render(data);

        const output = doc.getZip().generate({
            type: 'blob',
            compression: 'DEFLATE',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        const safeCompanyName = (companyName || '기업명').replace(/[/\\?%*:|"<>]/g, '-');
        const issueDate = (data.issue_date || '').replace(/[^0-9]/g, '');
        const fileName = `LRQA_${template.fileLabel}_${safeCompanyName}${issueDate ? `_${issueDate}` : ''}.docx`;
        saveAs(output, fileName);
    } catch (error) {
        console.error('Failed to generate K-ETS quote Word document', error);
        throw error;
    }
};
