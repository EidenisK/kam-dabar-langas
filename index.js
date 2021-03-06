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
  $('#main-list').html("<li><a>Sąrašas tuščias</a></li><li><a><i>Jeigu manote, kad tai klaida, sutrumpinkite paieškos frazę</i></a></li>");
  locked = false;
  if(debug) console.log("unlocked");
}

var visi_elementai = [];

function atnaujintiSarasa(diena, pamoka, pavadinimas) {
  $("#nameSearch").val("");
  visi_elementai = [];

  $("#main-list").html("<li><a>Kraunama...</a></li>");
  if(debug) console.log(diena + ", " + pamoka + ", " + pavadinimas);

  var dataRef = firestore.doc("data/uses");
  dataRef.update({"n": firebase.firestore.FieldValue.increment(1)});

  var path = diena + '/' + pamoka.toString() + '/default'; //visos pamokos tuo metu
  var docRef = firestore.collection(path);
  var allText = pavadinimas.toLowerCase().includes('langas') ? '<li class="nebera_pamoku"><a><i>Pilka spalva reiškia, kad tą dieną nebėra pamokų</i></a></li>' : '';
  $("#main-list").innerHTML += allText;

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

      if(doc.id.toLowerCase().includes(pavadinimas.toLowerCase())) {
        found = true;
        var new_path = path + '/' + doc.id + '/default'; //visi vardai

        firestore.collection(new_path).get().then(function(snap2) {
          num_of_doc2 = 0;

          if(snap.size != 1 && !doc.id.toLowerCase().includes("langas")) var naujas_elementas = '<li class="nebera_pamoku grupes_pavadinimas"><a><b>' + doc.id + '</b></a></li>';
          visi_elementai.push(naujas_elementas);

          snap2.forEach(function(doc2) {
            num_of_doc2++;
            var naujas_elementas = '<li class="' + (doc2.data().nebera_pamoku ? 'nebera_pamoku' : '') + (doc2.data().mokytojas ? ' mokytojas' : '') + '"><a href="' + doc2.data().nuoroda + '">' + doc2.id + '</a></li>';
            visi_elementai.push(naujas_elementas);
            if(debug) console.log(visi_elementai[visi_elementai.length -1]);

            if(num_of_doc == snap.size && num_of_doc2 == snap2.size) {
              //$("#main-list").html(allText);
              if(debug) console.log("starting filterNames with " + visi_elementai.length + 'elements');
              filterNames();
              locked = false;
              if(debug) console.log("unlocked");
              $("#nameSearch").show();
              return;
            }
          });
        });
      }

      if(num_of_doc == snap.size && !found) tusciasSarasas();
    });
  });
}

function tinkaPavadinimas(pavadinimas) {
  if(pavadinimas.length >= 3) return true;
  else {
    $("#pamokos-pavadinimas").css({"color": "red"});
    $("#main-list").html('<li><a><i>Bent 3 simboliai</i></a></li>');
    return false;
  }
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
      if(tinkaPavadinimas(pavadinimas))
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

$('#pamokos-pavadinimas').bind("paste", function(e) {
  e.preventDefault();
  var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt("paste something");
  $("#pamokos-pavadinimas").html(text);
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

  var useRef = firestore.doc("data/uses");
  useRef.get().then(function(doc) {
    document.getElementById("useCounter").innerHTML = doc.data().n;
  });
};

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
    if(tinkaPavadinimas(pavadinimas))
      atnaujintiSarasa(dienos[mob_diena], mob_pamoka, pavadinimas);
  });
});

$('[contenteditable]').on('paste',function(e) {
    e.preventDefault();
    var text = (e.originalEvent || e).clipboardData.getData('text/plain') || prompt('Paste something..');
    document.execCommand('insertText', false, text);
});

function filterNames()
{
  if(debug) console.log("filtering names");
  var ieskomas = $("#nameSearch").val();
  if($("#nameSearch").val() == null) ieskomas = "";
  ieskomas.trim();
  var pridedamas_tekstas;
  $("#main-list").html( $("#pamokos-pavadinimas").text().toLowerCase().includes('langas') ? '<li class="nebera_pamoku"><a><i>Pilka spalva reiškia, kad tą dieną nebėra pamokų</i></a></li>' : '' );
  for (var i = 0; i < visi_elementai.length; i++) {
    if(visi_elementai[i] == undefined) continue;
    if(ieskomas == "" || visi_elementai[i].toLowerCase().includes(ieskomas.toLowerCase()) || visi_elementai[i].toLowerCase().includes("grupes_pavadinimas")) {
      document.getElementById("main-list").innerHTML += visi_elementai[i];
    }
  }  
}