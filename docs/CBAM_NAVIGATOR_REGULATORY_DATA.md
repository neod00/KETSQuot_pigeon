> 2026-09-30 신청 흐름 변경: Navigator 검증 신청 버튼은 https://ketsquot-pigeon.netlify.app/cbam 으로 연결됩니다. URL fragment로 제품·CN 코드·사업장·생산공정·진단 답변·증빙 상태를 전달하고, 기존 신청서에서 검증 후 자동 입력하며 fragment를 제거합니다. 연락처와 동의는 기존 신청서에서 입력하며 접수 시 진단정보도 저장합니다. 서버가 점수를 재계산합니다. 링크 유효기간 30분, 최대 24,000자. 진단정보는 자기신고 자료입니다. 새로고침하면 메모리의 진단정보가 사라지므로 Navigator에서 다시 이동해야 합니다. 운영 연결에는 두 앱 모두 배포가 필요합니다. 아래 기존 독립 신청서·서명 릴레이 설명은 유지된 대체 API의 과거 설계이며 현재 기본 사용자 흐름에는 적용하지 않습니다. 공개 번들에서 신청서 호스트는 허용됩니다.

# Regulatory data and version review

Review date: 2026-09-29. Baseline scope rules were extracted unchanged from the existing CN engine into the immutable `web-app/src/lib/cbam-cn-data.2026-09-29.ts` snapshot; `cbam-cn-data.ts` selects the active version. `cbam-regulatory.ts` exposes master records with normalized code, sector, goods category, Korean/English labels, gases, inclusion/conditional/exclusion flags, effective dates, source, reference, revision and last-checked date.

Supplied PDF SHA-256: `6CA80E3ED665E47AAEF801E59E0791C50287CA46DB20AAD046E861134608CCF7`.

## Sources

| Source | Use |
| --- | --- |
| [2023/956 consolidated 2025-10-20](https://eur-lex.europa.eu/eli/reg/2023/956/2025-10-20/eng) | Annex I inclusion/exclusion; Annex II indirect-emissions scope; Annex III origin exclusions |
| [2025/2083](https://eur-lex.europa.eu/eli/reg/2025/2083/oj/eng) | Importer-wide annual 50t test, electricity/hydrogen exception |
| [2025/2547](https://eur-lex.europa.eu/eli/reg_impl/2025/2547/oj/eng) | User-supplied `OJ_L_202502547_EN_TXT.pdf`; methods, functional units, system boundaries, monitoring and evidence |
| [2025/2546](https://eur-lex.europa.eu/eli/reg_impl/2025/2546/oj/eng) | Verification principles |
| [2025/2551](https://eur-lex.europa.eu/eli/reg_del/2025/2551/oj/eng) | Accreditation, independence, verification activities |
| [2025/2621](https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=celex%3A32025R2621) | Default values; no numerical defaults calculated in this MVP |
| [2026/1740](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32026R1740) | Corrected Annexes I and IV of 2025/2621, including route indicators and units |

The supplied PDF was read locally. Key pages: 6-9 (Articles 3-10), 14-17 (Annex I category mappings). Article 4 uses product tonnes generally, kWh for electricity, kg nitrogen for codes 2808/2814/3105, supplementary CN units for other fertilisers, and clinker tonnes for 25231000/25232100/25232900/25239000. Aluminous cement retains the general unit. Articles 5(6) and 10(4) require English monitoring plans/reports. The tool asks whether those materials exist; it does not create them for customers.

## Corrigenda review

- [2025/2547, 2026-06-03](https://eur-lex.europa.eu/eli/reg_impl/2025/2547/corrigendum/2026-06-03/oj): German-language corrigendum, not affecting the English version.
- [2025/2547, 2026-09-18](https://eur-lex.europa.eu/eli/reg_impl/2025/2547/corrigendum/2026-09-18/oj): Dutch-language corrigendum, not affecting the English version.
- [2025/2621, 2026-03-04](https://eur-lex.europa.eu/eli/reg_impl/2025/2621/corrigendum/2026-03-04/oj): Romanian-language wording correction.
- 2026/1740 is a substantive technical correction to the default tables and is separately listed; do not rely on the uncorrected default-values tables.

`lastCheckedAt` is a fixed review date, not an automatically updated promise of current law. `effectiveFrom` records this dataset's 2026 applicability, not necessarily each act's original entry-into-force date. Scope source remains the consolidated basic act. CN structure is labelled CN 2026 / 2025/1926 as in the original engine.

## Limits

`CN CBAM codes.xlsx` was not present in the supplied directory, so no workbook import was fabricated. The data is an Annex I scope master rather than a complete EU customs tariff. Valid-looking unknown 8-digit codes are not certified as existing tariff codes. Four/six-digit scope results require final customs classification. Product searches always return candidates. No AI legal decision is accepted.

Conditional clay and ambiguous product categories retain a request for product-attribute confirmation. Product-map information explains generic relationships, not a customer-specific process design. The 50t question expressly requires all affected imports for the same EU importer and calendar year; a Korean supplier's shipment alone cannot establish the exemption. Other exemptions and customs circumstances remain for confirmation.

## Updating rules

Preserve the reviewed snapshot and its revision before changing any rule; create a new version rather than editing historical records in place. Update source references, applicability dates and change notes; run scope, exclusion, functional-unit and threshold tests. Keep historic application metadata intact. Rebuild both apps from the same reviewed revision. Numeric default values, future years, or new legal thresholds require a separate rule review rather than changing a display date.
