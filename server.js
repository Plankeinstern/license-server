const express = require("express");
const fs = require("fs");

const app = express();

// Middleware
app.use(express.json());

// =======================
// HEALTH CHECK (IMPORTANT FOR HOSTING)
// =======================
app.get("/", (req, res) => {
    res.send("License server is running 🚀");
});

// =======================
// LICENSE CHECK ROUTE
// =======================
app.post("/check", (req, res) => {

    const { username, device } = req.body;

    console.log("Checking user:", username);
    console.log("Device:", device);

    const data = fs.readFileSync("users.db", "utf8");
    const users = data.split("\n");

    for (let i = 0; i < users.length; i++) {

        let line = users[i].trim();
        if (!line) continue;

        let [user, status, expiry, savedDevice] =
            line.split("|").map(s => s.trim());

        if (user === username) {

            const today = new Date();
            const expiryDate = new Date(expiry);

            // =======================
            // DEVICE BINDING (FIRST TIME)
            // =======================
            if (!savedDevice || savedDevice === "") {
                savedDevice = device;

                users[i] = `${user}|${status}|${expiry}|${device}`;
                fs.writeFileSync("users.db", users.join("\n"));

                console.log("Device bound:", device);
            }

            // =======================
            // DEVICE LOCK CHECK
            // =======================
            if (savedDevice !== device) {
                return res.json({
                    status: "DEVICE_BLOCKED"
                });
            }

            // =======================
            // EXPIRY / INSTALLMENT CHECK
            // =======================
            if (today > expiryDate) {
                return res.json({
                    status: "EXPIRED",
                    expiry: expiry
                });
            }

            return res.json({
                status: "ACTIVE",
                expiry: expiry
            });
        }
    }

    return res.json({
        status: "NOT_FOUND"
    });
});

// =======================
// START SERVER (IMPORTANT FOR CLOUD)
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 License server running on port " + PORT);
});
