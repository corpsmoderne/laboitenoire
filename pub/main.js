var player;
var ws;
var version;

function reset() {
  player = {
    name: T.patriot+"-"+Math.round(Math.random()*65535).toString(16),
    pts: 0,
    level: 0,
    lst: {}
  };  
}

var keywords = [
  '#PJLRenseignement', 
  '#PJLrenseignement', 
  '#pjlrenseignement', 
  '#LoiRenseignement',
  '#loirenseignement',
  'terrorisme',
  'Terrorisme',
  'terroriste',
  'Terroriste',
  "attentat",
  "ATTENTAT",
  'TERRORISME',
  'liberté',
  'Liberté',
  'LIBERTE',
  'vie privé',
  'Viw privé',
  "droits de l'homme",
  "Droits de l'homme",
  "DROITS DE L'HOMME"
];

var levels = [
  [ T.suspect, 5 ],       // 0
  [ T.informant, 15],   // 1
  [ T.agent, 50], // 2
  [ T.delegate, 100],       // 3
  [ T.cazeneuve, 250],    // 4
  [ T.valls, 500],        // 5
  [ T.darthVador, 65535 ]
];

function autoReport() {
  var elem = $(".reportBtn").first();
  if (elem.length !== 0) {
    setTimeout(function() {
      elem.click();
      autoReport();
    }, 250);
  }
}

var pigeonStarted = false;
function update_ui() {
  if (player.level >= levels.length-1) {
    $(".tweetOutter").animate({ height: 200}, 1000);
    autoReport();
  } else if (player.level >= 3) {
    $(".tweetOutter").animate({ height: 400}, 1000);
  } else if (player.level >= 1) {
    $(".tweetOutter").animate({ height: 200}, 1000);
  }

  if (player.level >= 2) {
    $(".tweet img").show(250);
  }
  if (player.level >= 3 && pigeonStarted === false) {
    pigeon();
  }
  if (player.level >= 4) {
    $(".reportBtn").show(250);
    cazeneuve();
  }
  if (player.level >= 5) {
    $(".lstOutter").show(1000);
    setTimeout(function() {
      valls();
    }, 2000);
  }
}

function update_lst() {
  $(".lstBox").empty();
  for(var e in player.lst) {
    var i = player.lst[e];
    var s = 8 + (i*2);
    s = Math.min(s, 42);

    var col = "white";
    if (i > 1) {
      col = "orange";
      if (i >= 5) {
        col = "red";
      }
    }
    var elem = $("<a style='background:"+col+";font-size:"+s+"px;' href='https://twitter.com/"+e+"' target='_blank'>"+e+"</a>");
    elem.attr("title", i);
    $(".lstBox").append(elem);
    $(".lstBox").append(" ");
  }
}

var lstReported;
function report_tweet(j) {
  console.log("report", j.id_str);
  if (j.id_str === lstReported) {
    return;
  }
  lstReported = j.id_str;

  player.pts++;
  
  if (player.lst[j.screen_name] === undefined) {
    player.lst[j.screen_name] = 1;
  } else {
    player.lst[j.screen_name] += 1;
  }
  update_lst();
  update_player();
  $("#"+j.id_str).css("background", "red");
  $("#"+j.id_str).hide(250, function() {
    $("#"+j.id_str).remove();
    document.title = Mustache.render(T.title, { nbr: $(".msg").length });
  });

}

function getLevelStr() {
  return levels[player.level][0]+((player.level >= levels.length-1) ? " [MAX]" : " ( < "+levels[player.level][1]+" )");
}

function update_player() {
  $("#pts").html(player.pts.toString(10));
  if (levels[player.level][1] <= player.pts && player.level < levels.length-1) {
    player.level++;
    $("#level").html(getLevelStr());
    
    update_ui();
    var elem = $(Mustache.render(T.levelUp, { level:levels[player.level][0] }));
    $(".tweetBox").append(elem);
    
    if (ws && ws.send) {
      ws.send(JSON.stringify({ name:player.name, 
                               pts:player.pts,
                               level: player.level}));
    }
  }
}

function popup(j, txt) {
  $(".popup").remove();
  var elem = $(Mustache.render(T.popup, 
                               { urlTweet:j.url, 
                                 urlProfile:"https://twitter.com/"+j.screen_name,
                                 img: j.img,
                                 name: j.name,
                                 txt: txt }));

  var close = elem.find(".closePopupBtn");
  close.click(function() {
    $(".popup").remove();
  });

  var report = elem.find(".reportPopupBtn");
  report.click(function() {
    report_tweet(j);
    $(".popup").remove();
  });

  $("body").append(elem);
}

$(document).ready(function() {
  if (localStorage['player']) {
    player = JSON.parse(localStorage['player']);
  } else {
    console.log("start...");
    reset();
  }
  
  if (player.pts === 0) {
    $(".tweetOutter").hide();
  } else {
    $(".tutorial").hide();
    startWS();
    checkFallback();
  }

  var fallBack = false;
  var stopNet=false;
  function checkHidden() {
    if (fallBack === true) {
      return;
    }
    if (document.hidden === true && stopNet === false) {
      console.log("checking in 10 s...");
      setTimeout(function() {
        if (document.hidden === true) {
          console.log("stop net...");
          stopNet = true;
          ws.close();
          checkHidden();
        }
      }, 30000);
    } else {
      if (document.hidden === false && stopNet === true) {
        console.log("restart net");
        stopNet = false;
        startWS();
      }
      setTimeout(checkHidden, 1000);
    }
  }
  checkHidden();

  setInterval(function() {
    localStorage['player'] = JSON.stringify(player);
  }, 1000);

  $(".lstOutter").hide();
  update_lst();

  $("#name").html(player.name);
  $("#pts").html(player.pts.toString(10));
  $("#level").html(getLevelStr());

  update_ui();

  $("#name").click(function() {
    var name = prompt(T.getId);
    if (name.length == 0) {
      alert(Mustache.render(T.noAnon));
      return;
    }

    for(var i=0; i < name.length; i++) {
      var l = name[i];
      if ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.0123456789".indexOf(l) === -1) {
        alert(T.invalidName);
        return
      }
    }

    player.name = name;

    $("#name").html(player.name);    
  });

  $("#reset").click(function() {
    if (confirm(T.restart)) {
      delete localStorage['player'];
      document.location.reload();
    }
  });

  $("#start").click(function() {
    $(".tutorial").hide(1000);
    $(".tweetOutter").show(1000, function() {
      startWS();
      checkFallback();
    });
  });

  function notice(msg) {
    var elem = $("<div class='tweet notice'><a class='close' href='#'>X</a>"+msg+"</div>");
    elem.find(".close").click(function(e) {
      e.preventDefault();
      elem.hide(250, function() {
        elem.remove();
      });
    });
    $(".tweetBox").append(elem);
  }
  
  function share() {
    setTimeout(function() {
      notice(T.shareOrTraitor);
      share();
    }, 60000+(Math.random()*3*60000));
  }

  function onMessage(j) {    
    if (j.version) {
      if (version === undefined) {
        version = j.version;
      } else if (version != j.version) {
        document.location.reload();
      }
      return;
    }
    
    if (j.level !== undefined) { // player message
      notice(Mustache.render(T.userReport, {name:j.name, pts:j.pts, level:levels[j.level][0]}));
      return;
    }
    
    var txt = j.text;
    if (player.level >= 3) {
        keywords.forEach(function(kw) {
          if (txt.indexOf(kw) != -1) {
            var tbl = txt.split(kw);
            txt = tbl.join("<span class='alert'>"+kw+"</span>");
          }      
        });
    }
    $(".waiter").hide(250, function() {
      $(".waiter").remove();
    });
    
    var elem = $("<div class='tweet msg'></div>");
    
    elem.append("<img src='"+j.img+"' alt='mugshot'/>");
    elem.append("<span class='tname'>"+j.name+"</span> : ");
    elem.append("<span>"+txt+"</span>");
    
    elem.append("<div style='clear:both;'></div>");
    
    elem.click(function() {
      popup(j, j.text);
    });
    
    var report = $(T.reportBtn);

    report.click(function() {
      report_tweet(j);
    });
    if (player.level < 4) {
      report.hide();
    }
    if (player.level < 2) {
      elem.find("img").hide();
    }
    
    var elem2 = $("<div style='position:relative;'></div>");
    elem2.attr("id", j.id_str);
    
    elem2.append(elem);
    elem2.append(report);
    
    elem2.hide();
    $(".tweetBox").append(elem2);
    elem2.show(250);
    
    if (player.level >= levels.length-1) {
      report.hide();
      setTimeout(function() {
        report.click();
      }, 500);
    }
    
    document.title = Mustache.render(T.title, { nbr: $(".msg").length });
  }

  function startWS() {
    if (stopNet === true || fallBack === true) {
      return;
    }

    if (ws) {
      try {
        ws.close();
      } catch(e) {
      }
    }

    var url = 'ws://' + window.document.location.host+window.document.location.pathname;

    try {
      ws = new WebSocket(url);
    } catch(e) {
      $(".waiter").hide(250, function() {
        $(".waiter").remove();
      });
      return;
    }

    ws.onclose = function(){
      if (fallBack === true) {
        return;
      }
      if (stopNet === true) {
        var elem = $(T.inactive);
        $(".tweetBox").append(elem);
      } else {
        console.log("connection closed by host.");
        var elem = $(T.conClosed);
        $(".tweetBox").append(elem);
        setTimeout(function() {
          startWS();
        }, 1000);
      }
    };
    
    ws.onopen = function(event) {
      console.log("connected");
      $(".tweetBox").append(T.conEstablished);
      $(".tweetBox").append(T.awaitingMsg);
    };
    
    ws.onmessage = function(event) {
      onMessage(JSON.parse(event.data));
    }
  }

  $("#attrib").click(function() {
    $(".attrib").toggle();
  });

  $("#cazeneuve").click(function() {
    $("#cazeneuve").stop();
    $("#cazeneuve").animate({ bottom: -350}, 250, function() {
    });
  });

  share();

  // pigeon flap flap
  var flap = true;
  $("#pigeon2").hide();
  setInterval(function() {
    if (flap) {
      $("#pigeon1").hide();
      $("#pigeon2").show();
    } else {
      $("#pigeon2").hide();
      $("#pigeon1").show();
    }
    flap = !flap;
  }, 1000);
  
  $(".pigeon").click(function() {
    report_tweet({ screen_name: "nitot", id_str: "pigeon"+Math.random()});

    $(".pigeon").stop();
    $(".pigeon").addClass("dead");
    $(".pigeon").animate({ top: $(document).height() + 100 }, 
                         2000, function() {
                           $(".pigeon").removeClass("dead");
                           pigeon();
                         });
  });

  function checkFallback() {
    console.log("checkFallback");
    setTimeout(function() {
      console.log(version);
      if (version === undefined) {
        console.log("WebSocket not working, fall back on AJAX...");
        fallBack = true;
        if (ws) {
          ws.close();
        }
        getTweets();
      }
    }, 5000);
  }

  var tweets = [];
  function getTweets() {
    var tweet = tweets.shift();
    if (tweet) {
      onMessage(tweet);
      setTimeout(getTweets, 3000*Math.random());
    } else {
      console.log("get tweets...");
      $.getJSON("/getTweets", function(data) {
        tweets = data;
        getTweets();
      });
    }
  }
  
});

function pigeon() {
  if ($(".pigeon").hasClass("dead")) {
    return;
  }
  pigeonStarted = true;
  setTimeout(function() {
    var y = ($(document).height() * Math.random()) - ($(".pigeon").height()/2);
    var from = -$(".pigeon").width();
    var to = $(document).width() + $(".pigeon").width();
    var speed = to*5;

    if (Math.random() > 0.5) {
      var tmp = to;
      to = from;
      from = tmp;
    }

    $(".pigeon").css("top", y);
    $(".pigeon").css("left", from);
    
    $(".pigeon").animate({ "left": to}, speed, "linear", function() {
      pigeon();
    });

  }, 60000 * Math.random());
}

function cazeneuve() {
  $("#attrib").show();
  setTimeout(function() {
    var rnd = Math.round(Math.random() *3);
    $("#cazeneuve").animate({ bottom: -275 + (rnd*25)}, 2000, function() {
      setTimeout(function() {
        $("#cazeneuve").animate({ bottom: -350}, 2000, function() {
          cazeneuve();
        });
      }, 2000);
    });
  }, (Math.random()*50000)+10000);

}

function valls() {
  if ($("#valls").hasClass("flip")) {
    $("#valls").animate({ right: 0}, 10000, function() {
      $("#valls").removeClass("flip");
      valls();
    });
  } else {
    $("#valls").animate({ 
      right: $(".lstOutter").width() - $("#valls").width()
    }, 10000, function() {
      $("#valls").addClass("flip");
      valls();
    });
    
  }
}

