'use strict';

/* eslint-disable no-param-reassign */

const worker = require('./index3');

const doWork = (source, filter) => {
  if (filter.allow) {
    source = worker.processKeep(filter.allow, source);
  }

  if (filter.omit) {
    source = worker.processOmit(filter.omit, source);
  }

  if (filter.deep) {
    const goDeep = (type) => {
      let values = filter.deep.filter(x => Boolean(x[type]));
      if (values.length) {
        values = values.reduce((arr, v) => {
          if (!arr.map(a => a.for).includes(v.for)) {
            arr.push(v);
          } else {
            const match = arr.find(a => a.for === v.for);
            match[type].push(v[type]);
          }
          return arr;
        }, []);
        values.forEach(v => {
          worker.processDeep(v, source);
        });
      }
    };

    goDeep('allow', worker.processAllow);
    goDeep('omit', worker.processOmit);
  }

  return source;
};

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
  const filter = dribble[match].filter;

  request.response.source = doWork(source, filter);

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