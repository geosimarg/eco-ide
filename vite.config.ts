import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    // Configuração para Tauri
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            ignored: ['**/src-tauri/**'],
        },
    },
    build: {
        target: ['es2022', 'chrome100', 'safari15'],
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_DEBUG,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/codemirror')) return 'codemirror';
                    if (id.includes('node_modules/vue') || id.includes('node_modules/pinia')) return 'vue';
                    if (id.includes('node_modules/@tauri')) return 'tauri';
                },
            },
        },
    },
});
