'use strict';

var rollup = require( 'rollup' ),
    npm = require( 'rollup-plugin-npm' ),
    commonjs = require( 'rollup-plugin-commonjs' );

console.log( 'testing js' );
console.log( 'start' );

rollup.rollup({
    entry: './test/test.js',
    plugins: [
        npm({ jsnext: true }),
        commonjs({ include: 'node_modules/**' })
    ],
    external: [ 'tape' ]
}).catch(function ( err ) {
    console.log( 'err' );
    console.log( err );
}).then( function ( bundle ) {

    console.log( 'writing' );

    bundle.write({
        dest: './build/test_suite.js',
        format: 'cjs',
        globals: {
            THREE: 'THREE',
            self: {}
        }
    }).then(function () {
        console.log( 'done' );
    });

}).catch( function ( err ) {
    console.err( err );
});