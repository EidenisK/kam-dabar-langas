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

function vykdyti() {
  var diena = document.getElementById("diena").value;
  var pamoka = document.getElementById("pamoka").value -1;
  var pavadinimas = document.getElementById("pavadinimas").value;

  //console.log(diena + "/" + pamoka.toString() + "/" + pavadinimas);

  var path = diena + '/' + pamoka.toString() + '/default'; //visos pamokos tuo metu
  var docRef = firestore.collection(path);

  sarasas.innerHTML = "";

  firestore.collection(path).get().then(function(snap) {
    snap.forEach(function(doc) {
      if(doc.id.includes(pavadinimas)) {
        var new_path = path + '/' + doc.id + '/default'; //visi vardai
        firestore.collection(new_path).get().then(function(snap2) {
          snap2.forEach(function(doc2) {
            var text = '<li><a href="' + doc2.data().nuoroda + '">' + doc2.id + '</a></li>';
            sarasas.innerHTML += text;
          });
        });
      }
    });
  });
}
