'use strict';

const _ = require('lodash');

/* eslint-disable no-param-reassign */

const allowItems = (array, item) => {
  const getObjPropertyAsArray = (obj, propName) => {
    if (obj instanceof Array) {
      return obj.reduce((arr, i) => {
        if (i[propName]) {
          arr = arr.concat(i[propName]);
        }
        return arr;
      }, []);
    }
    // obj is not an array, convert our property to an array
    return [].concat(obj[propName] || {});
  };

  const walkAndUnsetProps = (propNamesToWalk, currentProp, previousProp) => {
    if (propNamesToWalk.length < 1) {
      return;
    }

    const [head, ...tail] = propNamesToWalk;
    currentProp = [].concat(currentProp);

    if (propNamesToWalk.length === 1) {
      currentProp.forEach(prop => {
        const keys = Object.keys(prop);
        keys.forEach(k => {
          if (k !== head) {
            delete prop[k];
          }
        });
      });
    } else {
      previousProp = [].concat(currentProp);
      currentProp = getObjPropertyAsArray(currentProp, head);

      walkAndUnsetProps(tail, currentProp, previousProp);

      // walking back out:
      // if currentProp is now an empty object
      // unset it from it's parent (if exists)
      if (previousProp) {
        currentProp.forEach((current) => {
          if (_.isEmpty(current)) {
            previousProp.forEach(previous => delete previous[head]);
          }
        });
      }
    }
  };

  array.forEach(el => {  
    walkAndUnsetProps(el.split('.'), item);
  });

  return item;
};

// el: a.b.c.d

const removeItems = (array, item) => {
  const getObjPropertyAsArray = (obj, propName) => {
    if (obj instanceof Array) {
      return obj.reduce((arr, i) => {
        if (i[propName]) {
          arr = arr.concat(i[propName]);
        }
        return arr;
      }, []);
    }
    // obj is not an array, convert our property to an array
    return [].concat(obj[propName] || {});
  };

  const walkAndUnsetProps = (propNamesToWalk, currentProp, previousProp) => {
    if (propNamesToWalk.length < 1) {
      return;
    }

    const [head, ...tail] = propNamesToWalk;
    currentProp = [].concat(currentProp);

    if (propNamesToWalk.length === 1) {
      currentProp.forEach(prop => {
        delete prop[head];
      });
    } else {
      previousProp = [].concat(currentProp);
      currentProp = getObjPropertyAsArray(currentProp, head);

      walkAndUnsetProps(tail, currentProp, previousProp);

      // walking back out:
      // if currentProp is now an empty object
      // unset it from it's parent (if exists)
      if (previousProp) {
        currentProp.forEach((current) => {
          if (_.isEmpty(current)) {
            previousProp.forEach(previous => delete previous[head]);
          }
        });
      }
    }
  };

  array.forEach(el => {  
    walkAndUnsetProps(el.split('.'), item);
  });

  return item;
};

// el: a.b.c.d

const addItems = (array, item) => {
  const walkAndAddProps = (propNamesToWalk, currentProp, objToBuild) => {
    if (propNamesToWalk.length < 1) {
      return;
    }

    // if we have nested properties, keep walking through
    const [head, ...tail] = propNamesToWalk;

    // last property
    if (propNamesToWalk.length === 1) {
      if (Array.isArray(currentProp)) {
        currentProp.reduce((obj, cp) => {
          Object.assign(obj, { [head]: cp[head] });
          return obj;
        }, objToBuild);
      } else {
        objToBuild[head] = currentProp[head];
      }
      return;
    }

    if (Array.isArray(currentProp)) {
      currentProp.forEach(child => {
        objToBuild = objToBuild[head] || (objToBuild[head] = Array.isArray(child[head]) ? [] : {});
        currentProp = child[head];
        walkAndAddProps(tail, currentProp, objToBuild);
      });
      return;
    }

    objToBuild = objToBuild[head] || (objToBuild[head] = Array.isArray(currentProp[head]) ? [] : {});
    currentProp = currentProp[head];

    walkAndAddProps(tail, currentProp, objToBuild);
  };

  const objToBuild = Array.isArray(item) ? [] : {};
  array.forEach(el => {  
    walkAndAddProps(el.split('.'), item, objToBuild);
  });

  return objToBuild;
};

// a.b.c, a.b -> a.b
// a.b.c, a.b.d -> a.b.c, a.b.d
// a.b.c, a.b, g -> a.b, g
// a.b.c, a -> a

const cleanArrays = (arr) => {
  return arr.reduce((newArr, a1) => {
    const any = arr.some(a2 => a1 !== a2 && a1.startsWith(a2));
    if (!any) { newArr.push(a1); }
    return newArr;
  }, []);
};

// source is array, filter is obj
const doWork = (source, filter) => {

  if (filter.allow) {
    const allow = cleanArrays(filter.allow);
    source = addItems(allow, source);
  }

  if (filter.omit) {
    const omit = cleanArrays(filter.omit);
    source = removeItems(omit, source);
  }

  if (filter.deep) {
    const allows = filter.deep.filter(x => Boolean(x.allow));
    if (allows.length) {
      const deepAllows = allows.reduce((arr, a) => {
        a.allow.forEach(aa => {
          arr.push(`${a.for}.${aa}`);
        });
        return arr;
      }, []);
      const cleanDeepAllows = cleanArrays(deepAllows);
      source = allowItems(cleanDeepAllows, source);
    }

    const omits = filter.deep.filter(x => Boolean(x.omit));
    if (omits.length) {
      const deepOmits = omits.reduce((arr, a) => {
        a.omits.forEach(aa => {
          arr.push(`${a.for}.${aa}`);
        });
        return arr;
      }, []);
      const cleanDeepOmits = cleanArrays(deepOmits);
      source = removeItems(cleanDeepOmits, source);
    }
  }

  return source;
};

const res = doWork(
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
      h: 'h'
    }],
    i: 'i'
  },
  {
    omit: ['f.h'],
    allow: ['a.b', 'f', 'a.b.c'],
    deep: [{
      for: 'a.b', allow: ['c']
    }]
  }
);

// const e = cleanArrays(['a.b.c', 'a.b']);
// const ee = cleanArrays(['a.b.c', 'a.b.d']);
// const eee = cleanArrays(['a.b.c', 'a.b', 'g']);
// const eeee = cleanArrays(['a.b.c', 'a']);

// const x = removeItems(['a.b.c', 'g'], {
//   a: {
//     b: {
//       c: 'c',
//       d: 'd'
//     },
//     e: 'e'
//   },
//   g: 'g'
// });

// const xx = removeItems(['a.b.c'], {
//   a: {
//     b: {
//       c: 'c'
//     }
//   },
//   g: 'g'
// });

// const xxx = removeItems(['a.b.c', 'g'], {
//   a: [{
//     b: {
//       c: 'c',
//       d: 'd'
//     },
//     e: 'e'
//   }],
//   g: 'g'
// });

// const xxxx = removeItems(['a.b'], {
//   a: [{
//     b: {
//       c: 'c',
//       d: 'd'
//     },
//     e: 'e'
//   }],
//   g: 'g'
// });

// const xxxxx = removeItems(['a.b'], {
//   a: [{
//     b: [{
//       c: 'c',
//       d: 'd'
//     }],
//     e: 'e'
//   }],
//   g: 'g'
// });

// const xxxxxx = removeItems(['a.b', 'h'],
// [{
//   h: 'h',
//   a: [{
//     b: [{
//       c: 'c',
//       d: 'd'
//     }],
//     e: 'e'
//   }],
//   g: 'g'
// }]
// );

// const yy = addItems(['a.b.c', 'g'], {
//   a: {
//     b: {
//       c: 'c',
//       d: 'd'
//     },
//     e: 'e'
//   },
//   g: 'g'
// });

// const yyy = addItems(['a.b.c', 'g'], {
//   a: [{
//     b: {
//       c: 'c',
//       d: 'd'
//     },
//     e: 'e'
//   }],
//   g: 'g'
// });

// const yyyy = addItems(['a.b'], {
//   a: [{
//     b: {
//       c: 'c',
//       d: 'd'
//     },
//     e: 'e'
//   }],
//   g: 'g'
// });

// const yyyyy = addItems(['a.b'], {
//   a: [{
//     b: [{
//       c: 'c',
//       d: 'd'
//     }],
//     e: 'e'
//   }],
//   g: 'g'
// });

// const yyyyyy = addItems(['a.b', 'h'],
// [{
//   h: 'h',
//   a: [{
//     b: [{
//       c: 'c',
//       d: 'd'
//     }],
//     e: 'e'
//   }],
//   g: 'g'
// }]
// );
