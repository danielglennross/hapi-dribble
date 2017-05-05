'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');

const expect = Code.expect;
const lab = Lab.script();
const describe = lab.describe;
const it = lab.it;

describe('filter responses', () => {

  const testFilter = (options, done) => {
    const server = new Hapi.Server();
    server.connection();

    server.register(require('../lib/index4'), () => {

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
          handler: (request, reply) =>
            reply(options.fixture).code(200)
        }
      });

      server.inject('/filter', (res) => {
        expect(JSON.parse(res.payload)).to.equal(options.expected);
        done();
      });
    });
  };

  it('should', (done) => {
    const filter = {
      omit: ['f.h'],
      allow: ['a.b', 'f', 'a.b.c'],
      deep: [{
        for: 'a.b', allow: ['c']
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
        h: 'h'
      }],
      i: 'i'
    };

    const expected = {
      a: {
        b: {
          c: 'c'
        }
      },
      f: [{
        g: 'g'
      }]
    };

    testFilter({ filter, fixture, expected }, done);
  });

  it('should', (done) => {
    const filter = {
      omit: ['f.g'],
      allow: ['a.e', 'f', 'a.b.c', 'j'],
      deep: [{
        for: 'j', allow: ['l']
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

});
