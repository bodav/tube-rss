import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const base = process.env.BASE_PATH ?? '';

export default defineConfig({
	base,
	plugins: [tailwindcss(), sveltekit()]
});
