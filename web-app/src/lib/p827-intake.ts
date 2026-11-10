import { createDefaultP827Application, P827_GHG_GASES, type P827ApplicationInput } from './p827-application';

// The Hyundai copy accepts the same fields and required information as the P827 form.
// Internal pricing and workflow properties are deliberately excluded.
export function parseP827Intake(value: unknown): P827ApplicationInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('P827 신청서 내용을 확인해 주세요.');
  const raw = value as Record<string, unknown>;
  const defaults = createDefaultP827Application();
  const input: Record<string, unknown> = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    const item = raw[key] === undefined ? defaultValue : raw[key];
    if (Array.isArray(defaultValue)) {
      if (!Array.isArray(item)) throw new Error('P827 선택 항목을 확인해 주세요.');
      if (key === 'scope3Categories') {
        if (item.length !== 15 || !item.every(value => typeof value === 'boolean')) throw new Error('Scope 3 카테고리를 확인해 주세요.');
      } else {
        const allowed: readonly string[] = key === 'ghgGases' ? P827_GHG_GASES : ['claim', 'direct', 'energy_indirect', 'other_indirect', 'removals'];
        if (!item.every(value => typeof value === 'string' && allowed.includes(value))) throw new Error('온실가스·배출 범위 선택값을 확인해 주세요.');
      }
      input[key] = [...item];
    } else {
      if (typeof item !== typeof defaultValue || (typeof item === 'string' && item.length > 5000)) throw new Error('P827 입력값의 형식과 길이를 확인해 주세요.');
      input[key] = typeof item === 'string' ? item.trim() : item;
    }
  }
  const result = input as P827ApplicationInput;
  if (![result.organisationName, result.contactName, result.phone, result.email].every(Boolean) || result.consent !== true) throw new Error('회사명, 담당자, 이메일, 전화번호와 동의를 확인해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new Error('이메일 형식을 확인해 주세요.');
  if (!['organisation_verification', 'project_validation', 'project_verification', 'project_validation_verification'].includes(result.engagementType) || !['limited', 'reasonable'].includes(result.assuranceLevel) || !['professional', 'quantitative'].includes(result.materialityType)) throw new Error('업무 유형, 보증 수준, 중요성을 확인해 주세요.');
  if (!result.scope3) result.scope3Categories = Array(15).fill(false);
  return result;
}
