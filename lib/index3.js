'use strict';

/* eslint-disable no-param-reassign */

const _ = require('lodash');

const removeInferredItems = (arr) =>
  arr.reduce((newArr, a1) => {
    const any = arr.some(a2 => a1 !== a2 && a1.startsWith(a2));
    if (!any) {
      newArr.push(a1);
    }
    return newArr;
  }, []);

const processKeep = (array, item) => {
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
          obj.push({ [head]: cp[head] });
          return obj;
        }, objToBuild);
      } else {
        objToBuild[head] = currentProp[head];
      }
      return;
    }

    if (Array.isArray(currentProp)) {
      currentProp.forEach(child => {
        const newObj = Array.isArray(child[head]) ? { [head]: [] } : { [head]: {} };
        objToBuild.push(newObj);
        objToBuild = newObj[head];
        currentProp = child[head];
        walkAndAddProps(tail, currentProp, objToBuild);
      });
      return;
    }

    objToBuild = objToBuild[head] || (objToBuild[head] = Array.isArray(currentProp[head]) ? [] : {});
    currentProp = currentProp[head];
    walkAndAddProps(tail, currentProp, objToBuild);
  };

  if (Array.isArray(item)) {
    const objToBuild = item.reduce((arr, i) => {
      const oToBuild = {};
      array = removeInferredItems(array);
      array.forEach(el => walkAndAddProps(el.split('.'), i, oToBuild));

      arr.push(oToBuild);
      return arr;
    }, []);
    return objToBuild;
  }

  const objToBuild = {};
  array = removeInferredItems(array);
  array.forEach(el => walkAndAddProps(el.split('.'), item, objToBuild));
  return objToBuild;
};

const processFilter = (array, item, { type = {} } = {}) => {
  const filterTypes = {
    allow: (prop, head) =>
      Object.keys(prop)
      .filter(k => k !== head)
      .forEach(k => delete prop[k]),
    omit: (prop, head) => delete prop[head]
  };

  const getObjPropertyAsArray = (obj, propName) => {
    if (obj instanceof Array) {
      return obj.reduce((arr, i) => {
        if (i[propName]) {
          arr = arr.concat(i[propName]);
        } else if (propName === '[]' && i instanceof Array) {
          arr = arr.concat(i);
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
      if (head === '[]') {
        currentProp = currentProp.map(c => []);
        return;
      }
      currentProp.forEach(prop => filterTypes[type](prop, head));
      return;
    }

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
  };

  array = removeInferredItems(array);
  array.forEach(el => walkAndUnsetProps(el.split('.'), item));

  return item;
};

const processOmit = (array, item) =>
  processFilter(array, item, { type: 'omit' });

const processAllow = (array, item) =>
  processFilter(array, item, { type: 'allow' });

module.exports = {
  processOmit,
  processAllow,
  processKeep
};
