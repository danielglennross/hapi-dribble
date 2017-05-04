'use strict';

/* eslint-disable no-param-reassign */

/**
 * filter rulesets can match the following patterns:
 *
 * exports.<endpointAndType> = [
 *   { allow: [objectKeyProperties] },
 *   { omit: [objectKeyProperties] },
 *   { for: objectKey, allow: [objectKeyProperties] },
 *   { for: arrayKey, allow: [objectKeyProperties] },
 *   { for: objectKey, omit: [objectKeyProperties] },
 *   { for: arrayKey, omit: [objectKeyProperties] }
 * ];
 *
 * when using an object ruleset:
 * - 'for'
 * - - can point to a nested property
 * - - any property within the nested chain can be an object or array
 * - 'allow' and 'omit' are mutually exclusive
 * - - 'allow' removes all properties except those listed
 * - - 'omit' keeps all properties except those listed
 */

const Hoek = require('hoek');
const unset = require('object-unset');
const _ = require('lodash');

const filterOptions = {
  keepMatchingProperties: 0x01,
  removeMatchingProperties: 0x02
};

/**
 * Returns a new new object, with omited properties
 * Comparisons are case insensitive
 */
const omit = (obj, keysToOmit, filter) => {
  const keysPredicate = {
    [filterOptions.keepMatchingProperties]: i => i === -1,
    [filterOptions.removeMatchingProperties]: i => i > -1
  };

  const lowerCaseKeysToOmit = keysToOmit.map(x => x.toLowerCase());
  return Object.keys(obj)
  .filter(key => keysPredicate[filter](lowerCaseKeysToOmit.indexOf(key.toLowerCase())))
  .reduce((filteredObj, key) => {
    Object.assign(filteredObj, { [key]: obj[key] });
    return filteredObj;
  }, {});
};

/**
 * Builds an object with functions detailing how to unset properties
 * based on string or object filterable items
 */
const unsetter = (item, el) => {
  Hoek.assert(
    !!el.allow ^ !!el.omit,
    'a filter rule can either allow or omit values exclusively'
  );

  // ensure every prop is an array
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

  // Walk through (potentially nested) properties
  // and omit values at the inner most level.
  //
  // Whilst walking back out: if a property becomes an empty object
  // unset it from it's parent
  const walkAndUnsetProps = (propNamesToWalk, currentProp, previousProp, propName) => {
    if (propNamesToWalk.length) { // if we have nested properties, keep walking through
      const [head, ...tail] = propNamesToWalk;
      propName = head;
      previousProp = [].concat(currentProp);
      currentProp = getObjPropertyAsArray(currentProp, propName);

      walkAndUnsetProps(
        tail, currentProp, previousProp, propName
      );
    } else { // no more nested props, unset propNames at this level
      currentProp.forEach(prop => {
        const clean = (properyNames, predicate) => {
          _.forEach(
            omit(prop, properyNames, predicate),
            (value, key) => {
              unset(prop, key);
            });
        };

        if (el.allow) {
          clean(el.allow, filterOptions.keepMatchingProperties);
        } else if (el.omit) {
          clean(el.omit, filterOptions.removeMatchingProperties);
        }
      });
    }

    // walking back out:
    // if currentProp is now an empty object
    // unset it from it's parent (if exists)
    if (previousProp) {
      currentProp.forEach((current) => {
        if (_.isEmpty(current)) {
          previousProp.forEach(previous => unset(previous, propName));
        }
      });
    }
  };

  const pathTree = el.for ? el.for.split('.') : [];
  const itemArr = [].concat(item);
  walkAndUnsetProps(pathTree, itemArr);
};

const flatten = (filter) => {

  if (filter.allow) {
    filter.allow = filter.allow.reduce((arr, a) => {
      const g = a.split('.');
      if (g.length > 1) {
        arr.push(g[0]);
      }
      arr.push(a);
      return arr;
    }, []);
  }

  const oo = filter.omit ? [Object.assign({}, { omit: filter.omit })] : [];
  const aa = filter.allow ? [Object.assign({}, { allow: filter.allow })] : [];
  const dd = filter.deep ? filter.deep : [];
  filter = [...oo, ...aa, ...dd];

  const build = (i, single, multiple) => {
    const newArr = (x) => (i[x] || []).reduce((arr, j) => {
      if (j) {
        const t = j.split('.');
        if (t.length === 1) {
          arr.push(single(t, x));
        } else {
          arr.push(multiple(t, x));
        }
      }
      return arr;
    }, []);
    return [...newArr('omit'), ...newArr('allow')];
  };

  const flat = filter.reduce((arr, i) => {
    let newArr;
    if (!i.for) {
      newArr = build(i,
        (t, x) => ({ for: null, [x]: t[0] }),
        (t, x) => ({ for: t.slice(0, t.length - 1).join('.'), [x]: t[t.length - 1] })
      );
    } else {
      newArr = build(i,
        (t, x) => ({ for: i.for, [x]: t[0] }),
        (t, x) => ({ for: [i.for].concat(t.slice(0, t.length - 1)).join('.'), [x]: t[t.length - 1] })
      );
    }
    arr.push(...newArr);
    return arr;
  }, []);

  const grouped = flat.reduce((arr, i) => {
    if (!arr.some(f => f.for === i.for)) {
      const omitM = flat.filter(f => f.for === i.for && i.omit);
      const allowM = flat.filter(f => f.for === i.for && i.allow);
      if (omitM.length) {
        arr.push({ for: i.for, omit: omitM.map(o => o.omit) });
      }
      if (allowM.length) {
        arr.push({ for: i.for, allow: allowM.map(a => a.allow) });
      }
    }
    return arr;
  }, []);

  return grouped;
};

/**
 * Looks up route config for request in context, and applies
 * filter to payload accordingly.
 *
 * @function
 * @param  {object} request Hapi request object
 * @param  {object} reply   Hapi reply interface object
 */
const filterResponse = (request, reply) => {
  const dribble = request.route.settings.plugins.dribble;

  // don't do anything to the response & leave function execution
  if (!dribble) {
    return reply.continue();
  }

  // rule / filter
  const match = Object.keys(dribble).find(f => dribble[f].rule(request));
  if (!match) {
    return reply.continue();
  }

  // todo: make sure we have source
  const source = request.response.source;

  // always treat source as an array
  const sources = [].concat(source);

  const filter = dribble[match].filter;
  const flat = flatten(filter);

  sources.forEach(sourceItem =>
    flat.forEach(filterableItem => {
      unsetter(sourceItem, filterableItem);
    })
  );

  return reply.continue();
};

exports.register = (server, options, next) => {
  server.ext('onPreResponse', filterResponse);
  next();
};

exports.register.attributes = {
  name: 'hapi-dribble',
  version: '1.0.0'
};
