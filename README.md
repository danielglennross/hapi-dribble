# hapi-dribble
`hapi-dribble` allows api responses to be filtered dynamically based upon a `request` state.

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
            rule: (request) => 
              request.auth.credentials.scope.includes('admin'),
            filter: {
              omit: ['user.id']
              deep: [ 
                { for: 'user.data', omit: ['personal'] }
              ]
            }
          },
          hasSuperAdminScope: {
            rule: (request) => 
              request.auth.credentials.scope.includes('super-admin'),
            filter: {
              keep: ['user', 'meta']
              deep: [ 
                { for: 'user.data', omit: ['personal'] }
              ]
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
Objects consisting of a `rule` and `filter` can be assigned to the `dribble` plugin object.
The first rule that evaluates to `true` will be used by dribble in order to conditionally filter the response. 
The schema defined in the `filter` will be used to process the data.


Filters can specify `keep`, `omit` and `deep` properties. All are optional, `keep` is processed first, followed by `omit` and finally `deep`.
This order may be critical to your design. 

`keep` and `omit` are string arrays representing property paths.
Properties specified in these paths can be nested objects, nested arrays, jaggered arrays, or a combination of any of these. 
`deep` is slightly different. Here, an array of objects is specified, with `for` - a string property path pointing to a nested property object, and
`omit` or `keep` array detailing first class properties on the object pointed to by `for`.


Some example property paths are outlined below:


- flat object
```javascript
{
  a: 'a',
  b: 'b',
  c: 'c' 
}
```
`'c'` - this path points to the first class property 'c' on the above object

- nested object
```javascript
{
  a: {
    b: 'b'
    c: 'c'
  }
}
```
`'a.c'` - this path points to the nested property 'c' on the above object

- object within an array (or a nested array)
```javascript
[
  a: {
    b: 'b'
    c: [{
      d: 'd' 
    }, {
      d: 'd'
    }]
  }
]
```
`'a.c.d'` - this path points to the nested array properties 'd' on the above object

- object within a jaggered array
```javascript
[
  [{
    a: 'a',
    b: 'b'
  }, {
    a: 'a',
    b: 'b'
  }]
]
```
`'[].a'` - this path points to the nested jaggered array properties 'a' on the above object


## Example


Given the following object:
```javascript
 {
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
}
```
When the following filter is applied
```javascript
{
  omit: ['f.g'],
  keep: ['a.e', 'f', 'a.b.c', 'j'],
  deep: [{
    for: 'j', keep: ['l']
  }]
};
```
The object is transformed to:
```javascript
{
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
```

Note: 
- A filter array containing any inferred properties are reduced to lowest parent property during processing. For example, take the following object:
```javascript
{
  a: {
    b: {
      c: 'c'
      d: 'd'
    }
  }
}
```
A filter which specifies: `Keep: ['a.b.c', 'a.b']` is reduced to: `Keep: ['a.b']` as pointing to path `'a.b'` will keep all of the properties in object `b` (`'c'` here is inferred).

- If the path contains an array property, it is assumed each item in the array has a consistent schema.