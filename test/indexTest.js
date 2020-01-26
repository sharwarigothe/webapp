// const assert = require('chai').assert;
// const index = require("../index");

// describe("Test about index file", function(){
//     describe("Tests addition", function(){
//         it("Tests addition functionality", function(){
//             let result = index.add(5,4);
//             assert.equal(result,9);
//         })
//     })
// })


const assert = require('assert');
describe('Simple Math Test', () => {
 it('should return 2', () => {
        assert.equal(1 + 1, 2);
    });
 it('should return 9', () => {
        assert.equal(3 * 3, 9);
    });
});