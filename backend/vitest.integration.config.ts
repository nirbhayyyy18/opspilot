import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["integration-tests/**/*.test.ts"],
        testTimeout: 30000,
        hookTimeout: 30000,
        clearMocks: true,
        env: {
            NODE_ENV: "test"
        },
    },
});