import sys

import requests
import urllib.request
#import time
#import lxml.html as lh
from bs4 import BeautifulSoup
#import html5lib

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

#class Mokinys:
    #laikotarpis = ""
    #vardas = ""
    #nuoroda = ""
    #pamokos = [[]]

##############SETUP################
url = "http://www.vaivorykstesgimnazija.lt/tvarkarastis/2_pusmetis/"
sav_dienos = ['pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis']

default_app = firebase_admin.initialize_app(credentials.Certificate('f.json'))
db = firestore.client()
###################################

###################################
def nuskaityti_viena(NUORODA):
    dokumentas = str(urllib.request.urlopen(NUORODA).read(), 'windows-1257')
    soup = BeautifulSoup(dokumentas, 'lxml')

    #m = Mokinys()
    PAVADINIMAS = soup.center.text #Gargzdu ,,Vaivorykstes'' gimnazija, 2 pusmetis, nuo sausio 28
    pamokos = [["" for j in range(6)] for i in range(9)] #tuscias sarasas

    lentele = soup.find('table')
    eilutes = lentele.find_all('tr')

    VARDAS = eilutes[0].text.strip()

    for eilute in range(2, len(eilutes)):
        langeliai = eilutes[eilute].find_all('td')

        for langelis in range(1, len(langeliai)):
            text = langeliai[langelis].text.strip()
            if text == '':
                text = 'langas'

            tempPath = path = sav_dienos[langelis-1] + '/' + str(eilute-2) + '/default/' + text
            temp_doc = db.document(tempPath)
            temp_doc.set({
                u'null': u'null'
            })

            path = sav_dienos[langelis-1] + '/' + str(eilute-2) + '/default/' + text + '/default/' + VARDAS;
            doc_ref = db.document(path)
            doc_ref.set({
                u'mokytojas': u'null',
                u'nuoroda': NUORODA
            })
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
