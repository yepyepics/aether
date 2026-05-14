import { createSignal } from "solid-js";

export const [isEngineUpdating, setIsEngineUpdating] = createSignal(false);
export const [engineUpdatePct, setEngineUpdatePct] = createSignal(0);
