const { authModel } = require("../models/auth.model");

exports.getUser = async (req, res) => {
  try {
    const { userId } = req;
    let user = await authModel.findById(userId);
    if (user) {
      user = user.toObject();
      delete user.hashedPassword;

      return res.status(200).send({ success: true, user: user });
    }
    res.status(400).send({ success: false, message: "User does not exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error: error });
  }
};
