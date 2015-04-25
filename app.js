var Twit = require('twit');
var express = require('express');
var http = require('http');
var ws = require('ws');
var app = express();

try {
  var S = require("./conf.js")
} catch(e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log("ERROR: conf.js not found. You should copy conf.sample.js to conf.js and edit it to reflect your settings.");
  } else {
    console.log(e);
  }
  return;
}


// used to force client to reload in case of server restart...
var version = Math.round(Math.random()*65535).toString(16);

var clients = []; // list of clients connected with websockets
var tweets = [];

try {
  var T = new Twit(S.TWITTER);
  var stream = T.stream('statuses/filter', 
                        { track: S.KEYWORDS });
} catch(e) {
  console.log("Unable to connect to twitter", e);
  return;
}

stream.on('tweet', function (tweet) {
  var j = {
    name:tweet.user.name,
    screen_name: tweet.user.screen_name,
    text:tweet.text,
    id_str: tweet.id_str,
    img: tweet.user.profile_image_url,
    url: "https://twitter.com/"+tweet.user.screen_name+"/status/"+tweet.id_str};
  
  tweets.push(j);
  if (tweets.length > 20) {
    tweets.shift();
  }
  
  var data = JSON.stringify(j);
  
  clients.forEach(function(client) {
    try {
      client.send(data);
    } catch(e) {
      console.log(e);
    }
  });
})

var options = {
  root: __dirname + '/pub/',
  dotfiles: 'deny',
};

app.use("/pub", express.static(options.root));

app.get("/", function(req, res) {
  log("GET /", req.get("Referer"));
  res.sendFile('index.html', options);
});

app.get("/fr*", function(req, res) {
  log("GET /fr", req.get("Referer"));
  res.sendFile('index.html', options);
});

app.get("/en*", function(req, res) {
  log("GET /en", req.get("Referer"));
  res.sendfile('./pub/index_en.html');
});

app.get("/getTweets", function(req, res) {
  var ip = req.connection.remoteAddress;
  log("send", tweets.length ,"tweets to", ip);
  var lst = [{ version: version }];
  res.send(JSON.stringify(lst.concat(tweets)));
});

app.get("/setLevel/(:name)/(:pts)/(:level)", function(req, res) {
  onMessage({ name:req.params.name, 
              pts:req.params.pts, 
              level:req.params.level});
  res.send(JSON.stringify({ result: "ok"}));
});

var port;
var ip;
if (process.getuid() !== 0) {
  port = S.USER.PORT;
  ip = S.USER.IP;
} else {
  console.log("we are root...");
  port = S.ROOT.PORT;
  ip = S.ROOT.IP;
}
var server = http.createServer(app);
server.listen(port, ip, function() {
    if (process.getuid() === 0) {
      process.setgid(S.ROOT.GID);
      process.setuid(S.ROOT.UID);
      if (process.getuid() !== 0) {
        console.log("not root anymore...");
      }
    }     
  console.log("Listening on", port, ip);
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

function onMessage(j, client) {
  for(var i=0; i < j.name.length; i++) {
    var l = j.name[i];
    if ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.0123456789".indexOf(l) === -1) {
      console.log("name invalid");
      return
    }
  }
  
  tweets.push(j);
  if (tweets.length > 20) {
    tweets.shift();
  }

  var data = JSON.stringify(j);  
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
  
}

var wss = new ws.Server({server: server});
wss.on('connection', function(client) {
  clients.push(client);
  var ip = client._socket.remoteAddress;

  log("new client connected from", ip);

  client.send(JSON.stringify({ version: version })); 
  
  client.on("message", function(data) {
    var j = JSON.parse(data);
    onMessage(j, client);
  });

  client.on("close", function() {
    var id = clients.indexOf(client);
    clients.splice(id, 1);
    log("client", id, "disconnected from", ip);
  });
  
});


