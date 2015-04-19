var player;

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
  }
  if (player.level >= 5) {
    $(".lstOutter").show(1000);
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
    } else {
      player.name = name;
    }
    $("#name").html(player.name);    
  });

  $("#reset").click(function() {
    if (confirm("Recommancer de zero?")) {
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

  function startWS() {
    var url = 'ws://' + window.document.location.host+window.document.location.pathname;
    
    var ws = new WebSocket(url);
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
      //console.log(j);
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

});