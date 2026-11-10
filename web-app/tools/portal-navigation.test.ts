import assert from 'node:assert/strict';
import test from 'node:test';
import { activePortalGroup, isPortalNavActive, PORTAL_NAV_GROUPS, visiblePortalItems } from '../src/lib/portal-navigation';

test('routes select their service without swallowing sales or administration into ISO', () => {
  for (const [path, group] of [
    ['/iso', 'iso'], ['/iso/adj', 'iso'], ['/iso/apply', 'iso'], ['/iso/applications/example', 'iso'],
    ['/iso/documents', 'iso'], ['/generator', 'kets'], ['/kets-contract', 'kets'],
    ['/p827/admin', 'p827'], ['/p827/lca-apply', 'p827'], ['/system', 'p827'], ['/hyundai-ghg/admin', 'hyundai'],
    ['/cbam/documents', 'cbam'], ['/iso/sales', 'sales'], ['/iso/sam', 'sales'],
    ['/iso/users', 'support'], ['/iso/coordination', 'support'],
  ]) assert.equal(activePortalGroup(path), group, path);
  assert.equal(activePortalGroup('/'), null);
  assert.equal(isPortalNavActive('/iso/applications/example', '/iso'), false);
});

test('CBAM deep links select exactly one tab including default and document contexts', () => {
  const group = PORTAL_NAV_GROUPS.find(group => group.id === 'cbam')!;
  for (const view of [null, 'applications', 'cn-checker', 'leads', 'invalid']) {
    const selected = group.items.filter(item => isPortalNavActive('/cbam/admin', item.href, view));
    assert.equal(selected.length, 1);
    assert.equal(selected[0].label, view === 'leads' ? 'Navigator 진단 접수' : view === 'cn-checker' ? 'CN 코드·제품 판정' : '신청서 관리');
  }
  assert.equal(group.items.filter(item => isPortalNavActive('/cbam/documents', item.href)).length, 1);
});

test('role and coordination ownership independently limit restricted navigation', () => {
  const sales = PORTAL_NAV_GROUPS.find(group => group.id === 'sales')!;
  const support = PORTAL_NAV_GROUPS.find(group => group.id === 'support')!;
  assert.deepEqual(visiblePortalItems(sales, false, false).map(item => item.href), ['/iso/sales']);
  assert.equal(visiblePortalItems(sales, true, false).length, 2);
  assert.deepEqual(visiblePortalItems(support, false, false), []);
  assert.deepEqual(visiblePortalItems(support, false, true).map(item => item.href), ['/iso/coordination']);
  assert.deepEqual(visiblePortalItems(support, true, false).map(item => item.href), ['/iso/users']);
  assert.equal(visiblePortalItems(support, true, true).length, 2);
});
