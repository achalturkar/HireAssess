// const paginate = ({ page = 1, limit = 10 }) => {

//     page = parseInt(page, 10);
//     limit = parseInt(limit, 10);

//     if (page < 1) page = 1;
//     if (limit < 1) limit = 10;

//     return {
//         page,
//         limit,
//         skip: (page - 1) * limit,
//         take: limit
//     };
// };

// const paginationMeta = (total, page, limit) => ({
//     total,
//     page,
//     limit,
//     totalPages: Math.ceil(total / limit),
//     hasNext: page * limit < total,
//     hasPrevious: page > 1
// });

// module.exports = {
//     paginate,
//     paginationMeta
// };

'use strict';

const parsePagination = ({ page = 1, limit = 10 }) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 10;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
};

const buildMeta = ({ total, page, limit }) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrevious: page > 1,
});

module.exports = {
  parsePagination,
  buildMeta,
};