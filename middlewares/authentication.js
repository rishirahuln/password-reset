const jwt = require("jsonwebtoken");

exports.isAuth = (req, res, next) => {
  const { cookies } = req;
  if (cookies.accessToken) {
    const decryptedData = jwt.verify(cookies.accessToken, process.env.JWT_SECRET);
    req.userId = decryptedData._id;
    if (req.userId) {
      return next();
    }
    res.status(401).send({ message: "Unauthorized" });
  }
  res.status(401).send({ message: "Unauthorized" });
};
