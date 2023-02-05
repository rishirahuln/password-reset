const { authModel } = require("../models/auth.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { passwordResetTokenModel } = require("../models/prToken.model");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendEmail");

const register = async (req, res) => {
    const payload = req.body;
    try {
        const existingUser = await authModel.findOne({ username: payload.username});
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash(payload.password, 10);
            payload.hashedPassword = hashedPassword;
            delete payload.password;
            const newUser = await new authModel(payload).save();

            return res.status(201).send({ message: "User registered successfully", userID: newUser._id });
        }
        res.status(409).send({ message: "An account is already registered with this Email address. If you don't remember the password, try to reset the password in the login page or try to register with another Email address" });
    } catch (error) {
        res.status(500).send({ message: "Internal server error", error: error });
    }
};

const signin = async (req, res) => {
    const { username, password } = req.body;
    try {
        if(username && password) {
            let existingUser = await authModel.findOne({ username: username });
            if (existingUser) {
                const isPasswordMatch = await bcrypt.compare(password, existingUser.hashedPassword);
                if(isPasswordMatch) {
                    const token = jwt.sign({ _id: existingUser._id }, process.env.JWT_SECRET);
                    res.cookie("accessToken", token, { httpOnly: true, sameSite: "none", secure: true, expire: new Date() + 86400000 });

                    existingUser = existingUser.toObject();
                    delete existingUser.hashedPassword;
                    return res.status(201).send({ message: "User signed-in successfully", user: existingUser });
                }
                return res.status(400).send({ message: "Invalid credentials" });
            }
            return res.status(400).send({ message: "User not registered" });
        }
        res.status(400).send({ message: "Credentials are required" });
    } catch (error) {
        res.status(500).send({ message: "Internal server error", error: error });
    }
};

const signout = async (req, res) => {
    try {
        res.clearCookie("accessToken");
        res.status(200).send({ message: "User signed-out successfully" });
    } catch (error) {
        res.status(500).send({ message: "Internal server error", error: error });
    }
};

const forgotPassword = async (req, res) => {
    const { username } = req.body;
    try {
        if (username) {
            const getUser = await authModel.findOne({ username: username });
            if (getUser) {
                const getPRToken = await passwordResetTokenModel.findOne({ userId: getUser._id });
                if (getPRToken) {
                    await getPRToken.remove();
                }
                const PRToken = crypto.randomBytes(32).toString("hex");
                const hashedPRToken = await bcrypt.hash(PRToken, 10);
                const newPRToken = await new passwordResetTokenModel({ userId: getUser._id, hashedPRToken: hashedPRToken }).save();
                const PRLink = `${process.env.CLIENT_URL}/reset-password?PRToken=${PRToken}&userId=${getUser._id}`;
                sendEmail(getUser.username, "Password Reset Request", {firstName: getUser.firstName, PRLink: PRLink });

                return res.status(200).send({ message: "Email sent successfully" });
            }
            return res.status(400).send({ message: "User not registered" });
        }
        res.status(400).send({ message: "Username is required" }); 
    } catch (error) {
        res.status(500).send({ message: "Internal server error", error: error });
    }
};

const resetPassword = async (req, res) => {
    const { userId, PRToken, password } = req.body;
    try {
        if (password) {
            const getPRToken = await passwordResetTokenModel.findOne({ userId: userId });
            if (getPRToken) {
                const isValidPRToken = await bcrypt.compare(PRToken, getPRToken.hashedPRToken);
                if (isValidPRToken) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    authModel.findByIdAndUpdate({ _id: userId }, { $set: { hashedPassword: hashedPassword } }, (err, doc) => {
                        if (err) {
                            return res.status(400).send({ message: "Error while resetting password", error: err });
                        }
                    });
                    await getPRToken.remove();

                    return res.status(200).send({ message: "Password reset successfully" });
                }
                return res.status(400).send({ message: "Invalid token" });
            }
            return res.status(401).send({ message: "Invalid or expired token" });
        }
        res.status(400).send({ message: "Password is required" });
    } catch (error) {
        res.status(500).send({ message: "Internal server error", error: error });
    }
};

module.exports = { register, signin, signout, forgotPassword, resetPassword };