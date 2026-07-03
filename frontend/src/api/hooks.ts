// Hooks de React Query envolviendo el cliente de API.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAsOf } from "../hooks/useAsOf";
import { api } from "./client";
import type { Child, ChildCreate, CompleteRequest, CompleteResult, PurchaseResult } from "./types";

export const queryKeys = {
  child: (id: number) => ["child", id] as const,
  map: (childId: number, asOf?: string) => ["map", childId, asOf ?? "real"] as const,
  today: (childId: number, asOf?: string) => ["today", childId, asOf ?? "real"] as const,
  day: (dayNumber: number, childId: number, asOf?: string) =>
    ["day", dayNumber, childId, asOf ?? "real"] as const,
  progress: (childId: number, asOf?: string) => ["progress", childId, asOf ?? "real"] as const,
  store: (childId: number) => ["store", childId] as const,
};

export function useChildProfile(childId: number | null) {
  return useQuery({
    queryKey: queryKeys.child(childId ?? 0),
    queryFn: () => api.getChild(childId as number),
    enabled: childId != null,
    retry: false,
  });
}

export function useMap(childId: number | null) {
  const asOf = useAsOf();
  return useQuery({
    queryKey: queryKeys.map(childId ?? 0, asOf),
    queryFn: () => api.getMap(childId as number, asOf),
    enabled: childId != null,
  });
}

export function useDay(dayNumber: number, childId: number | null) {
  const asOf = useAsOf();
  return useQuery({
    queryKey: queryKeys.day(dayNumber, childId ?? 0, asOf),
    queryFn: () => api.getDay(dayNumber, childId as number, asOf),
    enabled: childId != null && Number.isFinite(dayNumber),
  });
}

export function useProgress(childId: number | null) {
  const asOf = useAsOf();
  return useQuery({
    queryKey: queryKeys.progress(childId ?? 0, asOf),
    queryFn: () => api.getProgress(childId as number, asOf),
    enabled: childId != null,
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation<Child, Error, ChildCreate>({
    mutationFn: (payload) => api.createChild(payload),
    onSuccess: (child) => {
      queryClient.setQueryData(queryKeys.child(child.id), child);
    },
  });
}

export function useStore(childId: number | null) {
  return useQuery({
    queryKey: queryKeys.store(childId ?? 0),
    queryFn: () => api.getStore(childId as number),
    enabled: childId != null,
  });
}

export function usePurchase() {
  const queryClient = useQueryClient();
  return useMutation<PurchaseResult, Error, { childId: number; itemKey: string }>({
    mutationFn: ({ childId, itemKey }) => api.purchase(childId, itemKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useCompleteDay() {
  const queryClient = useQueryClient();
  return useMutation<CompleteResult, Error, CompleteRequest>({
    mutationFn: (payload) => api.completeDay(payload),
    onSuccess: () => {
      // Al completar, refrescamos mapa y progreso.
      queryClient.invalidateQueries({ queryKey: ["map"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["day"] });
    },
  });
}
