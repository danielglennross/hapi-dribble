'use strict';

const Code = require('code');
const Lab = require('lab');

const filter = require('../../lib/dribble');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('proceesKeep', () => {

  it('should keep nested object property and non nested property', (done) => {
    const res = filter.processKeep(['a.b.c', 'g'], {
      a: {
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      },
      g: 'g'
    });

    expect(res).to.equal({
      a: {
        b: {
          c: 'c'
        }
      },
      g: 'g'
    });
    done();
  });

  it('should ensure object properties are assigned to the same parent object', (done) => {
    const res = filter.processKeep(['a.b.c', 'a.b.d'], {
      a: {
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      },
      g: 'g'
    });

    expect(res).to.equal({
      a: {
        b: {
          c: 'c',
          d: 'd'
        }
      }
    });
    done();
  });

  it('should keep nested object properties within an array', (done) => {
    const res = filter.processKeep(['a.b.c', 'g'], {
      a: [{
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      }],
      g: 'g'
    });

    expect(res).to.equal({
      a: [{
        b: {
          c: 'c'
        }
      }],
      g: 'g'
    });
    done();
  });

  it('should ensure object properties are assigned to the same parent object within an array', (done) => {
    const res = filter.processKeep(['a.b.c', 'a.b.d'], {
      a: {
        b: [{
          c: 'c',
          d: 'd'
        }],
        e: 'e'
      },
      g: 'g'
    });

    expect(res).to.equal({
      a: {
        b: [{
          c: 'c',
          d: 'd'
        }]
      }
    });
    done();
  });

  it('should keep all properties of nested property, if an object - array path', (done) => {
    const res = filter.processKeep(['a.b'], {
      a: [{
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      }],
      g: 'g'
    });

    expect(res).to.equal({
      a: [{
        b: {
          c: 'c',
          d: 'd'
        }
      }]
    });
    done();
  });

  it('should keep all properties of nested property, if an object - nested array path', (done) => {
    const res = filter.processKeep(['a.b'], {
      a: [{
        b: [{
          c: 'c',
          d: 'd'
        }],
        e: 'e'
      }],
      g: 'g'
    });

    expect(res).to.equal({
      a: [{
        b: [{
          c: 'c',
          d: 'd'
        }]
      }]
    });
    done();
  });

  it('should keep nested object properties within a multy element array', (done) => {
    const res = filter.processKeep(['a.b.c', 'a.b.d'], {
      a: [{
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      }, {
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      }],
      g: 'g'
    });

    expect(res).to.equal({
      a: [{
        b: {
          c: 'c',
          d: 'd'
        }
      }, {
        b: {
          c: 'c',
          d: 'd'
        }
      }]
    });
    done();
  });

  it('should keep nested object properties within a multy element nested array', (done) => {
    const res = filter.processKeep(['a.b.c', 'a.b.d'], {
      a: [{
        b: [{
          c: 'c',
          d: 'd'
        }],
        e: 'e'
      }, {
        b: [{
          c: 'c',
          d: 'd'
        }],
        e: 'e'
      }],
      g: 'g'
    });

    expect(res).to.equal({
      a: [{
        b: [{
          c: 'c',
          d: 'd'
        }]
      }, {
        b: [{
          c: 'c',
          d: 'd'
        }]
      }]
    });
    done();
  });

  it('should keep nested properties within a nested array and regular properties', (done) => {
    const res = filter.processKeep(['a.b', 'h'], [{
      h: 'h',
      a: [{
        b: [{
          c: 'c',
          d: 'd'
        }],
        e: 'e'
      }],
      g: 'g'
    }]);

    expect(res).to.equal([{
      h: 'h',
      a: [{
        b: [{
          c: 'c',
          d: 'd'
        }]
      }]
    }]);
    done();
  });

  it('should keep a nested object property within a jaggered array', (done) => {
    const res = filter.processKeep(['a.[].b'], {
      a: [
        [
          {
            b: 'b',
            c: 'c'
          }
        ]
      ]
    });

    expect(res).to.equal({
      a: [
        [
          {
            b: 'b'
          }
        ]
      ]
    });
    done();
  });

  it('should keep a jaggared array property', (done) => {
    const res = filter.processKeep(['a.[]'], {
      a: [
        [
          {
            b: 'b',
            c: 'c'
          }
        ],
        [
          {
            d: 'd'
          }
        ]
      ]
    });

    expect(res).to.equal({
      a: [
        [
          {
            b: 'b',
            c: 'c'
          }
        ],
        [
          {
            d: 'd'
          }
        ]
      ]
    });
    done();
  });

  it('should keep a nested object property within nested jaggered arrays', (done) => {
    const res = filter.processKeep(['[].a'], [
      [
        {
          a: 'a',
          b: 'b'
        }
      ]
    ]);

    expect(res).to.equal([
      [
        {
          a: 'a'
        }
      ]
    ]);
    done();
  });

});
