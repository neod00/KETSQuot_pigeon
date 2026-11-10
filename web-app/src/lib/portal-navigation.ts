export interface PortalNavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
  ownerOnly?: boolean;
}

export interface PortalNavGroup {
  id: string;
  label: string;
  section: '업무 분야' | '영업·지원';
  href?: string;
  items: PortalNavItem[];
}

export const PORTAL_NAV_GROUPS: PortalNavGroup[] = [
  { id: 'iso', label: 'ISO 인증', section: '업무 분야', items: [
    { label: '신청서 접수함', href: '/iso/applications' },
    { label: 'ISO 37001 · 37301 신청서', href: '/iso/apply' },
    { label: '견적·계약 작성', href: '/iso' },
    { label: '문서함', href: '/iso/documents' },
  ] },
  { id: 'kets', label: 'K-ETS 검증', section: '업무 분야', items: [
    { label: '견적 작성', href: '/generator' },
    { label: '계약서 작성', href: '/kets-contract' },
  ] },
  { id: 'p827', label: 'P827 검증', section: '업무 분야', items: [
    { label: '신청서 관리', href: '/p827/admin' },
    { label: 'LCA 솔루션 신청서', href: '/p827/lca-apply' },
    { label: '견적·계약 작성', href: '/system' },
  ] },
  { id: 'hyundai', label: '현대차 협력사 GHG', section: '업무 분야', href: '/hyundai-ghg/admin', items: [] },
  { id: 'cbam', label: 'CBAM', section: '업무 분야', items: [
    { label: '신청서 관리', href: '/cbam/admin?view=applications' },
    { label: 'CN 코드·제품 판정', href: '/cbam/admin?view=cn-checker' },
    { label: 'Navigator 진단 접수', href: '/cbam/admin?view=leads' },
  ] },
  { id: 'sales', label: '영업 관리', section: '영업·지원', items: [
    { label: '세일즈 현황·D365', href: '/iso/sales' },
    { label: '전략고객 관리 (SAM)', href: '/iso/sam', adminOnly: true },
  ] },
  { id: 'support', label: '관리·지원', section: '영업·지원', items: [
    { label: '조정 에이전트', href: '/iso/coordination', ownerOnly: true },
    { label: '팀원 관리', href: '/iso/users', adminOnly: true },
  ] },
];

export function visiblePortalItems(group: PortalNavGroup, admin: boolean, owner: boolean) {
  return group.items.filter(item => (!item.adminOnly || admin) && (!item.ownerOnly || owner));
}

export function isPortalNavActive(pathname: string, href: string, view: string | null = null) {
  const [path, query] = href.split('?');
  if (path === '/') return pathname === '/';
  if (path === '/iso') return pathname === '/iso' || pathname === '/iso/adj';
  if (query) {
    const target = new URLSearchParams(query).get('view');
    if (pathname === '/cbam/documents') return target === 'applications';
    const current = view === 'cn-checker' || view === 'leads' ? view : 'applications';
    return pathname === path && current === target;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function activePortalGroup(pathname: string, view: string | null = null) {
  return PORTAL_NAV_GROUPS.find(group => group.href
    ? isPortalNavActive(pathname, group.href, view)
    : group.items.some(item => isPortalNavActive(pathname, item.href, view)))?.id ?? null;
}
