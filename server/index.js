import dotenv from "dotenv";
import express from "express";
import cluster from "cluster";
import home from "./route/home.js";
import path from "path";

dotenv.config({ path: ".env" });

if (cluster.isMaster) {
    let cpuCount = 4; //require('os').cpus().length
    for (let i = 0; i < cpuCount; ++i) {
        let worker = cluster.fork();
        worker.on("message", function (request) {
            // listen message from worker
            handleRequestFromWorker(request);
        });
    }
} else {
    const app = express();

    app.use(express.json({ limit: "25mb" }));
    app.use(express.urlencoded({ limit: "25mb", extended: true }));
    app.enable("trust proxy");
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
    app.use("/v1", home);
    app.listen(process.env.PORT, function () {
        console.log(
            `Worker ${process.pid} listen on port ${process.env.PORT}`
        );
    });
}

cluster.on("exit", function (worker) {
    console.log(`Worker ${worker.process.pid} die. Call new worker`);
    const w = cluster.fork();
    w.on("message", function (request) {
        handleRequestFromWorker(request);
    });
});

function handleRequestFromMaster(request) {
    console.log(
        `Worker ${process.pid} receive request ${JSON.stringify(
            request
        )} from master`
    );
}

function handleRequestFromWorker(request) {
}
