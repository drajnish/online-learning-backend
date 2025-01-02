export const addRoleToBody = (role) => (req, _res, next) => {
  req.body.role = role;
  return next();
};
