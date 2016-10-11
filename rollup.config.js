import typescript from 'rollup-plugin-typescript';
import npm from "rollup-plugin-node-resolve";

export default {
  entry: './app.ts',
  dest: './bundle.js',
  format: 'iife',
  plugins: [
    npm({jsnext: true}),
    typescript()
  ]
};
