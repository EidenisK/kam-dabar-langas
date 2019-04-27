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

function vykdyti() {
  var diena = document.getElementById("diena").value;
  var pamoka = document.getElementById("pamoka").value -1;
  var pavadinimas = document.getElementById("pavadinimas").value;

  atnaujintiSarasa(diena, pamoka, pavadinimas);
}

function atnaujintiSarasa(diena, pamoka, pavadinimas) {
  if(debug) console.log(diena + ", " + pamoka + ", " + pavadinimas);
  var path = diena + '/' + pamoka.toString() + '/default'; //visos pamokos tuo metu
  var docRef = firestore.collection(path);

  sarasas.innerHTML = '<li class="nebera_pamoku"><a><i>Pilka spalva reiškia, kad tą dieną nebėra pamokų</i></a></li>';

  firestore.collection(path).get().then(function(snap) {
    snap.forEach(function(doc) {
      if(doc.id.includes(pavadinimas.toLowerCase())) {
        var new_path = path + '/' + doc.id + '/default'; //visi vardai
        firestore.collection(new_path).get().then(function(snap2) {
          snap2.forEach(function(doc2) {
            var text = '<li ';
            if(doc2.data().nebera_pamoku) text += ' class="nebera_pamoku"';
            text += '><a href="' + doc2.data().nuoroda + '">' + doc2.id + '</a></li>';
            sarasas.innerHTML += text;
          });
        });
      }
    });
    locked = false;
  });
}

var dienos = ['pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis'];

var langeliai = document.getElementsByTagName('td');
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
  // INJECT CSS
  var css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = ".txt-rotate > .wrap { border-right: 0.08em solid #fff }";
  document.body.appendChild(css);
};