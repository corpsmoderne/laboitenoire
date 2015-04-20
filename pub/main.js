var player;
var ws;

function reset() {
  player = {
    name: "Patriote-"+Math.round(Math.random()*65535).toString(16),
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
  [ "suspect", 5 ],       // 0
  [ "informateur", 15],   // 1
  [ "agent spécial", 50], // 2
  [ "député", 100],       // 3
  [ "Cazeneuve", 250],    // 4
  [ "Valls", 500],        // 5
  [ "Dark Vador", 65535 ]
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
    var s = 8 + (i*i);
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
    document.title = "("+$(".msg").length+") La Boîte Noire";
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
    var elem = $("<div class='tweet' style='background:green;color: white;'>BRAVO PATRIOTE! TU PASSES AU NIVEAU D'ACCREDIATION SUPERIEUR: "+levels[player.level][0]+"</div>");

    ws.send(JSON.stringify({ name:player.name, 
                             pts:player.pts,
                             level: player.level}));



    $(".tweetBox").append(elem);
  }
}

function popup(j, txt) {
  $(".popup").remove();
  var elem = $("<div class='popup'></div>");
  var a = $("<a href="+j.url+" target='_blank'></a>");
  elem.append("<a href='https://twitter.com/"+j.screen_name+"' target='_blank'><img src='"+j.img+"' alt='mugshot'/></a>");
  elem.append("<span>"+j.name+" :</span>");
  a.append(txt);
  elem.append(a);
  elem.append("<div style='clear:both;'></div>");
  
  elem.append("<hr/>");

  var close = $("<button style='float:right;'>Fermer</button>");
  close.click(function() {
    $(".popup").remove();
  });

  var report = $("<button>Dénoncer</button>");
  report.click(function() {
    report_tweet(j);
    $(".popup").remove();
  });
  elem.append(report);
  
  elem.append(close);
  
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
  }

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
    var name = prompt("Veuillez decliner votre identité:");
    if (name.length == 0) {
      alert("L'anonymat est intedit!");
      return;
    }

    for(var i=0; i < name.length; i++) {
      var l = name[i];
      if ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-.0123456789".indexOf(l) === -1) {
        alert("Nom interdit: caractères invalides");
        return
      }
    }

    player.name = name;

    $("#name").html(player.name);    
  });

  $("#reset").click(function() {
    if (confirm("Recommencer de zéro?")) {
      delete localStorage['player'];
      document.location.reload();
    }
  });

  $("#start").click(function() {
    $(".tutorial").hide(1000);
    $(".tweetOutter").show(1000, function() {
      startWS();
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
      notice('<b>Partage ou tu es un traître!</b> <a href="http://www.twitter.com/share?url=http%3A%2F%2Flaboitenoire.corpsmoderne.net%2F" target="_blank">Twitter</a> <a href="http://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Flaboitenoire.corpsmoderne.net%2F" target="_blank">Facebook</a>');
      share();
    }, 60000+(Math.random()*3*60000));
  }

  function startWS() {
    var url = 'ws://' + window.document.location.host+window.document.location.pathname;

    try {
      ws = new WebSocket(url);
    } catch(e) {
      $(".waiter").hide(250, function() {
        $(".waiter").remove();
      });
      
      notice("<b>Ce navigateur est trop vieux pour dénoncer efficacement!</b> Essaye avec <a target='_blank' href='https://www.google.fr/chrome/browser/desktop/'>Chrome</a> ou <a target='_blank' href='https://www.mozilla.org/fr/firefox/new/'>Firefox</a>, les navigateurs des vrais patriotes!");
      return;
    }


    ws.onclose = function(){
      console.log("connection closed by host.");
      var elem = $("<div class='tweet alert-red'>DECONNEXION DU SERVEUR...RECONNEXION EN COURS...</div>");
      $(".tweetBox").append(elem);
      setTimeout(function() {
        startWS();
      }, 1000);
    };
    
    ws.onopen = function(event) {
      console.log("connected");
      var elem = $("<div class='tweet alert-green'>CONNEXION AU SERVEUR DE SURVEILLANCE ETABLIE</div>");
      $(".tweetBox").append(elem);
      var elem2 = $("<div class='tweet waiter'>En attente de messages... <span class='loading'>|</span></div>");
      $(".tweetBox").append(elem2);
    };
    
    ws.onmessage = function(event) {
      var j = JSON.parse(event.data);
      if (j.level !== undefined) { // player message
        console.log(j);
        notice("<b>"+j.name+"</b> à dénoncé "+j.pts+" traîtres et passe au niveau <b>"+levels[j.level][0]+"</b>.");
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
        popup(j, txt);
      });

      var report = $("<button class='reportBtn'>Dénoncer</button>");
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
      
      document.title = "("+$(".msg").length+") La Boîte Noire";
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

});

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

