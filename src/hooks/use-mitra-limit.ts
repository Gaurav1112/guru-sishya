"use client";

import { useFeatureLimit } from "./use-feature-limit";

export function useMitraLimit() {
  return useFeatureLimit("mitra");
}
