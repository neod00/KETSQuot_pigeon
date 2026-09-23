import assert from 'node:assert/strict';
import test from 'node:test';
import { mapKetsQuoteToContract } from '../src/lib/ketsQuoteHandoff.ts';

const quote = {
    quotType: '3', companyName: '테스트 고객', contactPerson: '담당자', docId: 'Q-123', issueDate: '2026-09-24',
    verificationTarget: '서울 사업장', invYear: '2025년', invS1Days: '1', invS2Days: '5', invS3Days: '3',
    invExpenses: 600000, invFinalCost: 10000000, mpYear: '2026년', mpS1Days: '2', mpS2Days: '4',
    mpS3Days: '1', mpExpenses: 450000, mpFinalCost: 8000000, vatType: '별도', hqAddress: '본사 주소',
    businessRegistration: '123', industryType: '제조', contractContact: '계약 담당', materiality: '5%',
};

test('combined quotation carries both work packages and source fields', () => {
    const contract = mapKetsQuoteToContract(quote);
    assert.equal(contract.contractType, 'combined');
    assert.equal(contract.proposalNo, 'Q-123');
    assert.equal(contract.sourceQuoteNo, 'Q-123');
    assert.equal(contract.targetSites, '서울 사업장');
    assert.equal(contract.ghgDeclarationPeriod, '2025년');
    assert.equal(contract.planTargetYear, '2026년');
    assert.equal(contract.s2Days, 5);
    assert.equal(contract.planS2Days, 4);
    assert.equal(contract.manualFinalCost, 10000000);
    assert.equal(contract.planManualFinalCost, 8000000);
    assert.equal(contract.planIsManualCost, true);
    assert.equal(contract.clientContact, '계약 담당');
});

test('plan-only quotation becomes the primary contract fee and VAT-inclusive total', () => {
    const contract = mapKetsQuoteToContract({ ...quote, quotType: '2', vatType: '포함' });
    assert.equal(contract.contractType, 'plan');
    assert.equal(contract.s1Days, 2);
    assert.equal(contract.s2Days, 4);
    assert.equal(contract.expenses, 450000);
    assert.equal(contract.manualFinalCost, 8800000);
    assert.equal(contract.planIsManualCost, false);
});

test('statement-only quotation keeps statement values', () => {
    const contract = mapKetsQuoteToContract({ ...quote, quotType: '1', verificationTarget: '' });
    assert.equal(contract.contractType, 'statement');
    assert.equal(contract.s3Days, 3);
    assert.equal(contract.targetSites, '본사 주소');
    assert.equal(contract.manualFinalCost, 10000000);
});
