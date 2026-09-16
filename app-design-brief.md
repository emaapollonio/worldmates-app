# MetMap – Design Brief

## 1. Namen aplikacije
Enostavna, vizualna aplikacija za popotnike in vse, ki radi širijo poznanstva po svetu.
Uporabnik shrani vsako osebo, ki jo spozna na potovanju, skupaj z lokacijo, kjer živi.
Vse osebe se prikažejo kot zaboden na svetovnem zemljevidu – app je osebni "atlas prijateljstev".

**Glavna vrednost:** namesto kaotičnih WhatsApp/Instagram stikov z imeni tipa
"Marco - spoznan v Lizboni 2023", ima uporabnik en pregleden, vizualen prostor za vse te ljudi.

## 2. Ciljna skupina
- Solo popotniki, backpackerji, digitalni nomadi
- Ljudje, ki radi gradijo mednarodna poznanstva (hostli, izmenjave, konference, Erasmus)
- Sekundarno: vsak, ki želi imeti pregled "kje po svetu poznam koga"

## 3. Osrednji koncept (core loop)
1. Spoznaš osebo → jo dodaš v app → zaboden se pojavi na zemljevidu na njeni lokaciji
2. Kasneje: klikneš zaboden → vidiš vse o osebi → po potrebi ji pišeš direktno iz appa
3. Ko planiraš potovanje: pogledaš zemljevid/iščeš po kraju → vidiš koga že poznaš tam

## 4. Glavni zasloni

### A) Zemljevid sveta (domači zaslon)
- Interaktiven svetovni zemljevid, zoom in/out
- Vsaka oseba = en zaboden (pin) na lokaciji, kjer živi
- Več oseb na istem kraju → pin se združi v "cluster" s številko (npr. "5"), ob kliku razširi
- Zgoraj: **search bar** – iskanje po imenu osebe ALI po državi/kraju
- Rezultat iskanja po kraju: pod search barom se izpiše seznam vseh oseb iz tega kraja

### B) Profil osebe (odpre se ob kliku na pin ali na osebo v seznamu)
Vsebuje:
- Ime in priimek
- Skupna fotografija (ena ali več)
- Kraj/država bivanja
- Kontakt (telefon / Instagram / WhatsApp ipd.)
- **Gumb "Piši"** – klik odpre neposredno sporočanje v povezani aplikaciji (deep link na WhatsApp/Instagram/SMS glede na tip kontakta)
- Beležka (note) – prosto besedilo: kje sta se spoznala, kaj sta počela skupaj, poljubne opombe
- Datum in kraj srečanja (samodejno ali ročno)
- Gumb za urejanje / brisanje osebe

### C) Dodajanje nove osebe (+ gumb, viden ves čas – npr. plavajoč gumb spodaj desno)
Enostaven obrazec:
1. Ime, priimek
2. Fotografija (kamera ali galerija)
3. Kraj/država bivanja (iskalnik lokacij, avtomatsko poveže s koordinatami za zemljevid)
4. Kontakt (izbira platforme + vnos)
5. Beležka (neobvezno)
Vse razen imena in lokacije naj bo neobvezno – vnos mora biti hiter (pod 1 minuto).

### D) Seznam vseh oseb (list view)
- Alternativa zemljevidu – enak nabor ljudi, prikazan kot seznam
- Možnost razvrščanja: po abecedi / po celini / po datumu srečanja (najnovejši najprej) / po državi
- Isti search bar kot na zemljevidu

## 5. Dodatne funkcije (predlagano, za kasnejše faze)
- **Opomniki ob načrtovanju potovanja**: uporabnik vnese destinacijo → app pokaže "V Lizboni poznaš 3 osebe"
- **Statistika**: število poznanih ljudi, držav, celin (gamifikacija)
- **Filtri/značke (tagi)**: npr. "hostel", "sopotnik", "lokalec", "delo"
- **Backup/cloud sinhronizacija**: da podatki ne izginejo ob izgubi telefona
- **Zasebnost by design**: jasno komunicirati, da so podatki zasebni (ni javnega feeda, ni deljenja s tujci)

## 6. Ton in vizualna identiteta
- Toplo, prijateljsko, potovalno vzdušje (ne korporativno)
- Barvna shema naj se poveže z idejo "sveta/zemljevida" – npr. zemeljski/pastelni toni
- Enostavnost je prioriteta: uporabnik naj v manj kot minuti doda osebo med potovanjem, na hitro, z enim palcem

## 7. Tehnične opombe za dizajn
- Mobile-first (iOS + Android)
- Zemljevid kot centralni element – mora biti hiter tudi pri velikem številu pinov (clustering)
- Deep linking na zunanje komunikacijske app (WhatsApp, Instagram, SMS, Telegram)
- Offline dodajanje osebe (sync ko je spet splet) – ker se popotniki pogosto nahajajo brez signala
