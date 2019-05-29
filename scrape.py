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
def nuskaityti_viena(NUORODA, lygis, progress="", salinti=False):
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
                if salinti:
                    doc_ref.delete()
                else:
                    doc_ref.set({
                        u'mokytojas': mokytojas,
                        u'nuoroda': NUORODA,
                        u'nebera_pamoku': nebera_pamoku
                    })

                current += 1
                load_str = progress + ' ['
                for i in range(0, current):
                    load_str += '*'
                for i in range(current, 45):
                    load_str += '-'

                print(load_str + ']' + SPACES, end="\r")

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

def viena(nuoroda, salinti=False):
    if "http" in nuoroda:
        nuskaityti_viena(nuoroda, 0, salinti)
    else:
        print(nuoroda)
        dokumentas = str(urllib.request.urlopen(url).read(), 'windows-1257')
        soup = BeautifulSoup(dokumentas, 'lxml')

        nuorodos = soup.find_all('a')
        for i in range(len(nuorodos)):
            if nuoroda.lower().strip() in nuorodos[i].text.lower().strip():
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
        progress = str(i-start_idx+1) + '/' + str(end_idx-start_idx)
        nuskaityti_viena(url + nuoroda[i]['href'], 0, progress)

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
        Label(self,text="Kam dabar langas?").grid(row=0,columnspan=4)

        Label(self, text="Nuoroda:").grid(sticky=E)
        self.nuoroda_entry = Entry(self)
        self.nuoroda_entry.grid(row=1, column=1, columnspan=3)

        Label(self, text="Vardas:").grid(sticky=E)
        self.vardas_entry = Entry(self)
        self.vardas_entry.grid(row=2, column=1, columnspan=3)

        Label(self, text="Nuo:").grid(sticky=E)
        self.nuo_entry = Entry(self, width=5)
        self.nuo_entry.grid(row=3, column=1)
        Label(self, text="Iki:").grid(row=3, column=2, sticky=E)
        self.iki_entry = Entry(self, width=5)
        self.iki_entry.grid(row=3, column=3)

        self.mok_var = IntVar()
        Label(self, text="Mokytojas:").grid(row=4, sticky=E)
        self.mokytojas_checkbutton = Checkbutton(self, variable=self.mok_var)
        self.mokytojas_checkbutton.grid(row=4, column=1)
        self.vykdyti_button = Button(self,text="Vykdyti")
        self.vykdyti_button.grid(row=4, column=2, columnspan=2)
        self.vykdyti_button["command"] = self.vykdytiKomandas

        self.output_text = Text(self, height=5, width=30)
        self.output_text.grid(row=5,columnspan=4)

        self.logs_button = Button(self, text="Logs")
        self.logs_button.grid(row=6)
        self.logs_button["command"] = self.logs
        self.clearlogs_button = Button(self, text="Clearlogs")
        self.clearlogs_button.grid(row=6, column=2)
        self.clearlogs_button["command"] = self.clearlogs
        self.visus_button = Button(self, text="Visus")
        self.visus_button.grid(row=6, column=3, columnspan=2)
        self.visus_button["command"] = self.visus

    def vykdytiKomandas(self, event=False):
        mokytojas = self.mok_var.get()

        if self.nuoroda_entry.get() != "":
            self.output_text.insert(END, "nuoroda: " + self.nuoroda_entry.get() + '\n')
            self.nuoroda_entry.delete(0, 'end')
            viena(self.nuoroda_entry.get())
        elif self.vardas_entry.get() != "":
            self.output_text.insert(END, "vardas: " + self.vardas_entry.get() + '\n')
            self.vardas_entry.delete(0, 'end')
            viena(self.vardas_entry.get())
        elif self.nuo_entry.get() != "" and self.iki_entry.get() != "" and self.nuo_entry.get().isnumeric() and self.iki_entry.get().isnumeric():
            self.output_text.insert(END, "nuo: " + self.nuo_entry.get() + " iki: " + self.iki_entry.get() + '\n')
            self.nuo_entry.delete(0, 'end')
            self.iki_entry.delete(0, 'end')
            kelis(int(self.nuo_entry.get()), int(self.iki_entry.get()))
        else: 
            self.output_text.insert(END, "klaida\n")

    def logs(self, event=False):
        f = open("C:/Users/DrFlarre/Documents/GitHub/kam-dabar-langas/log.txt", "r")
        for x in f:
            print(x + '\n')
        f.close()

    def clearlogs(self, event=False):
        f = open("C:/Users/DrFlarre/Documents/GitHub/kam-dabar-langas/log.txt", "w")
        print(" ")
        f.close()

    def visus(self, event=False):
        kelis(-1, -1)

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
        if(sys.argv[2] == '-m'):
            mokytojas = True
            viena(sys.argv[1]) #scrape.py <nuoroda> -m
        if(sys.argv[2] == '-r'):
            viena(sys.argv[1], True)
    else: help()
elif len(sys.argv) == 4: 
    if sys.argv[1].isnumeric() and sys.argv[2].isnumeric() and not sys.argv[3].isnumeric():
        mokytojas = (sys.argv[3] == '-m')
        kelis(int(sys.argv[1]), int(sys.argv[2])) 
    else: help()
else: 
    root = Tk()
    root.wm_protocol("WM_DELETE_WINDOW", root.quit)
    app = Application(master=root)
    app.mainloop()
    root.destroy()

#############################
