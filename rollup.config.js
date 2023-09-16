import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true
    },
    {
      file: 'dist/es/index.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
    }
  ],
  external: ['@rolster/helpers-advanced'],
  plugins: [
    commonjs(),
    resolve(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      include: ['node_modules/@rolster/types/index.d.ts']
    })
  ]
};
