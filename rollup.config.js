import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/es/lib.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
    },
    {
      file: 'dist/cjs/lib.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true
    }
  ],
  external: ['reflect-metadata'],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      include: ['node_modules/@rolster/typescript-types/index.d.ts']
    })
  ]
};
