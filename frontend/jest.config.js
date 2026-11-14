/** @type {import("jest").Config} **/
module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/tests/_support/jestSetup.js'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
        '^.+\\.jsx?$': 'babel-jest',
    },
    moduleNameMapper: {
        '\\.(css|scss|sass)$': '<rootDir>/tests/_support/styleMock.js',
        '\\.(svg|png|jpe?g|gif|woff2?)$': '<rootDir>/tests/_support/fileMock.js',
    },
    maxWorkers: '25%',
    collectCoverageFrom: ['src/**'],
    // Modest floors for the areas expanded by the coverage-gap plan. Raise as
    // page/viewer/media-page suites deepen; do not lower without documenting why.
    coverageThreshold: {
        './src/static/js/pages/': {
            lines: 25,
            functions: 20,
        },
        './src/static/js/components/media-viewer/': {
            lines: 40,
            functions: 40,
        },
        './src/static/js/components/media-page/': {
            lines: 50,
            functions: 55,
        },
    },
};
