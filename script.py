import sys
import requests
import urllib.request
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import datetime

##############SETUP################
url = "http://www.vaivorykstesgimnazija.lt/tvarkarastis/2_pusmetis/"
sav_dienos = ['pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis']

default_app = firebase_admin.initialize_app(credentials.Certificate('f.json'))
db = firestore.client()
###################################

###################################
def nuskaityti_viena(NUORODA):
    pradzia = datetime.datetime.now()
    dokumentas = str(urllib.request.urlopen(NUORODA).read(), 'windows-1257')
    soup = BeautifulSoup(dokumentas, 'lxml')

    PAVADINIMAS = soup.center.text #Gargzdu ,,Vaivorykstes'' gimnazija, 2 pusmetis, nuo sausio 28
    pamokos = [["" for j in range(6)] for i in range(10)] #tuscias sarasas

    lentele = soup.find('table')
    eilutes = lentele.find_all('tr')

    VARDAS = eilutes[0].text.strip()

    for eilute in range(2, len(eilutes)):
        langeliai = eilutes[eilute].find_all('td')

        for langelis in range(1, len(langeliai)):
            text = langeliai[langelis].text.strip()
            if text == '':
                text = 'langas'
            pamokos[eilute][langelis] = text;

    pirma_pabaiga = datetime.datetime.now()
    print("Scraping done in " + str(pirma_pabaiga - pradzia));

    total = 5 * ( len(eilutes) -2 )
    current = 0

    for diena in range(1, 6):
        nebera_pamoku = True;

        for pamoka in range(len(eilutes)-1, 1, -1):
            if pamokos[pamoka][diena] != 'langas':
                nebera_pamoku = False;

            tempPath = path = sav_dienos[diena-1] + '/' + str(pamoka-2) + '/default/' + pamokos[pamoka][diena]
            temp_doc = db.document(tempPath)
            temp_doc.set({
                u'null': u'null'
            })

            path = sav_dienos[diena-1] + '/' + str(pamoka-2) + '/default/' + pamokos[pamoka][diena] + '/default/' + VARDAS;
            doc_ref = db.document(path)
            doc_ref.set({
                u'mokytojas': u'null',
                u'nuoroda': NUORODA,
                u'nebera_pamoku': nebera_pamoku
            })

            current += 1
            print(str(current) + "/" + str(total))

    antra_pabaiga = datetime.datetime.now()
    print("Upload complete in additional " + str(antra_pabaiga - pirma_pabaiga))
    print("Total time: " + str(antra_pabaiga - pradzia))
###########################################

##################MAIN######################
if len(sys.argv) > 1:
    nuskaityti_viena(sys.argv[1])
else:
    dokumentas = str(urllib.request.urlopen(url).read(), 'windows-1257')
    soup = BeautifulSoup(dokumentas, 'lxml')

    nuoroda = soup.find('a')
    nuskaityti_viena(url + nuoroda['href'])
#############################
