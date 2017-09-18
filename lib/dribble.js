'use strict';

/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */

const { isEmpty, forEach } = require('lodash');

const removeInferredItems = (arr) =>
  arr.reduce((newArr, a1) => {
    const any = arr.some(a2 => a1 !== a2 && a1.startsWith(a2));
    if (!any) {
      newArr.push(a1);
    }
    return newArr;
  }, []);

const processKeep = (array, item) => {
  const walkAndAddProps = (propNamesToWalk, currentProp, objToBuild, visited) => {
    if (propNamesToWalk.length < 1) {
      return;
    }

    // if we have nested properties, keep walking through
    const [head, ...tail] = propNamesToWalk;

    // last property
    if (propNamesToWalk.length === 1) {
      if (Array.isArray(currentProp)) {
        if (head === '[]') {
          currentProp.reduce((obj, cp) => {
            obj.push(cp);
            return obj;
          }, objToBuild);
          return;
        }

        currentProp.reduce((obj, cp) => {
          if (!obj.length) {
            obj.push({ [head]: cp[head] });
          } else {
            obj.forEach(o => {
              Object.assign(o, { [head]: cp[head] });
            });
          }
          return obj;
        }, objToBuild);
        return;
      }

      if (Array.isArray(objToBuild)) {
        objToBuild.push({ [head]: currentProp[head] });
      } else {
        objToBuild[head] = currentProp[head];
      }
      return;
    }

    if (Array.isArray(currentProp)) {
      currentProp = [...currentProp];

      const iter = (i) => {
        const child = currentProp.shift();
        const remaining = currentProp;
        const prevObj = objToBuild;
        if (!child) {
          return;
        }

        let newObj;
        if (!visited.includes(head)) {
          if (head === '[]') {
            newObj = [];
            objToBuild.push(newObj);
            objToBuild = newObj;
            currentProp = child;
          } else {
            newObj = Array.isArray(child[head]) ? { [head]: [] } : { [head]: {} };
            objToBuild.push(newObj);
            objToBuild = newObj[head];
            currentProp = child[head];
          }
        } else {
          if (head === '[]') {
            objToBuild = [];
            currentProp = child;
          } else {
            objToBuild = objToBuild[i][head];
            currentProp = child[head];
          }
        }

        walkAndAddProps(tail, currentProp, objToBuild, visited);
        if (remaining.length) {
          currentProp = remaining;
          objToBuild = prevObj;
          iter(++i);
        }
      };

      iter(0);
      visited.push(head);
      return;
    }

    objToBuild = objToBuild[head] || (objToBuild[head] = Array.isArray(currentProp[head]) ? [] : {});
    currentProp = currentProp[head];
    visited.push(head);
    walkAndAddProps(tail, currentProp, objToBuild, visited);
  };

  const visited = [];
  const objToBuild = Array.isArray(item) ? [] : {};
  array = removeInferredItems(array);
  array.forEach(el => {
    walkAndAddProps(el.split('.'), item, objToBuild, visited);
  });
  return objToBuild;
};

const getObjPropertyAsArray = (obj, propName) => {
  if (Array.isArray(obj)) {
    return obj.reduce((arr, i) => {
      if (i[propName]) {
        arr = arr.concat(i[propName]);
      } else if (propName === '[]' && Array.isArray(i)) {
        arr = arr.concat(i);
      }
      return arr;
    }, []);
  }
  // obj is not an array, convert our property to an array
  return [].concat(obj[propName] || {});
};

const walkAndDeleteEmptyChain = (head, currentProp, previousProp) => {
  // walking back out:
  // if currentProp is now an empty object
  // unset it from it's parent (if exists)
  if (previousProp) {
    currentProp.forEach((current) => {
      if (isEmpty(current)) {
        previousProp.forEach(previous => {
          if (Array.isArray(previous)) {
            previous.length = 0;
          } else {
            delete previous[head];
          }
        });
      }
    });
  }
};

const processOmit = (array, item) => {
  const walkAndUnsetProps = (propNamesToWalk, currentProp, previousProp) => {
    if (propNamesToWalk.length < 1) {
      return;
    }

    const [head, ...tail] = propNamesToWalk;
    currentProp = [].concat(currentProp);

    if (propNamesToWalk.length === 1) {
      if (head === '[]') {
        currentProp.forEach(prop => prop.length = 0);
      } else {
        currentProp.forEach(prop => delete prop[head]);
      }
      return;
    }

    previousProp = [].concat(currentProp);
    currentProp = getObjPropertyAsArray(currentProp, head);

    walkAndUnsetProps(tail, currentProp, previousProp);
    walkAndDeleteEmptyChain(head, currentProp, previousProp);
  };

  array = removeInferredItems(array);
  array.forEach(el => walkAndUnsetProps(el.split('.'), item));

  return item;
};

const processDeep = (el, item) => {
  const omit = (obj, keysToOmit, filter) => {
    const keysPredicate = {
      keepMatchingProperties: i => i === -1,
      removeMatchingProperties: i => i > -1
    };

    const lowerCaseKeysToOmit = keysToOmit.map(x => x.toLowerCase());
    return Object.keys(obj)
      .filter(key => keysPredicate[filter](lowerCaseKeysToOmit.indexOf(key.toLowerCase())))
      .reduce((filteredObj, key) => {
        Object.assign(filteredObj, { [key]: obj[key] });
        return filteredObj;
      }, {});
  };

  const walkAndUnsetProps = (propNamesToWalk, currentProp, previousProp) => {
    if (propNamesToWalk.length < 1) {
      return;
    }

    const [head, ...tail] = propNamesToWalk;
    currentProp = [].concat(currentProp);

    previousProp = [].concat(currentProp);
    currentProp = getObjPropertyAsArray(currentProp, head);

    if (propNamesToWalk.length === 1) {
      if (head === '[]') {
        currentProp.forEach(prop => prop.length = 0);
      } else {
        currentProp.forEach(prop => {
          const clean = (properyNames, predicate) => {
            forEach(
              omit(prop, properyNames, predicate),
              (value, key) => { delete prop[key]; }
            );
          };

          if (el.keep) {
            clean(el.keep, 'keepMatchingProperties');
          } else if (el.omit) {
            clean(el.omit, 'removeMatchingProperties');
          }
        });
      }
      return;
    }

    walkAndUnsetProps(tail, currentProp, previousProp);
    walkAndDeleteEmptyChain(head, currentProp, previousProp);
  };

  const pathTree = el.for.split('.');
  const itemArr = [].concat(item);
  walkAndUnsetProps(pathTree, itemArr);

  return item;
};

module.exports = {
  processOmit,
  processDeep,
  processKeep
};
