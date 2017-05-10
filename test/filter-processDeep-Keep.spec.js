'use strict';

const Code = require('code');
const Lab = require('lab');

const filter = require('../lib/index3');

const expect = Code.expect;
const lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('processDeep Keep', () => {

  it('should', (done) => {
    const res = filter.processDeep({ for: 'a.b', allow: ['c', 'd'] }, {
      a: {
        b: {
          c: 'c',
          d: 'd',
          e: 'e'
        },
        f: 'f'
      },
      g: 'g'
    });

    expect(res).to.equal({
      a: {
        b: {
          c: 'c',
          d: 'd'
        },
        f: 'f'
      },
      g: 'g'
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processDeep({ for: 'a.b', allow: ['c', 'd'] }, {
      a: [{
        b: {
          c: 'c',
          d: 'd',
          e: 'e'
        },
        f: 'f'
      }, {
        b: {
          c: 'c',
          d: 'd',
          e: 'e'
        },
        f: 'f'
      }],
      g: 'g'
    });

    expect(res).to.equal({
      a: [{
        b: {
          c: 'c',
          d: 'd'
        },
        f: 'f'
      }, {
        b: {
          c: 'c',
          d: 'd'
        },
        f: 'f'
      }],
      g: 'g'
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processDeep({ for: 'a.[].b', allow: ['c', 'd'] }, {
      a: [
        [
          {
            b: {
              c: 'c',
              d: 'd',
              e: 'e'
            },
            f: 'f'
          }
        ]
      ],
      g: 'g'
    });

    expect(res).to.equal({
      a: [
        [
          {
            b: {
              c: 'c',
              d: 'd'
            },
            f: 'f'
          }
        ]
      ],
      g: 'g'
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processDeep({ for: 'a.[].[].b', allow: ['c', 'd'] }, {
      a: [
        [
          [
            {
              b: {
                c: 'c',
                d: 'd',
                e: 'e'
              },
              f: 'f'
            }
          ]
        ]
      ],
      g: 'g'
    });

    expect(res).to.equal({
      a: [
        [
          [
            {
              b: {
                c: 'c',
                d: 'd'
              },
              f: 'f'
            }
          ]
        ]
      ],
      g: 'g'
    });
    done();
  });

});
