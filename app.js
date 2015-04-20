var Twit = require('twit');
var express = require('express');
var http = require('http');
var ws = require('ws');
var app = express();

var S = {
    PORT: 80,
    IP: "195.154.48.49"
};

var version = Math.round(Math.random()*65535).toString(16);

console.log("Version:", version);

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
    var data = JSON.stringify({ 
      name:tweet.user.name,
      screen_name: tweet.user.screen_name,
      text:tweet.text,
      id_str: tweet.id_str,
      img: tweet.user.profile_image_url,
      url: "https://twitter.com/"+tweet.user.screen_name+"/status/"+tweet.id_str});
    try {
      client.send(data);
    } catch(e) {
      console.log(e);
    }
  });
})

app.use("/pub", express.static(__dirname + '/pub'));

app.get("/", function(req, res) {
  res.sendfile('./pub/index.html');
});

if (process.getuid() !== 0) {
  S.PORT *= 100;
  S.IP = "";
}
var server = http.createServer(app);
server.listen(S.PORT, S.IP, function() {
    if (process.getuid() === 0) {
	process.setgid(1000);
	process.setuid(1000);
	if (process.getuid() !== 0) {
            console.log("no root anymore...");
	}
    }     
  console.log("Listening on", S.PORT, S.IP);
});

var max = 0;
function log() {
  max = Math.max(max, clients.length);
  var txt = "["+clients.length+"/"+max+"] ";
  for (e in arguments) {
    txt += arguments[e] + " ";
  }
  console.log(txt);
}

var wss = new ws.Server({server: server});
wss.on('connection', function(client) {
  clients.push(client);
  var ip = client._socket.remoteAddress;
  log("new client connected from", ip);

  client.send(JSON.stringify({ version: version })); 
  
  client.on("message", function(data) {
    var j = JSON.parse(data);

    for(var i=0; i < j.name.length; i++) {
      var l = j.name[i];
      if ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.0123456789".indexOf(l) === -1) {
        console.log("name invalid");
        return
      }
    }

    log(data);
    clients.forEach(function(c) {
      if (c !== client) {
        try {
          c.send(data);
        } catch(e) {
          console.log(e);
        }
      }
    });
  });

  client.on("close", function() {
    var id = clients.indexOf(client);
    clients.splice(id, 1);
    log("client", id, "disconnected from", ip);
  });
  
});


