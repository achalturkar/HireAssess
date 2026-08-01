'use strict';

const repo = require('./permission.repository');

const groupByModule = (permissions) => {
  const grouped = {};
  permissions.forEach((p) => {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push({ id: p.id, key: p.key, action: p.action, description: p.description });
  });
  return Object.entries(grouped).map(([module, items]) => ({ module, permissions: items }));
};

const list = async ({ grouped = false } = {}) => {
  const items = await repo.listPermissions();
  if (grouped) return groupByModule(items);
  return items.map((p) => ({
    id: p.id,
    key: p.key,
    module: p.module,
    action: p.action,
    description: p.description,
  }));
};

module.exports = { list };
