'use strict';

const Code = require('code');
const Lab = require('lab');

const filter = require('../lib/index3');

const expect = Code.expect;
const lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('proceesKeep', () => {

  it('should', (done) => {
    const res = filter.processOmit(['a.b.c', 'g'], {
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
          d: 'd'
        },
        e: 'e'
      }
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.b.c'], {
      a: {
        b: {
          c: 'c'
        }
      },
      g: 'g'
    });

    expect(res).to.equal({
      g: 'g'
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.b.c'], {
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
      }],
      g: 'g'
    });

    expect(res).to.equal({
      a: [{
        b: {
          d: 'd'
        }
      }, {
        b: {
          d: 'd'
        }
      }],
      g: 'g'
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.b.c', 'g'], {
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
          d: 'd'
        },
        e: 'e'
      }]
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.b'], {
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
        e: 'e'
      }],
      g: 'g'
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.b'], {
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
        e: 'e'
      }],
      g: 'g'
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.b', 'h'], [{
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
      a: [{
        e: 'e'
      }],
      g: 'g'
    }]);
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.[].b'], {
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
            c: 'c'
          }
        ]
      ]
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.[].[].b'], {
      a: [
        [
          [
            {
              b: 'b',
              c: 'c'
            }
          ]
        ]
      ]
    });

    expect(res).to.equal({
      a: [
        [
          [
            {
              c: 'c'
            }
          ]
        ]
      ]
    });
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.[].[].b'], {
      a: [
        [
          [
            {
              b: 'b'
            }
          ]
        ]
      ]
    });

    expect(res).to.equal({});
    done();
  });

  it('should', (done) => {
    const res = filter.processOmit(['a.[].[]'], {
      a: [
        [
          [
            {
              b: 'b',
              c: 'c'
            }
          ]
        ]
      ]
    });

    expect(res).to.equal({});
    done();
  });

});
