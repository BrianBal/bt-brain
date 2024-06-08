import { defineConfig } from "vite"
import { resolve } from "path"
import dts from "vite-plugin-dts"

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, "src/extension.ts"),
            formats: ["cjs"],
        },
        rollupOptions: {
            external: ["vscode"],
            output: {
                globals: { vscode: "vscode" },
            },
        },
        ssr: true,
    },
    resolve: { alias: { src: resolve("src/") } },
    plugins: [dts()],
})
