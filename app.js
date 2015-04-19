var Twit = require('twit');
var express = require('express');
var http = require('http');
var ws = require('ws');
var app = express();

var S = {
    PORT: 80,
    IP: "195.154.48.49"
};

var T = new Twit({
    consumer_key:         'zgIdJmHhhEdyk66dzMDvj7vo9'
  , consumer_secret:      'NJbfbSYPT9FZyvpreAKZP3G5CXwliLW053PpYNRmhQA5EgMW07'
  , access_token:         '61424983-UtOSpYipe4cnetiB8akMJ1C4daeqO9mvaxRrxyRqb'
  , access_token_secret:  '7BD0cPgcv7rsMNAJvp5GKOOqWzpE5aHc1lQG8PnCAui4M'
});

var clients = [];

var stream = T.stream('statuses/filter', 
                      { track: [ '#PJLRenseignement', 
				 "#LoiRenseignement",
                                 'terrorisme',
                                 'liberté',
                                 'vie privé',
                                 "droits de l'homme"]
                      });

stream.on('tweet', function (tweet) {
  //console.log(tweet);

  clients.forEach(function(client) {
    client.send(JSON.stringify({ name:tweet.user.name,
                                 screen_name: tweet.user.screen_name,
                                 text:tweet.text,
                                 id_str: tweet.id_str,
                                 img: tweet.user.profile_image_url,
                                 url: "https://twitter.com/"+tweet.user.screen_name+"/status/"+tweet.id_str}));
  });
})

app.use("/pub", express.static(__dirname + '/pub'));

app.get("/", function(req, res) {
  res.sendfile('./pub/index.html');
});

var server = http.createServer(app);
server.listen(S.PORT, S.IP, function() {

    if (process.getuid() === 0) {
	process.setgid(1000);
	process.setuid(1000);
	if (process.getuid() !== 0) {
            console.log("no root anymore...");
	}
    }     
});

var wss = new ws.Server({server: server});
wss.on('connection', function(client) {
  clients.push(client);
  console.log("client", clients.indexOf(client), "connected");

  client.on("message", function(data) {
    var j = JSON.parse(data);
    console.log(j);
  });

  client.on("close", function() {
    var id = clients.indexOf(client);
    console.log("client", id, "disconnected");    
    clients.splice(id, 1);
    console.log(clients.length);
  });
  
});


