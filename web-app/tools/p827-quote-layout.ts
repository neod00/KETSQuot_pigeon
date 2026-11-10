import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildP827QuoteHtml, type P827QuoteOutputData } from '../src/utils/p827QuoteGenerator';

async function main() {
    const require = createRequire(import.meta.url);
    const { chromium } = require(process.env.SAM_PLAYWRIGHT_MODULE || 'playwright');
    const out = path.resolve('../tmp/pdfs/p827-layout');
    await mkdir(out, { recursive: true });
    const browser = await chromium.launch({ headless: true, ...(process.env.SAM_CHROMIUM_PATH ? { executablePath: process.env.SAM_CHROMIUM_PATH } : {}) });
    try {
        const page = await browser.newPage();
        await page.route('https://quote-test.invalid/templates/**', async (route: { request(): { url(): string }; fulfill(options: { body: Buffer; contentType: string }): Promise<void> }) => {
            const name = new URL(route.request().url()).pathname;
            await route.fulfill({ body: await readFile(path.join(process.cwd(), 'public', name)), contentType: 'image/png' });
        });
        const data: P827QuoteOutputData = {
            companyName: '레이아웃 검증용 고객사', serviceDescription: '온실가스 검증', proposalDateLong: '2026년 11월 09일', proposalNo: 'TEST-LAYOUT',
            contactName: '담당자', contactTitle: '과장', contactPhone: '02-0000-0000', contactMobile: '-', contactEmail: 'qa@example.invalid',
            verificationYear: '2025', verificationStandard: 'isae', assuranceLevel: '제한적 보증수준 (Limited level of assurance)', materialityLevel: '전문적 판단',
            targetSites: '본사 및 공장', scopes: [1, 2], scope3Categories: Array(15).fill(false), applicationFeeText: '면제 (0)',
            stage1Days: '0.5', stage1Cost: '600,000', stage2Days: '1.0', stage2Cost: '1,200,000', stage3Days: '1.0', stage3Cost: '1,200,000',
            expenses: '200,000', totalDays: '2.5', totalCost: '3,200,000', finalCost: '3,200,000', vatType: '별도', auditRate: '1,200,000', quoteValidityDays: '30',
        };
        for (const variant of ['standard', 'long']) {
            const input = variant === 'long' ? { ...data, contactName: '긴 이름의 테스트 담당자', contactEmail: 'long-contact-address-for-layout-verification@example.invalid', stage1Cost: '123,456,789,000', finalCost: '987,654,321,000', applicationFeeText: '면제 (720,000원)', vatType: '포함', assuranceLevel: '합리적 보증수준 (Reasonable level of assurance)' } : data;
            const html = buildP827QuoteHtml(input).replaceAll('src="/templates/', 'src="https://quote-test.invalid/templates/').replace(/<script>[\s\S]*?<\/script>/, '');
            await page.setContent(html, { waitUntil: 'networkidle' });
            await page.emulateMedia({ media: 'print' });
            await page.evaluate(() => document.fonts.ready);
            const problems = await page.evaluate(() => {
                const issues: string[] = [];
                document.querySelectorAll<HTMLElement>('.quote-cost-cell').forEach(cell => {
                    const range = document.createRange(); range.selectNodeContents(cell);
                    const text = range.getBoundingClientRect(); const box = cell.getBoundingClientRect();
                    if (text.top < box.top + 1 || text.bottom > box.bottom - 1 || text.left < box.left || text.right > box.right) issues.push(`cell outside row: ${cell.textContent}`);
                    if (Math.abs((text.top + text.bottom) / 2 - (box.top + box.bottom) / 2) > 2) issues.push(`cell not centered: ${cell.textContent}`);
                });
                const list = document.querySelector<HTMLElement>('.quote-notes')!;
                const box = list.parentElement!.getBoundingClientRect();
                const notes = Array.from(list.querySelectorAll('li'));
                notes.forEach((note, i) => {
                    const rect = note.getBoundingClientRect();
                    if (rect.top < box.top || rect.bottom > box.bottom || rect.right > box.right) issues.push(`note outside frame: ${i}`);
                    if (i && rect.top < notes[i - 1].getBoundingClientRect().bottom) issues.push(`overlapping notes: ${i}`);
                });
                const remarks = Array.from(document.querySelectorAll<HTMLElement>('.quote-remark'));
                if (remarks.length !== 4 || !remarks.some(cell => cell.textContent === '기술검토 포함')) issues.push('missing uniform remark cells');
                const fonts = remarks.map(cell => { const css = getComputedStyle(cell); return [css.fontFamily, css.fontSize, css.fontWeight].join('|'); });
                if (new Set(fonts).size !== 1) issues.push('remark fonts differ');
                const contact = document.querySelector<HTMLElement>('.quote-contact')!;
                const contactBox = contact.getBoundingClientRect();
                const lastPage = document.querySelector<HTMLElement>('.page:last-child')!.getBoundingClientRect();
                if (contactBox.top < lastPage.top + lastPage.height * .215) issues.push('contact overlaps background headings');
                const contactRows = [contact.querySelector('p')!, ...Array.from(contact.querySelectorAll('dl>div'))];
                contactRows.forEach((row, i) => {
                    const rect = row.getBoundingClientRect();
                    if (i && rect.top < contactRows[i - 1].getBoundingClientRect().bottom) issues.push('contact lines overlap');
                    if (rect.right > contactBox.right || rect.bottom > lastPage.top + lastPage.height * .8) issues.push('contact outside safe area');
                });
                return issues;
            });
            assert.deepEqual(problems, [], variant);
            await page.pdf({ path: path.join(out, `${variant}.pdf`), preferCSSPageSize: true, printBackground: true });
            console.log(`PASS ${variant}: row containment, notes spacing, identical remark fonts and final-page contact layout; PDF generated.`);
        }
    } finally { await browser.close(); }
}
void main();
