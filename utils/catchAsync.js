module.exports = (fn) => (req, res, next) => {
  // try {
  //   fn();
  // } catch {
  //   next(fn);
  // }
  fn(req, res, next).catch(next);
};
