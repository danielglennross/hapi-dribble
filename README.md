# hapi-dribble
`hapi-dribble` allows api responses to be filtered dynamically based upon the `server.request` state.

## Install
`npm install --save hapi-dribble`

## Usage
```javascript

server.register({
  register: require('hapi-dribble'),
  options
}, (err) => {
  
  server.route({
    method: 'GET',
    path: '/users',
    config: {
      auth: 'session',
      plugins: {
        dribble: {
          hasAdminScope: {
            rule: (request) => request.auth.credentials.scope.includes('admin')
            filter: {
              omit: ['user.id']
              deep: {[ 
                { for: 'user.data': omit: ['personal'] }
              ]}
            }
          },
          hasSuperAdminScope: {
            rule: (request) => request.auth.credentials.scope.includes('super-admin')
            filter: {
              keep: ['user', 'meta']
              deep: {[ 
                { for: 'user.data': omit: ['personal'] }
              ]}
            }
          }
        }
      },
      handler: (request, reply) =>
        reply(request.auth.artifacts.scopeContext).code(200)
    }
  });

});
```

The first matching rule will be used by dribble inorder to grab the filter that will be applied to the response.

Filters can specify a `keep`, `omit` and `deep` properties. All are optional, `keep` is ran first, followed by `omit`, and finally `deep`.
This order may be critical to your design. 

Properties specified in these can be nested objects, nested arrays, jaggered arrays, or a combination of any of these. For example:

- flat object
- nested object
- object within an array
- object within a jaggered array

Note: A filter array containing any inferred properties are reduced to lowest parent property during processing. For example an array:
{
  a: {
    b: {
      c: 'c'
      d: 'd'
    }
  }
}
Keep: ['a.b.c', 'a.b']
is reduced to:
Keep: ['a.b']
as keeping 'a.b' will keep all of b's properties ('c' here is inferred)