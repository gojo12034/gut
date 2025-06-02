const { spawn } = require("child_process");
const express = require("express");

const app = express();
const port = process.env.PORT || 8080;

// Simple route for root URL
app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Server!</h1>');
});

// Optional: Add more routes if needed
// app.get('/api', (req, res) => {
//     res.json({ message: "API is working!" });
// });

function startBotProcess(script) {
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", script], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        console.log(`${script} process exited with code: ${codeExit}`);
        if (codeExit !== 0) {
            setTimeout(() => startBotProcess(script), 3000);
        }
    });

    child.on("error", (error) => {
        console.error(`An error occurred starting the ${script} process: ${error}`);
    });
}

startBotProcess("main.js");
// startBotProcess("monitor.js");
// startBotProcess("telegram/index.js");

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}).on('error', (err) => {
    console.error('Error starting server:', err);
});
