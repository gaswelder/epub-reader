import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/viewer/main.js',
  output: {
    file: 'public/bundle.js',
    format: 'iife'
  },
  plugins: [
    svelte({
      include: 'src/viewer/**/*.svelte',
      css: function (css) {
        css.write('main.css');
      },
    }),
    resolve()
  ]
}