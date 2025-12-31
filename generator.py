import os
import datetime
from jinja2 import Environment, FileSystemLoader

# 요율 설정
STANDARD_RATE = 1050000
EXPENSES_DEFAULT = 600000

def format_currency(value):
    if not value:
        return "0"
    return "{:,}".format(int(value))

def get_input(prompt, default=""):
    result = input(f"{prompt} [{default}]: ").strip()
    return result if result else default

def calculate_costs(s1_days, s2_days, s3_days, expenses):
    s1_cost = int(float(s1_days) * STANDARD_RATE)
    s2_cost = int(float(s2_days) * STANDARD_RATE)
    s3_cost = int(float(s3_days) * STANDARD_RATE)
    total_days = float(s1_days) + float(s2_days) + float(s3_days)
    total_cost = s1_cost + s2_cost + s3_cost + expenses
    return {
        "s1_cost": format_currency(s1_cost),
        "s2_cost": format_currency(s2_cost),
        "s3_cost": format_currency(s3_cost),
        "expenses": format_currency(expenses),
        "total_days": f"{total_days:.1f}",
        "total_cost_raw": total_cost,
        "total_cost": format_currency(total_cost)
    }

def main():
    env = Environment(loader=FileSystemLoader('.'))
    env.filters['format_currency'] = format_currency
    
    print("\n" + "="*50)
    print(" LRQA 온실가스 검증 견적서 자동 생성기")
    print("="*50)
    
    print("\n[1] 견적 유형 선택")
    print("1: 명세서 검증만")
    print("2: 배출량산정계획서 검증만")
    print("3: 명세서 + 계획서 통합 견적")
    quot_type = get_input("선택 (1/2/3)", "3")
    
    show_inv = quot_type in ["1", "3"]
    show_mp = quot_type in ["2", "3"]
    
    print("\n[2] 기본 정보 입력")
    company_name = get_input("회사명", "씨엔씨티에너지")
    contact_person = get_input("담당자명 (직위 포함)", "안종호 매니저님")
    doc_id = get_input("문서 번호", "QR.001/DK/G" + datetime.datetime.now().strftime("%y%m%d"))
    issue_date = get_input("발행 일자", datetime.datetime.now().strftime("%Y년 %m월 %d일"))
    targets = get_input("검증 대상 사업장 (없으면 엔터)", "본사, 학사사업소, 계룡사업소 및 CNG충전소")
    
    scope_text = ""
    inv_data = {}
    mp_data = {}
    grand_total_raw = 0
    
    if show_inv:
        print("\n[3-1] 명세서 검증 데이터 입력")
        inv_year = get_input("명세서 대상 연도", "2025년")
        s1 = get_input("1단계 일수", "1.0")
        s2 = get_input("2단계 일수", "5.0")
        s3 = get_input("3단계 일수", "3.0")
        exp = int(get_input("제경비 (원)", str(EXPENSES_DEFAULT)).replace(',', ''))
        inv_remark = get_input("완료 예정 시점", "2026년 3월 이내")
        
        inv_res = calculate_costs(s1, s2, s3, exp)
        inv_data = {
            "inv_s1_days": s1, "inv_s1_cost": inv_res['s1_cost'],
            "inv_s2_days": s2, "inv_s2_cost": inv_res['s2_cost'],
            "inv_s3_days": s3, "inv_s3_cost": inv_res['s3_cost'],
            "inv_expenses": inv_res['expenses'],
            "inv_total_days": inv_res['total_days'],
            "inv_total_cost": inv_res['total_cost'],
            "inv_completion_remark": inv_remark
        }
        
        final_inv = get_input(f"명세서 최종 제안금액 (원, 계산값: {inv_res['total_cost']})", str(inv_res['total_cost_raw']))
        inv_data["inv_final_cost"] = format_currency(final_inv.replace(',', ''))
        grand_total_raw += int(final_inv.replace(',', ''))
        scope_text += f"<strong><u>{inv_year}</u></strong> 온실가스 명세서"

    if show_mp:
        if show_inv: scope_text += " 및 "
        print("\n[3-2] 배출량산정계획서 검증 데이터 입력")
        mp_year = get_input("계획서 대상 연도", "2026년")
        s1 = get_input("1단계 일수", "1.0")
        s2 = get_input("2단계 일수", "5.0")
        s3 = get_input("3단계 일수", "3.0")
        exp = int(get_input("제경비 (원)", str(EXPENSES_DEFAULT)).replace(',', ''))
        mp_remark = get_input("완료 예정 시점", "2026년 10월 이내")
        
        mp_res = calculate_costs(s1, s2, s3, exp)
        mp_data = {
            "mp_s1_days": s1, "mp_s1_cost": mp_res['s1_cost'],
            "mp_s2_days": s2, "mp_s2_cost": mp_res['s2_cost'],
            "mp_s3_days": s3, "mp_s3_cost": mp_res['s3_cost'],
            "mp_expenses": mp_res['expenses'],
            "mp_total_days": mp_res['total_days'],
            "mp_total_cost": mp_res['total_cost'],
            "mp_completion_remark": mp_remark
        }
        
        final_mp = get_input(f"계획서 최종 제안금액 (원, 계산값: {mp_res['total_cost']})", str(mp_res['total_cost_raw']))
        mp_data["mp_final_cost"] = format_currency(final_mp.replace(',', ''))
        grand_total_raw += int(final_mp.replace(',', ''))
        scope_text += f"<strong><u>{mp_year}</u></strong> 배출량산정계획서"

    title = "온실가스 "
    if show_inv and show_mp: title += "명세서 및 배출량산정계획서 "
    elif show_inv: title += "명세서 "
    else: title += "배출량산정계획서 "
    title += "검증비용 제안서"

    data = {
        "title": title,
        "company_name": company_name,
        "doc_id": doc_id,
        "contact_person": contact_person,
        "issue_date": issue_date,
        "scope_text": scope_text,
        "targets": targets,
        "show_inventory": show_inv,
        "show_mp": show_mp,
        "grand_total_cost": format_currency(grand_total_raw),
        **inv_data,
        **mp_data
    }

    try:
        template = env.get_template('template_quotation.html')
        output_html = template.render(data)
        
        output_filename = f"LRQA_견적서_{company_name}.html"
        with open(output_filename, 'w', encoding='utf-8') as f:
            f.write(output_html)
            
        print("\n" + "="*50)
        print(f" 성공! 견적서가 생성되었습니다: {output_filename}")
        print("="*50)
    except Exception as e:
        print(f"\n 오류 발생: {e}")

if __name__ == "__main__":
    main()
