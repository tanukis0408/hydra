import { useCallback, useEffect, useMemo, useState } from "react";
import { levelDBService } from "@renderer/services/leveldb.service";

export const SYSTEM_CATEGORY_IDS = [
  "favorites",
  "playing",
  "want_to_play",
  "dropped",
] as const;

export type SystemCategoryId = (typeof SYSTEM_CATEGORY_IDS)[number];

export type CustomCategory = {
  id: string;
  label: string;
  visible: boolean;
};

export type ProfileCollectionsState = {
  systemVisibility: Record<SystemCategoryId, boolean>;
  customCategories: CustomCategory[];
  assignments: Record<string, string[]>;
};

const SUBLEVEL = "profileCollections";

const DEFAULT_STATE: ProfileCollectionsState = {
  systemVisibility: {
    favorites: true,
    playing: true,
    want_to_play: true,
    dropped: true,
  },
  customCategories: [],
  assignments: {},
};

const STATUS_CATEGORY_IDS: SystemCategoryId[] = [
  "playing",
  "want_to_play",
  "dropped",
];

const buildState = (raw: unknown): ProfileCollectionsState => {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STATE };
  const partial = raw as Partial<ProfileCollectionsState>;
  return {
    systemVisibility: {
      ...DEFAULT_STATE.systemVisibility,
      ...(partial.systemVisibility ?? {}),
    },
    customCategories: Array.isArray(partial.customCategories)
      ? partial.customCategories
          .filter((category) => category && typeof category.label === "string")
          .map((category) => ({
            id: category.id ?? crypto.randomUUID(),
            label: String(category.label),
            visible: category.visible !== false,
          }))
      : [],
    assignments:
      partial.assignments && typeof partial.assignments === "object"
        ? (partial.assignments as Record<string, string[]>)
        : {},
  };
};

export const buildProfileGameKey = (shop: string, objectId: string) =>
  `${shop}:${objectId}`;

export function useProfileCollections(userId?: string | null) {
  const [state, setState] = useState<ProfileCollectionsState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = useMemo(
    () => (userId ? String(userId) : null),
    [userId]
  );

  const persistState = useCallback(
    async (next: ProfileCollectionsState) => {
      if (!storageKey) return;
      setState(next);
      await levelDBService.put(storageKey, next, SUBLEVEL, "json");
      window.dispatchEvent(
        new CustomEvent("kraken:profile-collections-updated", {
          detail: { userId: storageKey },
        })
      );
    },
    [storageKey]
  );

  const loadState = useCallback(async () => {
    if (!storageKey) return;
    const stored = (await levelDBService.get(
      storageKey,
      SUBLEVEL,
      "json"
    )) as ProfileCollectionsState | null;
    setState(buildState(stored));
    setIsLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    setIsLoaded(false);
    void loadState();
  }, [loadState]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (!detail?.userId || detail.userId !== storageKey) return;
      void loadState();
    };
    window.addEventListener("kraken:profile-collections-updated", handler);
    return () => {
      window.removeEventListener("kraken:profile-collections-updated", handler);
    };
  }, [loadState, storageKey]);

  const setSystemVisibility = useCallback(
    (categoryId: SystemCategoryId, visible: boolean) => {
      if (!storageKey) return;
      void persistState({
        ...state,
        systemVisibility: {
          ...state.systemVisibility,
          [categoryId]: visible,
        },
      });
    },
    [persistState, state, storageKey]
  );

  const addCustomCategory = useCallback(
    (label: string) => {
      if (!storageKey) return false;
      const trimmed = label.trim();
      if (!trimmed) return false;
      const exists = state.customCategories.some(
        (category) =>
          category.label.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return false;

      const next: ProfileCollectionsState = {
        ...state,
        customCategories: [
          ...state.customCategories,
          { id: crypto.randomUUID(), label: trimmed, visible: true },
        ],
      };
      void persistState(next);
      return true;
    },
    [persistState, state, storageKey]
  );

  const removeCustomCategory = useCallback(
    (categoryId: string) => {
      if (!storageKey) return;
      const nextAssignments: Record<string, string[]> = {};
      Object.entries(state.assignments).forEach(([gameKey, categories]) => {
        const filtered = categories.filter((id) => id !== categoryId);
        if (filtered.length > 0) nextAssignments[gameKey] = filtered;
      });

      const next: ProfileCollectionsState = {
        ...state,
        customCategories: state.customCategories.filter(
          (category) => category.id !== categoryId
        ),
        assignments: nextAssignments,
      };
      void persistState(next);
    },
    [persistState, state, storageKey]
  );

  const toggleCustomCategoryVisibility = useCallback(
    (categoryId: string, visible: boolean) => {
      if (!storageKey) return;
      const next: ProfileCollectionsState = {
        ...state,
        customCategories: state.customCategories.map((category) =>
          category.id === categoryId ? { ...category, visible } : category
        ),
      };
      void persistState(next);
    },
    [persistState, state, storageKey]
  );

  const toggleGameCategory = useCallback(
    (gameKey: string, categoryId: string) => {
      if (!storageKey) return;
      const current = new Set(state.assignments[gameKey] ?? []);
      const isActive = current.has(categoryId);

      if (isActive) {
        current.delete(categoryId);
      } else {
        if (STATUS_CATEGORY_IDS.includes(categoryId as SystemCategoryId)) {
          STATUS_CATEGORY_IDS.forEach((statusId) => current.delete(statusId));
        }
        current.add(categoryId);
      }

      const nextAssignments = { ...state.assignments };
      if (current.size > 0) {
        nextAssignments[gameKey] = Array.from(current);
      } else {
        delete nextAssignments[gameKey];
      }

      void persistState({
        ...state,
        assignments: nextAssignments,
      });
    },
    [persistState, state, storageKey]
  );

  return {
    state,
    isLoaded,
    setSystemVisibility,
    addCustomCategory,
    removeCustomCategory,
    toggleCustomCategoryVisibility,
    toggleGameCategory,
  };
}
