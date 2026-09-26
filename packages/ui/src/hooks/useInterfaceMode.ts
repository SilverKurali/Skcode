import { useSkcodeStoreWithDefault } from "@/store/StoreProvider.js";

export function useIsOfficeMode(): boolean {
  return useSkcodeStoreWithDefault((state) => state.interfaceMode === "office", false);
}
