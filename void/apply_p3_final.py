import re

path = 'web-app/src/constants/template.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Styles
new_styles = """
/* Page 3 Flexible Layout Styles */
#pf3 .flexible-content {
    padding: 60px 50px;
    font-family: \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif !important;
    color: #000;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    background: white;
}
#pf3 .section-title {
    font-size: 16pt;
    color: #008ca1; 
    font-weight: bold;
    margin-bottom: 20px;
}
#pf3 .standard-table {
    width: 100%;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    border-collapse: collapse;
    margin-bottom: 10px;
}
#pf3 .standard-table td {
    padding: 6px 8px;
    font-size: 9.5pt;
    line-height: 1.4;
}
#pf3 .label-col { width: 140px; font-weight: bold; }
#pf3 .inner-line { border-bottom: 0.5px solid #ccc; }

#pf3 .data-table {
    width: 100%;
    border: 0.8px solid #000;
    border-collapse: collapse;
    margin-top: 20px;
}
#pf3 .data-table th, #pf3 .data-table td {
    border: 0.8px solid #000;
    padding: 8px 12px;
    font-size: 9.5pt;
    vertical-align: middle;
    text-align: left;
}
#pf3 .data-table th {
    background-color: #fff;
    font-weight: bold;
    width: 35%;
}
#pf3 .data-table td {
    width: 65%;
    white-space: pre-wrap;
    line-height: 1.6;
}
#pf3 .scope-title {
    font-weight: bold;
    font-size: 11pt;
    margin: 25px 0 10px 0;
}
#pf3 .link-text {
    font-size: 9pt;
    margin-top: 20px;
    margin-bottom: 5px;
}
#pf3 .additional-notes {
    border: 0.8px solid #000;
    padding: 15px;
    font-size: 9pt;
    line-height: 1.6;
}
#pf3 .notes-title {
    text-align: center;
    font-weight: bold;
    margin-bottom: 10px;
    display: block;
    font-size: 10pt;
}
#pf3 .footer-custom {
    margin-top: auto;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #333;
}
#pf3 .footer-center { position: absolute; left: 50%; transform: translateX(-50%); font-size: 10pt; }

/* Override original pdf2htmlEX styles for pf3 content */
#pf3 { height: auto !important; min-height: 1122px !important; position: static !important; }
#pf3 * { position: static !important; }
"""

if '</style>' in content:
    content = content.replace('</style>', new_styles + '</style>', 1)

# 2. HTML
new_p3_html = \"\"\"
<div id=\"pf3\" class=\"pf w0 h0\" data-page-no=\"3\">
    <div class=\"flexible-content\">
        <div class=\"section-title\">1. 서비스</div>

        <table class=\"standard-table\">
            <tr class=\"inner-line\">
                <td class=\"label-col\">제안된 표준</td>
                <td>GHG Protocol A Corporate Accounting and Reporting Standard</td>
            </tr>
            <tr>
                <td class=\"label-col\">심사기준</td>
                <td>ISO 14064-3:2019 (온실가스선언에 대한 타당성 평가 및 검증을 위한 사용규칙 및 지침)</td>
            </tr>
        </table>

        <table class=\"standard-table\" style=\"border-top: none;\">
            <tr>
                <td class=\"label-col\">고객 위치</td>
                <td style=\"font-weight: bold;\">고객 위치 주소</td>
            </tr>
            <tr>
                <td class=\"label-col\"></td>
                <td>{{ hq_address }}</td>
            </tr>
        </table>

        <div class=\"scope-title\">Scope</div>

        <table class=\"data-table\">
            <tr>
                <th>조직명</th>
                <td>{{ company_name }}</td>
            </tr>
            <tr>
                <th>검증 받을 조직의 위치 및 경계</th>
                <td>{{ target_sites }}</td>
            </tr>
            <tr>
                <th>온실가스 선언이 적용되는 기간</th>
                <td>{{ verification_year }}년 온실가스 Scope 1, 2 배출량</td>
            </tr>
            <tr>
                <th>보증수준</th>
                <td>{{ assurance_level }}</td>
            </tr>
            <tr>
                <th>중요성</th>
                <td>{{ materiality_level }}</td>
            </tr>
        </table>

        <div class=\"link-text\">
            심사표준별 적용기준 및 LRQA 고객 정보 유의사항을 확인하려면 <a href=\"#\" style=\"color: #008ca1; text-decoration: underline;\">여기</a>를 클릭하십시오.
        </div>
        <div class=\"additional-notes\">
            <span class=\"notes-title\">추가 참고 사항</span>
            본 계약에 명시된 수수료에는 한 가지 언어로 된 인증서와 보고서의 발급이 포함되며, 이는 LRQA 클라이언트 포털을 통해 이용 가능합니다. 다수의 사이트의 경우, 모든 사이트를 포함하는 부록이 있는 인증서가 발급됩니다. 추가로 다른 언어의 인증서 및/또는 보고서를 요청하는 경우 추가 요금이 부과됩니다.<br><br>
            회사의 변경 사항(주소, 직원 수, 규모 등)이 발생하여 심사 범위와 심사 시간에 영향을 미치는 경우, 다음 심사 전에 이를 검토하고 심사 문서 및 차기 심사계획을 업데이트합니다. 변경된 심사 일수는 심사 시점에 적용되는 심사요율에 따라 청구됩니다.
        </div>

        <div class=\"footer-custom\">
            <div class=\"footer-center\">3</div>
            <div style=\"margin-left: auto;\">LRQA Agreement for the provision of certification services 2024</div>
        </div>
    </div>
</div>
\"\"\"

# Search for the start of pf3 regardless of attributes order
match_p3_start = re.search(r'<div[^>]*id=\"pf3\"[^>]*>', content)
if match_p3_start:
    start_pos = match_p3_start.start()
    # Find start of pf4 to mark the end
    match_p4_start = re.search(r'<div[^>]*id=\"pf4\"[^>]*>', content)
    if match_p4_start:
        end_pos = match_p4_start.start()
        # Replace
        content = content[:start_pos] + new_p3_html + content[end_pos:]
        print(\"Successfully replaced Page 3 HTML content\")
    else:
        print(\"Error: Could not find Page 4 boundary\")
else:
    print(\"Error: Could not find Page 3 start tag\")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
