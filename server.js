const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

// =======================
// HOME ROUTE
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

            // 🔐 First-time device binding
            if (!savedDevice || savedDevice === "") {
                savedDevice = device;

                users[i] = `${user}|${status}|${expiry}|${device}`;
                fs.writeFileSync("users.db", users.join("\n"));

                console.log("Device bound:", device);
            }

            // 🔒 Device lock check
            if (savedDevice !== device) {
                return res.json({
                    status: "DEVICE_BLOCKED"
                });
            }

            // ⏳ Expiry check
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
// ADD USER (ADMIN ROUTE)
// =======================
app.get("/add", (req, res) => {

    const { username, days } = req.query;

    if (!username || !days) {
        return res.send("Usage: /add?username=john&days=30");
    }

    let expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    const formattedDate = expiryDate.toISOString().split("T")[0];

    const newUser = `${username}|ACTIVE|${formattedDate}|`;

    fs.appendFileSync("users.db", newUser + "\n");

    res.send(`User ${username} added. Expiry: ${formattedDate}`);
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Server running on port " + PORT);
});
