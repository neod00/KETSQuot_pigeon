import { createDefaultCbamApplication, type CbamApplicationInput } from './cbam';
import { CHOICE_FIELDS } from './cbam-intake-schema';

type ChoiceKey = keyof typeof CHOICE_FIELDS;
export type PublicCbamApplicationDraft = Omit<CbamApplicationInput, ChoiceKey> & {
  [K in ChoiceKey]: CbamApplicationInput[K] | '';
};

// Public applicants must confirm their own scope and readiness. Internal
// calculation defaults remain available for existing administrative workflows.
export function createPublicCbamApplication(): PublicCbamApplicationDraft {
  return {
    ...createDefaultCbamApplication(),
    clientType: '', serviceType: '', remoteAccess: '', communicationTemplate: '',
    mmdStatus: '', carbonPrice: '', previouslyVerified: '', goodsComplexity: '', biomass: '',
    country: '', verificationYears: [], operatorCount: '', processCount: '', goodsCount: '', dataPersonnel: '',
  };
}
