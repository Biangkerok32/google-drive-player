var express = require("express");
var http = require("http");
var path = require("path");
var fs = require("fs");
var swig = require("swig");

var app = express();
var PORT = parseInt(process.env.GDP_PORT) || 8086;
var DOMAIN = process.env.GDP_DOMAIN || "ex.com";

app.set("port", PORT);
app.use(app.router);
console.log(__dirname);
app.use(express.directory(__dirname));
app.use(express.static(__dirname));

app.get("/", function (req, res) { 
    res.send(fs.readFileSync(path.join(__dirname, "index.html"), {encoding: "utf8"}));
});

var appjs = swig.compileFile(path.join(__dirname, "/src/app.js"));
app.get("/src/app.js", function (res, res) {
    res.send(appjs({domain: DOMAIN}));
});

app.get("/oauth2callback", function (req, res) { res.send("<html></html>"); });

http.createServer(app).listen(app.get("port"), function () {
    console.log("Express server listening on port " + app.get("port"));
});
