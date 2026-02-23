import { useState, useCallback, useRef } from 'react';
import { composeProvisioningPlan, createProvisioningBridge } from '@byb/core';
import type {
  ProvisioningPlan,
  ProvisioningStage,
  StageExecutionResult,
  StoreProfile,
} from '@byb/core';
import { registerAllMockAdapters } from '@byb/adapter-mock';
import type { StoreAdapterSelections } from '@byb/core';

export type ProvisioningStatus = 'idle' | 'running' | 'completed' | 'failed';

/** Map any cloud profile to mock adapter IDs for the demo */
const MOCK_ADAPTERS: StoreAdapterSelections = {
  db: 'mock-db',
  storage: 'mock-storage',
  cdn: 'mock-cdn',
  email: 'mock-email',
  secrets: 'mock-secrets',
  scheduler: 'mock-scheduler',
  infra: 'mock-infra',
  dns: 'mock-dns',
  pipeline: 'mock-pipeline',
};

export interface StageProgress {
  stage: ProvisioningStage;
  executionResult?: StageExecutionResult;
  isActive: boolean;
}

export function useProvisioningRunner() {
  const [status, setStatus] = useState<ProvisioningStatus>('idle');
  const [plan, setPlan] = useState<ProvisioningPlan | null>(null);
  const [stageProgress, setStageProgress] = useState<StageProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const startProvisioning = useCallback(async (profile: StoreProfile) => {
    try {
      abortRef.current = false;
      setError(null);
      setStatus('running');

      // 1. Register mock adapters with delay for demo effect
      const registries = registerAllMockAdapters({ delay: 800 });

      // 2. Override profile adapter IDs to use mock adapters (demo mode)
      const demoProfile: StoreProfile = {
        ...profile,
        adapters: { ...MOCK_ADAPTERS },
      };

      // 3. Compose provisioning plan
      const provisioningPlan = composeProvisioningPlan(demoProfile);
      setPlan(provisioningPlan);

      // 4. Initialize stage progress
      const initialProgress: StageProgress[] = provisioningPlan.stages.map((stage) => ({
        stage,
        isActive: false,
      }));
      setStageProgress(initialProgress);

      // 5. Create bridge
      const bridge = createProvisioningBridge({
        adapterRegistries: registries,
        profile: demoProfile,
      });

      // 6. Execute stages one by one for visual progress
      const results: StageExecutionResult[] = [];

      for (let i = 0; i < provisioningPlan.stages.length; i++) {
        if (abortRef.current) break;

        const stage = provisioningPlan.stages[i]!;

        // Mark current stage as active
        setStageProgress((prev) =>
          prev.map((sp, idx) => ({
            ...sp,
            isActive: idx === i,
          })),
        );

        // Execute the stage
        const result = await bridge.executeStage(stage);
        results.push(result);

        // Update with result
        setStageProgress((prev) =>
          prev.map((sp, idx) => {
            if (idx === i) return { ...sp, executionResult: result, isActive: false };
            return sp;
          }),
        );
      }

      const hasFailed = results.some((r) => r.status === 'failed');
      setStatus(hasFailed ? 'failed' : 'completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provisioning failed');
      setStatus('failed');
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setPlan(null);
    setStageProgress([]);
    setError(null);
  }, []);

  return {
    status,
    plan,
    stageProgress,
    error,
    startProvisioning,
    reset,
  };
}
