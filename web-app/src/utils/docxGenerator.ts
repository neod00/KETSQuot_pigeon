import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";

function loadFile(url: string, callback: (err: Error | null, data: string) => void) {
    PizZipUtils.getBinaryContent(url, callback);
}

export const generateDocx = async (data: any, templatePath: string = "/templates/DataVerification_template.docx") => {
    loadFile(templatePath, (error, content) => {
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

        // 파일 이름 생성 (고객사명_제안번호.docx)
        const fileName = `${data.company_name || "LRQA_제안서"}_${data.proposal_no || ""}.docx`.replace(/[/\\?%*:|"<>]/g, '-');
        saveAs(out, fileName);
    });
};
