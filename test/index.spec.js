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

    server.register(require('../'), () => {

      server.route({
        method: 'GET',
        path: '/filter',
        config: {
          plugins: {
            dribble: {
              all: {
                rule: () => true,
                items: options.items
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

  // it('test', (done) => {
  //   testFilter({
  //     items: [
  //       { omit: ['a.b', 'c'] },
  //       { for: 'e.f', omit: ['g', 'h'] },
  //       { for: 'j.k.l', omit: ['x', 'v.b'] }
  //     ],
  //     fixture: {

  //     },
  //     expected: {

  //     }
  //   }, done);
  // });

  // it('should foward on response if no condition is met', (done) => {
  //   done();
  // });

  // it('should filter items if condition is met', (done) => {
  //   done();
  // });

  // it('should filter items by the first condition met', (done) => {
  //   done();
  // });

  it('should omit a single property', (done) => {
    testFilter({
      items: [
        { omit: ['a'] }
      ],
      fixture: {
        a: 'a',
        b: 'b'
      },
      expected: {
        b: 'b'
      }
    },
    done);
  });

  it('should omit multiple properties', (done) => {
    testFilter({
      items: [
        { omit: ['a', 'b'] }
      ],
      fixture: {
        a: 'a',
        b: 'b',
        c: 'c'
      },
      expected: {
        c: 'c'
      }
    },
    done);
  });

  it('should allow a single property', (done) => {
    testFilter({
      items: [
        { allow: ['a'] }
      ],
      fixture: {
        a: 'a',
        b: 'b'
      },
      expected: {
        a: 'a'
      }
    },
    done);
  });

  it('should allow multiple properties', (done) => {
    testFilter({
      items: [
        { allow: ['a', 'b'] }
      ],
      fixture: {
        a: 'a',
        b: 'b',
        c: 'c'
      },
      expected: {
        a: 'a',
        b: 'b'
      }
    },
    done);
  });

  it('should not attempt to unset a non-existing parent obj when empty', (done) => {
    testFilter({
      items: [
        { omit: ['a', 'b'] }
      ],
      fixture: {
        a: 'a',
        b: 'b'
      },
      expected: {}
    },
    done);
  });

  it('should omit single nested object property', (done) => {
    testFilter({
      items: [
        { omit: ['a.b'] }
      ],
      fixture: {
        a: {
          b: 'b',
          c: 'c'
        }
      },
      expected: {
        a: {
          c: 'c'
        }
      }
    },
    done);
  });

  it('should omit multiple nested object properties', (done) => {
    testFilter({
      items: [
        { omit: ['a.b', 'd.e'] }
      ],
      fixture: {
        a: {
          b: 'b',
          c: 'c'
        },
        d: {
          e: 'e'
        }
      },
      expected: {
        a: {
          c: 'c'
        }
      }
    },
    done);
  });

  it('should allow single nested object property', (done) => {
    testFilter({
      items: [
        { allow: ['a.b'] }
      ],
      fixture: {
        a: {
          b: 'b',
          c: 'c'
        }
      },
      expected: {
        a: {
          b: 'b'
        }
      }
    },
    done);
  });

  it('should allow multiple nested object properties', (done) => {
    testFilter({
      items: [
        { allow: ['a.b', 'd.e'] }
      ],
      fixture: {
        a: {
          b: 'b',
          c: 'c'
        },
        d: {
          e: 'e'
        }
      },
      expected: {
        a: {
          b: 'b'
        },
        d: {
          e: 'e'
        }
      }
    },
    done);
  });

  it('should remove nested object if no properties left', (done) => {
    testFilter({
      items: [
        { omit: ['a.b', 'a.c'] }
      ],
      fixture: {
        a: {
          b: 'b',
          c: 'c'
        },
        d: {
          e: 'e'
        }
      },
      expected: {
        d: {
          e: 'e'
        }
      }
    },
    done);
  });

  it('should omit twice nested object properties', (done) => {
    testFilter({
      items: [
        { omit: ['a.b.c'] }
      ],
      fixture: {
        a: {
          b: {
            c: 'c',
            d: 'd'
          }
        }
      },
      expected: {
        a: {
          b: {
            d: 'd'
          }
        }
      }
    },
    done);
  });

  it('should omit twice nested object properties, first one array', (done) => {
    testFilter({
      items: [
        { omit: ['a.b'] }
      ],
      fixture: [{
        a: {
          b: 'b',
          c: 'c'
        }
      }],
      expected: [{
        a: {
          c: 'c'
        }
      }]
    },
    done);
  });

  it('should omit nested object properties, second one array', (done) => {
    testFilter({
      items: [
        { omit: ['a.b'] }
      ],
      fixture: {
        a: [{
          b: 'b',
          c: 'c'
        }]
      },
      expected: {
        a: [{
          c: 'c'
        }]
      }
    },
    done);
  });

  it('should omit nested object properties, first & second one arrays', (done) => {
    testFilter({
      items: [
        { omit: ['a.b'] }
      ],
      fixture: [{
        a: [{
          b: [{
            c: 'c'
          }],
          c: 'c'
        }]
      }],
      expected: [{
        a: [{
          c: 'c'
        }]
      }]
    },
    done);
  });



  it('should allow twice nested object properties', (done) => {
    testFilter({
      items: [
        { allow: ['a.b.c'] }
      ],
      fixture: {
        a: {
          b: {
            c: 'c',
            d: 'd'
          }
        }
      },
      expected: {
        a: {
          b: {
            c: 'c'
          }
        }
      }
    },
    done);
  });

  it('should allow twice nested object properties, first one array', (done) => {
    done();
  });

  it('should allow twice nested object properties, second one array', (done) => {
    done();
  });

  it('should allow twice nested object properties, first & second one arrays', (done) => {
    done();
  });

  it('should remove nested object if no nested properties left', (done) => {
    done();
  });


  it('should allow multiple filter items', (done) => {
    done();
  });

});
