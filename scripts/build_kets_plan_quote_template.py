from __future__ import annotations

import argparse
import copy
import hashlib
import os
import tempfile
import zipfile

from lxml import etree


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}


def qn(name: str) -> str:
    prefix, local = name.split(":", 1)
    return f"{{{W_NS}}}{local}" if prefix == "w" else name


def paragraph_text(paragraph: etree._Element) -> str:
    return "".join(paragraph.xpath(".//w:t/text()", namespaces=NS))


def replace_paragraph_text(paragraph: etree._Element, value: str) -> None:
    runs = paragraph.xpath("./w:r", namespaces=NS)
    if not runs:
        run = etree.SubElement(paragraph, qn("w:r"))
    else:
        run = runs[0]
        for extra in runs[1:]:
            paragraph.remove(extra)
    for child in list(run):
        if child.tag != qn("w:rPr"):
            run.remove(child)
    text = etree.SubElement(run, qn("w:t"))
    if value.startswith(" ") or value.endswith(" "):
        text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    text.text = value


def find_paragraph(root: etree._Element, exact: str) -> etree._Element:
    for paragraph in root.xpath(".//w:p", namespaces=NS):
        if paragraph_text(paragraph).strip() == exact.strip():
            return paragraph
    raise ValueError(f"Paragraph not found: {exact}")


def set_cell_text(cell: etree._Element, value: str) -> None:
    paragraphs = cell.xpath("./w:p", namespaces=NS)
    if not paragraphs:
        paragraphs = [etree.SubElement(cell, qn("w:p"))]
    replace_paragraph_text(paragraphs[0], value)
    for paragraph in paragraphs[1:]:
        cell.remove(paragraph)


def set_row_fill(row: etree._Element, fill: str) -> None:
    for cell in row.xpath("./w:tc", namespaces=NS):
        tc_pr = cell.find(qn("w:tcPr"))
        if tc_pr is None:
            tc_pr = etree.Element(qn("w:tcPr"))
            cell.insert(0, tc_pr)
        shading = tc_pr.find(qn("w:shd"))
        if shading is None:
            shading = etree.SubElement(tc_pr, qn("w:shd"))
        shading.set(qn("w:fill"), fill)


def set_row_font(row: etree._Element, color: str, bold: bool) -> None:
    for run in row.xpath(".//w:r", namespaces=NS):
        r_pr = run.find(qn("w:rPr"))
        if r_pr is None:
            r_pr = etree.Element(qn("w:rPr"))
            run.insert(0, r_pr)
        color_node = r_pr.find(qn("w:color"))
        if color_node is None:
            color_node = etree.SubElement(r_pr, qn("w:color"))
        color_node.set(qn("w:val"), color)
        bold_node = r_pr.find(qn("w:b"))
        if bold and bold_node is None:
            etree.SubElement(r_pr, qn("w:b"))


def add_contract_paragraph(contact_paragraph: etree._Element) -> None:
    paragraph = copy.deepcopy(contact_paragraph)
    replace_paragraph_text(paragraph, "5) 계약서 PDF는 ")
    first_run = paragraph.xpath("./w:r", namespaces=NS)[0]
    marker_run = copy.deepcopy(first_run)
    for child in list(marker_run):
        if child.tag != qn("w:rPr"):
            marker_run.remove(child)
    marker_text = etree.SubElement(marker_run, qn("w:t"))
    marker_text.text = "[[CONTRACT_LINK]]"
    suffix_run = copy.deepcopy(first_run)
    for child in list(suffix_run):
        if child.tag != qn("w:rPr"):
            suffix_run.remove(child)
    suffix_text = etree.SubElement(suffix_run, qn("w:t"))
    suffix_text.text = "할 수 있습니다(발급 후 10일, 최대 3회)."
    paragraph.append(marker_run)
    paragraph.append(suffix_run)
    contact_paragraph.addprevious(paragraph)


def populate_cost_table(table: etree._Element, prefix: str) -> None:
    rows = table.xpath("./w:tr", namespaces=NS)
    values_by_row = {
        2: ["1단계(개요파악, 계획수립)", f"{{{prefix}_s1_days}} Manday", f"{{{prefix}_s1_cost}}원", ""],
        3: ["2단계(문서검토, 현장검증)", f"{{{prefix}_s2_days}} Manday", f"{{{prefix}_s2_cost}}원", ""],
        4: ["3단계(검증결과 정리/평가 등)", f"{{{prefix}_s3_days}} Manday", f"{{{prefix}_s3_cost}}원", ""],
        5: ["제경비", "-", f"{{{prefix}_expenses}}원", ""],
        6: ["합 계", f"{{{prefix}_total_days}} Manday", f"{{{prefix}_total_cost}}원", "VAT {vat_type}"],
    }
    for row_index, values in values_by_row.items():
        cells = rows[row_index].xpath("./w:tc", namespaces=NS)
        for cell, value in zip(cells, values):
            set_cell_text(cell, value)

    final_row = copy.deepcopy(rows[6])
    final_cells = final_row.xpath("./w:tc", namespaces=NS)
    final_values = ["최종 제안금액", f"{{{prefix}_total_days}} Manday", f"{{{prefix}_final_cost}}원", "VAT {vat_type}"]
    for cell, value in zip(final_cells, final_values):
        set_cell_text(cell, value)
    set_row_fill(final_row, "000080")
    set_row_font(final_row, "FFFFFF", True)
    rows[6].addnext(final_row)


def add_page_break(paragraph: etree._Element) -> None:
    run = etree.SubElement(paragraph, qn("w:r"))
    page_break = etree.SubElement(run, qn("w:br"))
    page_break.set(qn("w:type"), "page")


def set_page_break_before(paragraph: etree._Element) -> None:
    p_pr = paragraph.find(qn("w:pPr"))
    if p_pr is None:
        p_pr = etree.Element(qn("w:pPr"))
        paragraph.insert(0, p_pr)
    if p_pr.find(qn("w:pageBreakBefore")) is None:
        etree.SubElement(p_pr, qn("w:pageBreakBefore"))


def build(source: str, destination: str, quote_type: str) -> None:
    with zipfile.ZipFile(source, "r") as archive:
        parts = {name: archive.read(name) for name in archive.namelist()}

    root = etree.fromstring(parts["word/document.xml"])
    replacements = {
        "온실가스 배출량산정계획서 검증비용 제안서": "{document_title}",
        "귀 사에 대한 온실가스 배출량 산정계획서 검증과 관련하여, 예상되는 검증 심사 내역을 아래와 같이 송부드리오니, 업무 참조하시기 바랍니다.": "귀 사에 대한 {scope_text} 검증과 관련하여, 예상되는 검증 심사 내역을 아래와 같이 송부드리오니, 업무 참조하시기 바랍니다.",
        "검증 범위: 온실가스 배출량 산정계획서(2026년)": "검증 범위: {scope_text}",
        "1) 심사 요율은 1,050,000원/ Manday 이며 상기 금액은 부가가치세(VAT)가 제외된 금액입니다.": "1) 심사 요율은 {audit_rate}원/ Manday 이며 상기 금액은 부가가치세(VAT)가 {vat_description} 금액입니다.",
        "2) 교통비, 숙박비, 심사원 일비(40,000원/일)를 포함한 여비 및 기타경비는 상기 제안금액에 포함됩니다.": "2) 교통비, 숙박비, 심사원 일비 등의 제경비는 상기 제안금액에 포함되어 있습니다.",
        "5) 자세한 사항은 김 달 실장(02-3703-7527)에게 문의 바랍니다. 끝.": "{contact_note}",
    }
    for old, new in replacements.items():
        replace_paragraph_text(find_paragraph(root, old), new)

    tables = root.xpath(".//w:tbl", namespaces=NS)
    metadata_rows = tables[0].xpath("./w:tr", namespaces=NS)
    metadata = [row.xpath("./w:tc", namespaces=NS) for row in metadata_rows]
    set_cell_text(metadata[0][1], "{company_name}")
    set_cell_text(metadata[0][2], "{proposal_no}")
    set_cell_text(metadata[1][1], "{contact_person}")
    set_cell_text(metadata[2][2], "{proposal_date}")

    cost_table = tables[1]
    if quote_type == "combined":
        cost_heading = find_paragraph(root, "검증 비용")
        replace_paragraph_text(cost_heading, "1) 온실가스 명세서")
        plan_table = copy.deepcopy(cost_table)
        populate_cost_table(cost_table, "statement")

        plan_heading = copy.deepcopy(cost_heading)
        replace_paragraph_text(plan_heading, "2) 배출량산정계획서")
        for child in list(plan_heading):
            if child.tag == qn("w:r"):
                plan_heading.remove(child)
        add_page_break(plan_heading)
        plan_heading_run = etree.SubElement(plan_heading, qn("w:r"))
        plan_heading_text = etree.SubElement(plan_heading_run, qn("w:t"))
        plan_heading_text.text = "2) 배출량산정계획서"
        populate_cost_table(plan_table, "plan")
        cost_table.addnext(plan_heading)
        plan_heading.addnext(plan_table)

        overall_row = copy.deepcopy(plan_table.xpath("./w:tr", namespaces=NS)[-1])
        overall_cells = overall_row.xpath("./w:tc", namespaces=NS)
        overall_values = ["전체 최종 제안금액", "", "{combined_final_cost}원", "VAT {vat_type}"]
        for cell, value in zip(overall_cells, overall_values):
            set_cell_text(cell, value)
        set_row_fill(overall_row, "00857F")
        set_row_font(overall_row, "FFFFFF", True)
        plan_table.append(overall_row)
    else:
        populate_cost_table(cost_table, "statement" if quote_type == "statement" else "plan")

    criteria = find_paragraph(root, "심사 기준: 온실가스 배출권거래제의 배출량 보고 및 인증에 관한 지침")
    target = copy.deepcopy(criteria)
    replace_paragraph_text(target, "검증 대상: {verification_target}")
    criteria.addnext(target)

    contact = find_paragraph(root, "{contact_note}")
    add_contract_paragraph(contact)

    # The new target paragraph, final-offer row, and optional link line add roughly
    # three lines to page 1. Remove the same number of source spacer paragraphs
    # immediately before the retained page-2 heading to keep its vertical start.
    advantages = find_paragraph(root, "■ 로이드인증원(LRQA) 장점")
    set_page_break_before(advantages)
    removed = 0
    sibling = advantages.getprevious()
    while sibling is not None and removed < 3:
        previous = sibling.getprevious()
        if sibling.tag == qn("w:p") and not paragraph_text(sibling).strip():
            sibling.getparent().remove(sibling)
            removed += 1
        sibling = previous
    if removed != 3:
        raise ValueError("Expected three page spacer paragraphs before the LRQA advantages section")

    parts["word/document.xml"] = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone="yes")
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    fd, temp_path = tempfile.mkstemp(suffix=".docx", dir=os.path.dirname(destination))
    os.close(fd)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, content in parts.items():
                archive.writestr(name, content)
        os.replace(temp_path, destination)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    with open(source, "rb") as handle:
        print("source_sha256", hashlib.sha256(handle.read()).hexdigest())
    print("created", destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("destination")
    parser.add_argument("--type", choices=("statement", "plan", "combined"), default="plan")
    args = parser.parse_args()
    build(args.source, args.destination, args.type)


if __name__ == "__main__":
    main()
