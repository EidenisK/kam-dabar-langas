import sys
import requests
import urllib.request
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import datetime
import time
from tkinter import *

##############SETUP################
url = "http://www.vaivorykstesgimnazija.lt/tvarkarastis/2_pusmetis/"
SPACES = '                       '
sav_dienos = ['pirmadienis', 'antradienis', 'trečiadienis', 'ketvirtadienis', 'penktadienis']
mokytojas = False
default_app = firebase_admin.initialize_app(credentials.Certificate('C:/Users/DrFlarre/Documents/GitHub/kam-dabar-langas/f.json'))
db = firestore.client()
###################################

###################################
def nuskaityti_viena(NUORODA, lygis):
    try:
        pradzia = datetime.datetime.now()
        dokumentas = str(urllib.request.urlopen(NUORODA).read(), 'windows-1257')
        soup = BeautifulSoup(dokumentas, 'lxml')

        PAVADINIMAS = soup.center.text #Gargzdu ,,Vaivorykstes'' gimnazija, 2 pusmetis, nuo sausio 28
        pamokos = [["langas" for j in range(6)] for i in range(11)] #tuscias sarasas

        lentele = soup.find('table')
        eilutes = lentele.find_all('tr')

        VARDAS = eilutes[0].text.strip()

        for eilute in range(2, len(eilutes)):
            langeliai = eilutes[eilute].find_all('td')

            for langelis in range(1, len(langeliai)):
                text = langeliai[langelis].text.strip()
                text = text.replace('/', '')
                if text == '':
                    text = 'langas'
                pamokos[eilute][langelis] = text;

        pirma_pabaiga = datetime.datetime.now()
        #print("Scraping done in " + str(pirma_pabaiga - pradzia));

        total = 5 * ( len(eilutes) -2 )
        current = 0

        for diena in range(1, 6):
            nebera_pamoku = True;

            for pamoka in range(10, 1, -1):
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
                    u'mokytojas': mokytojas,
                    u'nuoroda': NUORODA,
                    u'nebera_pamoku': nebera_pamoku
                })

                current += 1
                print (str(current) + '/45' + SPACES, end="\r")

        antra_pabaiga = datetime.datetime.now()
        #print("Upload complete in additional " + str(antra_pabaiga - pirma_pabaiga))
        #print("Total time: " + str(antra_pabaiga - pradzia))
    except:
        if lygis < 3:
            print('klaida nuskaityme, kartojama...')
            time.sleep(2)
            nuskaityti_viena(NUORODA, lygis +1)
        else:
            print('klaida ties tvarkaraščiu ' + NUORODA)

###########################################

def viena(nuoroda):
    if "http" in nuoroda:
        nuskaityti_viena(nuoroda, 0)
    else:
        print(nuoroda)
        dokumentas = str(urllib.request.urlopen(url).read(), 'windows-1257')
        soup = BeautifulSoup(dokumentas, 'lxml')

        nuorodos = soup.find_all('a')
        for i in range(len(nuorodos)):
            if nuoroda in nuorodos[i].text:
                print(nuorodos[i].text)
                print(i)
                break

    f = open("C:/Users/DrFlarre/Documents/GitHub/kam-dabar-langas/log.txt", "a")
    f.write("viena " + nuoroda + '\n')
    f.close() 

def kelis(start_idx, end_idx):
    dokumentas = str(urllib.request.urlopen(url).read(), 'windows-1257')
    soup = BeautifulSoup(dokumentas, 'lxml')

    nuoroda = soup.find_all('a')
    if start_idx == -1:
        start_idx = 0
    if end_idx == -1:
        end_idx = len(nuoroda)

    for i in range(start_idx, end_idx):
        print(str(i-start_idx+1) + '/' + str(end_idx-start_idx) + SPACES, end="\r\r")
        nuskaityti_viena(url + nuoroda[i]['href'], 0)

    f = open("C:/Users/DrFlarre/Documents/GitHub/kam-dabar-langas/log.txt", "a")
    f.write("kelis " + str(start_idx) + "—" + str(end_idx) + '\n')
    f.close()

def help():
    print("NAUDOJIMAS:\n'scrape.py <nuoroda> [-m: mokytojas]'\n'scrape.py <pradinis idx> <galinis idx> [-m: mokytojas]'")

class Application(Frame):
    nuorodosTekstas = ""
    def say_hi(self):
        print(self.nuorodosTekstas)

    def createWidgets(self):
        self.QUIT = Button(self)
        self.QUIT["text"] = "QUIT"
        self.QUIT['fg'] = 'red'
        self.QUIT['command'] = self.quit
        self.QUIT.pack({"side":"left"})

        self.nuoroda = Entry(self)
        self.nuoroda.pack()

        self.turimasTekstas = StringVar()
        self.turimasTekstas.set("nuoroda...")
        self.nuoroda['textvariable'] = self.turimasTekstas
        self.nuoroda.bind('<Key-Return>', self.print_contents)

        self.hi_there = Button(self)
        self.hi_there["text"] = "rodyti teksta"
        self.hi_there["command"] = self.print_contents
        self.hi_there.pack({"side": "left"})

    def print_contents(self, event=False):
        print("nuoroda dabar yra -->" + self.turimasTekstas.get())

    def __init__(self, master=None):
        Frame.__init__(self, master)
        self.pack()
        self.createWidgets()

##################MAIN######################

if len(sys.argv) == 2:
    if sys.argv[1] == 'log':
        f = open("C:/Users/DrFlarre/Documents/GitHub/kam-dabar-langas/log.txt", "r")
        for x in f:
            print(x + '\n')
        f.close()
    elif sys.argv[1] == 'visi_1459':
        kelis(-1, -1)
    elif sys.argv[1] == 'clearlog':
        f = open("C:/Users/DrFlarre/Documents/GitHub/kam-dabar-langas/log.txt", "w")
        print(" ")
        f.close()
    else:
        viena(sys.argv[1]) #scrape.py <nuoroda>
elif len(sys.argv) == 3:
    if sys.argv[1].isnumeric() and sys.argv[2].isnumeric():
        kelis(int(sys.argv[1]), int(sys.argv[2])) #scrape.py <start> <end>
    elif not sys.argv[1].isnumeric() and not sys.argv[2].isnumeric():
        mokytojas = (sys.argv[2] == '-m')
        viena(sys.argv[1]) #scrape.py <nuoroda> -m
    else: help()
elif len(sys.argv) == 4: 
    if isinstance(sys.argv[1], int) and isinstance(sys.argv[2], int) and isinstance(sys.argv[3], str):
        mokytojas = (sys.argv[3] == '-m')
        kelis(sys.argv[1], sys.argv[2]) 
    else: help()
else: 
    root = Tk()
    app = Application(master=root)
    app.mainloop()
    root.destroy()

#############################
