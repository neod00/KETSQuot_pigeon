# CBAM business documents

The evidence page and completed readiness results create documents in the browser after successful lead registration. Company, contact name, phone, email and collection/use consent are required. Contact details, report metadata and a diagnostic/evidence snapshot are submitted to the authenticated intake and stored in the portal's `cbam-navigator-leads` Netlify Blob store. Contact fields remain in component memory, not browser draft storage. Editing the workbook does not change Navigator data.

Document requests and consultation requests are distinct. The same session and email accumulate in one record. Only explicit consultation requests submit the `cbam-consultation` Netlify Form and request an email notification. Failed notifications remain visible and can be retried from CBAM management's Navigator intake tab. Administrators can manage status, assignee and notes. A later formal application links the matching lead. Netlify Forms detection and the recipient email hook must be configured separately on the Navigator site.

- PDF: A4 report summary, three priority actions, user-entered support requests, and all 24 diagnostic/evidence records. Unfinished diagnoses show no final percentage. Long text continues on additional pages.
- XLSX: report summary, outstanding cooperation requests with editable department/owner/date/status/notes, and the complete diagnostic snapshot. Evidence marked ready or not applicable is excluded from requests. Example departments require review before circulation.
- CSV remains under the secondary raw-data export control.

PDF generation uses pdf-lib and a locally served static Korean font. XLSX generation uses ExcelJS, loaded on demand. The ExcelJS UUID dependency is overridden to a patched 11.x release; only UUID v4 is used by ExcelJS. Browser downloads are tested, including this override.

## Font source and license

`public/fonts/NotoSansKR-Regular.ttf` derives from Google's [Noto Sans KR](https://github.com/google/fonts/tree/main/ofl/notosanskr) variable TTF (weight 400). FontTools instantiates a static font and removes GSUB/GPOS tables to avoid glyph substitutions that break PDF ToUnicode mapping. The full static font is embedded because CJK composite glyphs rendered incorrectly with runtime subsetting. This preserves Korean display, copying and text search. `public/fonts/OFL.txt` accompanies distribution (SIL Open Font License).

Regenerate using FontTools outside production dependencies:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
font = TTFont('NotoSansKR-variable.ttf')
instantiateVariableFont(font, {'wght': 400}, inplace=True)
for table in ['GSUB', 'GPOS']:
    if table in font:
        del font[table]
font.save('public/fonts/NotoSansKR-Regular.ttf')
```

## Validation

Run `npm test`, `npm run build`, and `npm run audit:public`. Tests reopen generated PDF/XLSX files and cover incomplete diagnoses, literal user text, evidence exclusions, dates, workflow controls and long metadata. Lead tests cover validation, deduplication, notification retry and application linking. The portal adds a dedicated intake API and administrator tab.
