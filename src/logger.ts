const verbose = Bun.env.VERBOSE?.toLowerCase();
const logVerbose = verbose === '1' || verbose === 'true';

/* oxlint-disable no-console */
export const logger = {
  info: (...args: unknown[]) => {
    if (!logVerbose) return;
    console.log(...args);
  },

  log: (...args: unknown[]) => {
    if (!logVerbose) return;
    console.log(...args);
  },

  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
