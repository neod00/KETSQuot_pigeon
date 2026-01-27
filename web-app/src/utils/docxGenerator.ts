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
