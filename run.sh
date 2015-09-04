#!/bin/bash
rm test_ma.js
tsc --experimentalDecorators --emitDecoratorMetadata --target es6 test_ma.ts > /dev/null
babel -o test_ma.js --blacklist regenerator test_ma.js 
node test_ma.js
#rm test_ma.js