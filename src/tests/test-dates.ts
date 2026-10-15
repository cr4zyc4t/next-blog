/** Small ms-offset helpers (no date library needed). */
export const subMinutesMs = (n: number) => n * 60_000
export const subDaysMs = (n: number) => n * 86_400_000
export const addDaysMs = (n: number) => n * 86_400_000
