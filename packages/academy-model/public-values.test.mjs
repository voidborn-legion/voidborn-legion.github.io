import test from 'node:test';import assert from 'node:assert/strict';import {publicGameValues} from './public-values.mjs';
test('public projection excludes both unpublished and unverified game values',()=>{
 const base={id:'value:synthetic',verification:{status:'verified'},publication:'published'};
 const result=publicGameValues([base,{...base,id:'value:draft',publication:'draft'},{...base,id:'value:unverified',verification:{status:'unverified'}},{...base,id:'value:legacy',publication:undefined}]);
 assert.deepEqual(result,[base]);result[0].verification.status='changed';assert.equal(base.verification.status,'verified');
});
