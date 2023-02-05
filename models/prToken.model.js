const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passwordResetTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  hashedPRToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800,
  },
});

const passwordResetTokenModel = mongoose.model("passwordresettokens", passwordResetTokenSchema);

module.exports = { passwordResetTokenModel };
