// Initialize Firebase
var config = {
  apiKey: "AIzaSyBtl4PbyMarx7DOH2PO-UwdKM0AD3LM80M",
  authDomain: "kam-dabar-langas.firebaseapp.com",
  databaseURL: "https://kam-dabar-langas.firebaseio.com",
  projectId: "kam-dabar-langas",
  storageBucket: "kam-dabar-langas.appspot.com",
  messagingSenderId: "777972655000"
};
firebase.initializeApp(config);

const firestore = firebase.firestore();
const sarasas = document.getElementById("main-list");
var displayCarouselAnimation = true;
var debug = false;
var locked = false;

function tusciasSarasas() {
  $('#main-list').html("<li><a>Sąrašas tuščias</a></li>");
  locked = false;
  if(debug) console.log("unlocked");
}

function atnaujintiSarasa(diena, pamoka, pavadinimas) {
  $("#main-list").html("<li><a>Kraunama...</a></li>");
  if(debug) console.log(diena + ", " + pamoka + ", " + pavadinimas);

  var path = diena + '/' + pamoka.toString() + '/default'; //visos pamokos tuo metu
  var docRef = firestore.collection(path);
  var allText = pavadinimas.toLowerCase().includes('langas') ? '<li class="nebera_pamoku"><a><i>Pilka spalva reiškia, kad tą dieną nebėra pamokų</i></a></li>' : '';

  firestore.collection(path).get()
  .catch(function(error) {
    if(debug) console.log(error.what);
    tusciasSarasas();
    return;
  })
  .then(function(snap) {
    if(snap.size == 0) { tusciasSarasas(); return; }
    var num_of_doc = 0;
    var found = false;

    snap.forEach(function(doc) {
      num_of_doc++;

      if(doc.id.includes(pavadinimas.toLowerCase())) {
        found = true;
        var new_path = path + '/' + doc.id + '/default'; //visi vardai

        firestore.collection(new_path).get().then(function(snap2) {
          num_of_doc2 = 0;

          snap2.forEach(function(doc2) {
            num_of_doc2++;
            allText += '<li ' + (doc2.data().nebera_pamoku ? ' class="nebera_pamoku"' : '') + '><a href="' + doc2.data().nuoroda + '">' + doc2.id + '</a></li>';

            if(num_of_doc == snap.size && num_of_doc2 == snap2.size) {
              $("#main-list").html(allText);
              locked = false;
              if(debug) console.log("unlocked");
              return;
            }
          });
        });
      }

      if(num_of_doc == snap.size && !found) tusciasSarasas();
    });
  });
}

var dienos = ['pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis'];

//var langeliai = document.getElementsByTagName('td');
var langeliai = $("#main-table td");
Array.from(langeliai).forEach(function(langelis) {
  var dienos_nr = $(langelis).index(),
      pamokos_nr = $(langelis).parent().index();
  langelis.addEventListener("click", function() {
    if(displayCarouselAnimation) {
      $("#pamokos-pavadinimas").css("color", "red");
      $("#pamokos-pavadinimas").focus();
      displayCarouselAnimation = false;
      if(debug) console.log("text not yet edited");
    } else if(!locked) {
      if(debug) console.log("locked");
      locked = true;
      var pavadinimas = $("#pamokos-pavadinimas").text();
      atnaujintiSarasa(dienos[dienos_nr-1], pamokos_nr-1, pavadinimas);
    }
  });
});

var timeoutvar;

$("#pamokos-pavadinimas").bind("click", function() {
  if(displayCarouselAnimation) {
    clearTimeout(timeoutvar);
    var css = document.createElement("style");
    css.type = "text/css";
    css.innerHTML = ".txt-rotate > .wrap { border-right: none }";
    document.body.appendChild(css);
  }
  $("#pamokos-pavadinimas").css("color", "white");
  displayCarouselAnimation = false;
});

var TxtRotate = function(el, toRotate, period) {
  this.toRotate = toRotate;
  this.el = el;
  this.loopNum = 0;
  this.period = parseInt(period, 10) || 2000;
  this.txt = '';
  this.tick();
  this.isDeleting = false;
};

TxtRotate.prototype.tick = function() {
  var i = this.loopNum % this.toRotate.length;
  var fullTxt = this.toRotate[i];

  if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
  } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
  }

  this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

  var that = this;
  var delta = 300 - Math.random() * 100;

  if (this.isDeleting) { delta /= 2; }

  if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    this.isDeleting = true;
  } else if (this.isDeleting && this.txt === '') {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
  }

  if(displayCarouselAnimation)
    timeoutvar = setTimeout(function() {
       that.tick();
    }, delta);
};

window.onload = function() {
  var elements = document.getElementsByClassName('txt-rotate');
  for (var i=0; i<elements.length; i++) {
    var toRotate = elements[i].getAttribute('data-rotate');
    var period = elements[i].getAttribute('data-period');
    if (toRotate) {
      new TxtRotate(elements[i], JSON.parse(toRotate), period);
    }
  }
};

/*//var langeliai = document.getElementsByTagName('td');
var langeliai = $("#main-table td");
Array.from(langeliai).forEach(function(langelis) {
  var dienos_nr = $(langelis).index(),
      pamokos_nr = $(langelis).parent().index();
  langelis.addEventListener("click", function() {
    if(displayCarouselAnimation) {
      $("#pamokos-pavadinimas").css("color", "red");
      $("#pamokos-pavadinimas").focus();
      displayCarouselAnimation = false;
      if(debug) console.log("text not yet edited");
    } else if(!locked) {
      if(debug) console.log("locked");
      locked = true;
      var pavadinimas = $("#pamokos-pavadinimas").text();
      atnaujintiSarasa(dienos[dienos_nr-1], pamokos_nr-1, pavadinimas);
    }
  });
});*/

var mob_diena, mob_pamoka;

var dienu_langeliai = $("#day-select td");
Array.from(dienu_langeliai).forEach(function(langelis) {
  langelis.addEventListener("click", function() {
    if(displayCarouselAnimation) {
      $("#pamokos-pavadinimas").css("color", "red");
      $("#pamokos-pavadinimas").focus();
      displayCarouselAnimation = false;
      if(debug) console.log("text not yet edited");
    } else if(!locked) {
      mob_diena = $(langelis).parent().index();
      $("#day-select").hide();
      $("#pamokos-select").show();
      if(debug) console.log(mob_diena);
    }
  });
});

var pamokos_langeliai = $("#pamokos-select td");
Array.from(pamokos_langeliai).forEach(function(langelis) {
  langelis.addEventListener("click", function() {
    mob_pamoka = $(langelis).parent().index();
    $('#pamokos-select').hide();
    $('#day-select').show();

    var pavadinimas = $("#pamokos-pavadinimas").text();
    atnaujintiSarasa(dienos[mob_diena], mob_pamoka, pavadinimas);
  });
});