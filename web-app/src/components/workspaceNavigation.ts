export const PRODUCT_LINKS = [
  { label: 'ISO', href: '/iso', paths: ['/iso', '/iso/applications', '/iso/documents', '/iso/adj'] },
  { label: 'K-ETS', href: '/generator', paths: ['/generator', '/kets-contract'] },
  { label: 'P827', href: '/p827/admin', paths: ['/p827/admin', '/system'] },
  { label: 'CBAM', href: '/cbam/admin', paths: ['/cbam/admin', '/cbam/documents'] },
] as const;

export const productForPath = (pathname: string) =>
  PRODUCT_LINKS.find(product => product.paths.some(path => pathname === path || pathname.startsWith(`${path}/`)));

export const PRODUCT_WORKFLOWS: Record<string, { label: string; href: string }[]> = {
  ISO: [
    { label: '신청정보', href: '/iso/applications' },
    { label: '산정·견적·계약', href: '/iso' },
    { label: '문서·이력', href: '/iso/documents' },
  ],
  'K-ETS': [
    { label: '견적서', href: '/generator' },
    { label: '계약서', href: '/kets-contract' },
  ],
  P827: [
    { label: '신청정보', href: '/p827/admin' },
    { label: '산정·견적·계약', href: '/system' },
  ],
  CBAM: [{ label: '신청·산정·문서', href: '/cbam/admin' }],
};
