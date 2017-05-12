'use strict';

/* eslint-disable no-param-reassign */

const dribble = require('./dribble');

const filterSource = (source, filter) => {
  if (filter.keep) {
    source = dribble.processKeep(filter.keep, source);
  }

  if (filter.omit) {
    source = dribble.processOmit(filter.omit, source);
  }

  if (filter.deep) {
    const goDeep = (type) => {
      const matchedType = filter.deep.filter(x => Boolean(x[type]));
      if (matchedType.length) {
        const sanitized = matchedType.reduce((arr, v) => {
          if (!arr.map(a => a.for).includes(v.for)) {
            arr.push(v);
          } else {
            const match = arr.find(a => a.for === v.for);
            match[type].push(...v[type]);
          }
          return arr;
        }, []);
        sanitized.forEach(v => {
          dribble.processDeep(v, source);
        });
      }
    };

    goDeep('keep', dribble.processkeep);
    goDeep('omit', dribble.processOmit);
  }

  return source;
};

const filterResponse = (request, reply) => {
  const config = request.route.settings.plugins.dribble;

  // don't do anything to the response & leave function execution
  if (!config) {
    return reply.continue();
  }

  // rule / filter
  const match = Object.keys(config).find(f => config[f].rule(request));
  if (!match) {
    return reply.continue();
  }

  const source = request.response.source;
  if (source) {
    request.response.source = filterSource(source, config[match].filter);
  }

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
