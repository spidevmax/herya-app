const User = require("../models/User.model");

const registerUser = async (req, res, next) => {
	try {
		const newUser = new User(req.body);

		// Check if email is already registered
		const userExists = await User.findOne({ email: newUser.email });
		if (userExists) {
			return res.status(400).json({ error: "User already exists" });
		}

		// Save new user
		const createdUser = await newUser.save();
		res.status(201).json(createdUser);
	} catch (error) {
		return next(error);
	}
};

const loginUser = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Check password
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Successful login
		res.status(200).json(user);
	} catch (error) {
		return next(error);
	}
};

module.exports = { registerUser, loginUser };
