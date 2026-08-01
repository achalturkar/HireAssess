'use strict';

const logger = require('../logger');

const createRedisStub = () => {
  const store = new Map();
  return {
    get: async (key) => (store.has(key) ? store.get(key) : null),
    set: async (key, value) => {
      store.set(key, value);
      return 'OK';
    },
    del: async (key) => {
      store.delete(key);
      return 1;
    },
    ping: async () => 'PONG',
    connect: async () => 'OK',
    quit: async () => 'OK',
    on: () => undefined,
  };
};

const redis = createRedisStub();

const connectRedis = async () => {
  logger.info('Redis support disabled; using PostgreSQL only.');
};

const disconnectRedis = async () => {
  logger.info('Redis support disabled; no disconnect needed.');
};

module.exports = { redis, connectRedis, disconnectRedis };