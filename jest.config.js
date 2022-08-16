module.exports = {
    verbose: true,
    silent: true,
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    collectCoverage: true,
    coverageReporters: ['text', 'text-summary'],
};
