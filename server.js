var express = require("express");
var http = require("http");
var path = require("path");
var fs = require("fs");

var app = express();

app.set("port", process.argv[2] || process.env.PORT || 80);
app.use(app.router);
console.log(__dirname);
app.use(express.directory(__dirname));
app.use(express.static(__dirname));

app.get("/", function (req, res) { res.send(fs.readFileSync(path.join(__dirname, "index.html"), {encoding: "utf8"})); });
app.get("/oauth2callback", function (req, res) { res.send("<html></html>"); });

http.createServer(app).listen(app.get("port"), function () {
    console.log("Express server listening on port " + app.get("port"));
});
