import json from 'rollup-plugin-json';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default ({
    entry: 'index.js',
    external: ['three.js','three'],
    plugins: [json(), nodeResolve(), commonjs()]
});