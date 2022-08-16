export const capture = (e: unknown, cb?: (e: unknown) => void) => {
    if (cb) cb(e);
};
