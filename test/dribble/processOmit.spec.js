'use strict';

const Code = require('code');
const Lab = require('lab');

const filter = require('../../lib/dribble');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('proceesOmit', () => {

  it('should omit nested and non-nested object properties', (done) => {
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

  it('should omit parent object recursively if child is empty', (done) => {
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

  it('should omit nested object properties within an array with multiple elements', (done) => {
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

  it('should omit nested object properties within a single element array', (done) => {
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

  it('should omit entire nested object within an array', (done) => {
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

  it('should omit entire nested object within a nested array', (done) => {
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

  it('should omit entire nested object within a nested array and regular properties', (done) => {
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

  it('should omit object properties within a jaggered array', (done) => {
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

  it('should omit object properties within a nested jaggered array', (done) => {
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

  it('should omit parent object within jaggered array recursively if child object is empty', (done) => {
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

  it('should omit parent object within jaggered array recursively if child is jaggered array', (done) => {
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
