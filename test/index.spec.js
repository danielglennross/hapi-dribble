'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');

const expect = Code.expect;
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('index', () => {

  const testFilter = async (options, done) => {
    const server = Hapi.server();

    await server.register(require('../lib'))

    server.route({
      method: 'GET',
      path: '/filter',
      config: {
        plugins: {
          dribble: {
            all: {
              rule: () => true,
              filter: options.filter
            }
          }
        },
        handler: (request, h) =>
          h.response(options.fixture).code(200)
      }
    });

    const injectOptions = {
      method: 'GET',
      url: '/filter'
    };

    const res = await server.inject(injectOptions);

    expect(JSON.parse(res.payload)).to.equal(options.expected);
    done();
  };

  it('should filter complicated random object, keep has a.b.c inferred by a.b', (done) => {
    const filter = {
      omit: ['f.h'],
      keep: ['a.b', 'f', 'a.b.c']
    };

    const fixture = {
      a: {
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      },
      f: [{
        g: 'g',
        h: 'h'
      }],
      i: 'i'
    };

    const expected = {
      a: {
        b: {
          c: 'c',
          d: 'd'
        }
      },
      f: [{
        g: 'g'
      }]
    };

    testFilter({ filter, fixture, expected }, done);
  });

  it('should filter complicated random object - single deep', (done) => {
    const filter = {
      omit: ['f.g'],
      keep: ['a.e', 'f', 'a.b.c', 'j'],
      deep: [{
        for: 'j', keep: ['l']
      }]
    };

    const fixture = {
      a: {
        b: {
          c: 'c',
          d: 'd'
        },
        e: 'e'
      },
      f: [{
        g: 'g',
        h: [{
          i: 'i'
        }]
      }],
      j: {
        k: 'k',
        l: 'l'
      }
    };

    const expected = {
      a: {
        b: {
          c: 'c'
        },
        e: 'e'
      },
      f: [{
        h: [{
          i: 'i'
        }]
      }],
      j: {
        l: 'l'
      }
    };

    testFilter({ filter, fixture, expected }, done);
  });

  it('should filter complicated random object - multiple deeps', (done) => {
    const filter = {
      omit: ['g.h'],
      keep: ['a.b', 'g', 'a.b.c'],
      deep: [
        { for: 'a.b', keep: ['c'] },
        { for: 'a.b', keep: ['d'] }
      ]
    };

    const fixture = {
      a: {
        b: {
          c: 'c',
          d: 'd',
          e: 'e'
        },
        f: 'f'
      },
      g: [{
        h: 'h',
        i: 'i'
      }],
      j: 'j'
    };

    const expected = {
      a: {
        b: {
          c: 'c',
          d: 'd'
        }
      },
      g: [{
        i: 'i'
      }]
    };

    testFilter({ filter, fixture, expected }, done);
  });

});
