# CBAM business documents

The evidence page and completed readiness results create documents in the browser. Report metadata stays in component state and is neither persisted nor submitted. Diagnostic responses and evidence states are snapshots; editing the workbook does not change Navigator data.

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

Run `npm test`, `npm run build`, and `npm run audit:public`. Tests reopen generated PDF/XLSX files and cover incomplete diagnoses, literal user text, evidence exclusions, dates, workflow controls and long metadata. Visual QA must render the actual browser-downloaded PDFs with Poppler and inspect all worksheet views. Existing KETSQuot portal files are outside this change.
