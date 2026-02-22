require("dotenv").config();

const { connectDB } = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

// Connect to database then start server
connectDB();

app.listen(PORT, () => {
	console.log(`🚀 Server running at http://localhost:${PORT}`);
});
