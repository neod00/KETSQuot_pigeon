import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateP827Days, createDefaultP827Application, isLcaSolutionApplication, needsManualLcaQuote, p827ServiceLabel, type StoredP827Application } from '../src/lib/p827-application';

const stored = (patch: Partial<StoredP827Application>): StoredP827Application => {
  const input = { ...createDefaultP827Application(), organisationName: 'A', contactName: 'B', phone: '1', email: 'a@b.co', consent: true, ...patch };
  return { ...input, ...calculateP827Days(input), commercialLevel: 'unassessed', commercialReason: '', reputationalLevel: 'unassessed', reputationalReason: '', liabilityLevel: 'unassessed', liabilityReason: '', reference: 'P827-1', submittedAt: '2026-11-10T00:00:00Z', status: '신규 접수', dayRate: 1, applicationFee: 0, expenses: 0, pricingAdjustmentReason: '', estimatedCost: 1, ...patch } as StoredP827Application;
};

test('LCA requests are recognised by service type or by the relay objective prefix', () => {
  assert.equal(isLcaSolutionApplication(stored({ serviceType: 'lca_solution' })), true);
  assert.equal(isLcaSolutionApplication(stored({ objective: '[LCA 산정 솔루션 검증] HyLCA — 제품 탄소발자국(PCF)' })), true);
  assert.equal(isLcaSolutionApplication(stored({ serviceType: 'p827', objective: 'Scope 1·2 검증' })), false);
  assert.equal(p827ServiceLabel(stored({ serviceType: 'lca_solution' })), 'LCA 산정 솔루션 검증');
  assert.equal(p827ServiceLabel(stored({})), '조직 데이터·정보 검증');
});

test('LCA requests need a manual quote until days are entered', () => {
  assert.equal(needsManualLcaQuote(stored({ serviceType: 'lca_solution' })), true);
  assert.equal(needsManualLcaQuote(stored({ serviceType: 'lca_solution', manualQuotedDays: 30 })), false);
  assert.equal(needsManualLcaQuote(stored({})), false);
});
