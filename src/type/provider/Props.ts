export type PropsWithErrorCapturing<P = unknown> = P & { capturing?: (e: unknown) => void };
