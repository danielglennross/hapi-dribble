'use strict';

const _ = require('lodash');

/* eslint-disable no-param-reassign */

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

      walkAndUnsetProps(
        tail, currentProp, previousProp, head
      );
    }

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
  };

  array.forEach(el => {  
    walkAndUnsetProps(el.split('.'), item);
  });

  return item;
};

// el: a.b.c.d

const addItems = (array, item) => {
  const walkAndAddProps = (objToBuild, propNamesToWalk, currentProp) => {
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
        walkAndAddProps(objToBuild, tail, currentProp);
      });
      return;
    }

    objToBuild = objToBuild[head] || (objToBuild[head] = Array.isArray(currentProp[head]) ? [] : {});
    currentProp = currentProp[head];

    walkAndAddProps(objToBuild, tail, currentProp);
  };

  const objToBuild = Array.isArray(item) ? [] : {};
  array.forEach(el => {  
    walkAndAddProps(objToBuild, el.split('.'), item);
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

const e = cleanArrays(['a.b.c', 'a.b']);
const ee = cleanArrays(['a.b.c', 'a.b.d']);
const eee = cleanArrays(['a.b.c', 'a.b', 'g']);
const eeee = cleanArrays(['a.b.c', 'a']);

const x = removeItems(['a.b.c', 'g'], {
  a: {
    b: {
      c: 'c',
      d: 'd'
    },
    e: 'e'
  },
  g: 'g'
});

const xx = removeItems(['a.b.c'], {
  a: {
    b: {
      c: 'c'
    }
  },
  g: 'g'
});

const xxx = removeItems(['a.b.c', 'g'], {
  a: [{
    b: {
      c: 'c',
      d: 'd'
    },
    e: 'e'
  }],
  g: 'g'
});

const xxxx = removeItems(['a.b'], {
  a: [{
    b: {
      c: 'c',
      d: 'd'
    },
    e: 'e'
  }],
  g: 'g'
});

const xxxxx = removeItems(['a.b'], {
  a: [{
    b: [{
      c: 'c',
      d: 'd'
    }],
    e: 'e'
  }],
  g: 'g'
});

const xxxxxx = removeItems(['a.b', 'h'],
[{
  h: 'h',
  a: [{
    b: [{
      c: 'c',
      d: 'd'
    }],
    e: 'e'
  }],
  g: 'g'
}]
);

const yy = addItems(['a.b.c', 'g'], {
  a: {
    b: {
      c: 'c',
      d: 'd'
    },
    e: 'e'
  },
  g: 'g'
});

const yyy = addItems(['a.b.c', 'g'], {
  a: [{
    b: {
      c: 'c',
      d: 'd'
    },
    e: 'e'
  }],
  g: 'g'
});

const yyyy = addItems(['a.b'], {
  a: [{
    b: {
      c: 'c',
      d: 'd'
    },
    e: 'e'
  }],
  g: 'g'
});

const yyyyy = addItems(['a.b'], {
  a: [{
    b: [{
      c: 'c',
      d: 'd'
    }],
    e: 'e'
  }],
  g: 'g'
});

const yyyyyy = addItems(['a.b', 'h'],
[{
  h: 'h',
  a: [{
    b: [{
      c: 'c',
      d: 'd'
    }],
    e: 'e'
  }],
  g: 'g'
}]
);
