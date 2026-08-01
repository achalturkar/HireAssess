'use strict';

const slugify = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

module.exports = { slugify };
