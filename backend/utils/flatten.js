// { a: { b: 1 } } -> { 'a.b': 1 } so partial updates do not wipe sibling fields
function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    if (v === undefined) return acc;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flatten(v, `${prefix}${k}.`));
    else acc[`${prefix}${k}`] = v;
    return acc;
  }, {});
}
module.exports = flatten;
