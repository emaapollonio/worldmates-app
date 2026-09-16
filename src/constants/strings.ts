/**
 * Centralizirana UI besedila.
 *
 * Priprava za morebiten i18n kasneje – ta datoteka NE spreminja vedenja ali
 * izgleda aplikacije, samo premakne obstoječa (slovenska) besedila na eno
 * mesto namesto raztresenih po zaslonih. Ključi so poimenovani po angleški
 * razvojni konvenciji (npr. STRINGS.addPerson.saveButtonAdd), vrednosti pa
 * ostanejo točno trenutno prikazano besedilo.
 */
export const STRINGS = {
  common: {
    cancel: 'Prekliči',
    retry: 'Poskusi znova',
    back: 'Nazaj',
    edit: 'Uredi',
    delete: 'Izbriši',
    error: 'Napaka',
    loading: 'Nalaganje …',
    genericRetryMessage: 'Poskusi znova.',
    unknownError: 'Neznana napaka',
  },

  /** Skupno za AddPersonScreen in PersonProfileScreen (izbira/prikaz tipa kontakta). */
  contactLabels: {
    phone: 'Telefon',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    telegram: 'Telegram',
    email: 'E-pošta',
  },

  tabs: {
    map: 'Zemljevid',
    friends: 'Prijatelji',
    trips: 'Potovanja',
    profile: 'Profil',
  },

  navigation: {
    addPersonTitle: 'Dodaj prijatelja',
    editPersonTitle: 'Uredi osebo',
    personProfileTitle: 'Podrobnosti prijatelja',
  },

  tabNavigator: {
    addPersonAccessibilityLabel: 'Dodaj prijatelja',
  },

  searchBar: {
    placeholder: 'Išči po imenu, kraju ali državi …',
  },

  /** Skupno za MapScreen in ListScreen, ko oseb sploh (še) ni. */
  emptyState: {
    peopleTitle: 'Tvoj atlas prijateljstev še čaka',
    peopleSubtitle: 'Dodaj prvo osebo, ki si jo spoznal/-a na potovanju.',
    addPersonButton: 'Dodaj osebo',
  },

  auth: {
    appName: 'MetMap',
    subtitle: 'Prijavi se ali ustvari nov račun',
    emailLabel: 'E-pošta',
    emailPlaceholder: 'ime@primer.com',
    passwordLabel: 'Geslo',
    passwordPlaceholder: '••••••••',
    signInButton: 'Prijava',
    signUpButton: 'Registracija',
    missingFieldsTitle: 'Manjkajoči podatki',
    missingFieldsMessage: 'Vpiši e-pošto in geslo.',
    signInFailedTitle: 'Prijava ni uspela',
    signUpFailedTitle: 'Registracija ni uspela',
    confirmEmailTitle: 'Preveri e-pošto',
    confirmEmailMessage: 'Poslali smo ti potrditveno povezavo. Ko potrdiš e-pošto, se lahko prijaviš.',
  },

  addPerson: {
    privacyNotice: 'Zasebno – podatki so shranjeni samo na tvoji napravi.',
    firstNameLabel: 'Ime *',
    firstNamePlaceholder: 'npr. Marco',
    lastNameLabel: 'Priimek *',
    lastNamePlaceholder: 'npr. Rossi',
    locationSectionTitle: 'Kje živi? *',
    countryLabel: 'Država',
    countryPlaceholder: 'Italija',
    cityLabel: 'Kraj',
    cityPlaceholder: 'Rim',
    locationHint:
      'Koordinate se ob shranjevanju samodejno poiščejo (OpenStreetMap / Nominatim) glede na vpisano državo in kraj.',
    metLocationSectionTitle: 'Kje sta se spoznala?',
    metLocationPlaceholder: 'npr. Hostel Oasis, Lizbona (neobvezno)',
    metLocationHint:
      'Če se razlikuje od kraja bivanja – tudi to se samodejno geokodira, za pogled "Kje smo se spoznali" na zemljevidu.',
    contactSectionTitle: 'Kontaktna platforma',
    photosSectionTitle: 'Fotografije',
    photosHint: 'Prva dodana slika je profilna; tu dodaš še skupne spominske slike.',
    photoActionSheetTitle: 'Fotografije prijatelja',
    photoActionSheetMessage: 'Izberi vir (v galeriji lahko izbereš več naenkrat)',
    cameraOption: 'Kamera',
    galleryOption: 'Galerija',
    removeAllPhotosOption: 'Odstrani vse fotografije',
    cameraPermissionTitle: 'Ni dovoljenja',
    cameraPermissionMessage: 'Za fotografiranje omogoči dostop do kamere.',
    galleryPermissionMessage: 'Za izbiro slike omogoči dostop do galerije.',
    photoLoadErrorMessage: 'Fotografije ni bilo mogoče naložiti.',
    tagsSectionTitle: 'Tagi',
    tagsPlaceholder: 'npr. hostel, sopotnik (Enter ali vejica doda tag)',
    noteSectionTitle: 'Zaznamki / opombe',
    notePlaceholder: 'Kje sta se spoznala, kaj sta počela skupaj, priporočila ...',
    missingFieldsTitle: 'Manjkajoči podatki',
    missingFieldsPrefix: 'Izpolni še: ',
    missingFieldNames: {
      firstName: 'ime',
      lastName: 'priimek',
      country: 'država',
      city: 'kraj',
    },
    locationNotFoundTitle: 'Lokacije ni bilo mogoče najti',
    locationNotFoundMessage: (city: string, country: string) =>
      `Za "${city}, ${country}" nismo našli koordinat. Preveri zapis kraja/države in poskusi znova.`,
    saveErrorTitle: 'Napaka pri shranjevanju',
    savingLocation: 'Iščem lokacijo …',
    savingPhotos: 'Nalagam fotografije …',
    saving: 'Shranjujem …',
    saveButtonEdit: 'Shrani spremembe',
    saveButtonAdd: 'Shrani v atlas',
    savedToastEdit: 'Oseba posodobljena',
    savedToastAdd: 'Oseba shranjena',
    loadErrorNotFound: 'Osebe ni bilo mogoče najti.',
    loadErrorGeneric: 'Nalaganje ni uspelo.',
  },

  personProfile: {
    notFound: 'Osebe ni bilo mogoče najti.',
    loadErrorGeneric: 'Nalaganje ni uspelo.',
    missingParamError: 'Manjka personId v navigacijskih parametrih.',
    noContactTitle: 'Ni kontakta',
    noContactSavedMessage: 'Za to osebo ni shranjenega kontakta.',
    noContactUrlMessage: 'Kontakta ni bilo mogoče pretvoriti v povezavo.',
    openLinkErrorTitle: 'Napaka',
    openLinkErrorMessage: 'Povezave ni bilo mogoče odpreti.',
    writeButtonPrefix: 'Piši prek ',
    writeButtonNoContact: 'Ni shranjenega kontakta',
    meetingSectionTitle: 'Kako sva se spoznala',
    noteSectionTitle: 'Opombe',
    gallerySectionTitle: 'Galerija slik',
    deleteConfirmTitle: 'Izbriši osebo',
    deleteConfirmMessage: (name: string) => `Res želiš izbrisati ${name}? Tega ni mogoče razveljaviti.`,
    deleteErrorTitle: 'Napaka pri brisanju',
    deletedToast: 'Oseba izbrisana',
  },

  map: {
    refreshAccessibilityLabel: 'Osveži pine',
    livesOption: 'Kje živijo',
    metOption: 'Kje smo se spoznali',
    loadErrorTitle: 'Napaka pri nalaganju',
    noFilterResults: 'Ni zadetkov za izbrano iskanje/filter.',
    noMetLocations: 'Nobena oseba (še) nima izpolnjenega kraja srečanja.',
    loadingMessage: 'Nalagam osebe …',
  },

  list: {
    sortLabel: 'Razvrsti:',
    sortAlpha: 'Abeceda',
    sortMetDate: 'Datum srečanja',
    sortCountry: 'Država',
    noFilterResults: 'Ni zadetkov za tvoje iskanje/filter.',
  },

  trips: {
    title: 'Potovanja',
    subtitle: 'Vnesi kraj ali državo, ki jo planiraš obiskati.',
    searchPlaceholder: 'Kam potuješ? (kraj ali država)',
    promptHint: 'Vnesi kraj ali državo zgoraj, da vidiš, koga že poznaš tam.',
    noMatches: 'Še ne poznaš nikogar tam.',
    resultHeading: (destination: string, count: number, word: string) =>
      `V ${destination} poznaš ${count} ${word}`,
    personWordSingular: 'oseba',
    personWordDual: 'osebi',
    personWordFew: 'osebe',
    personWordMany: 'oseb',
  },

  profile: {
    title: 'Profil',
    subtitle: 'Uporabnikov račun, statistika (št. držav / celin) in nastavitve.',
    statsTitle: 'Statistika',
    statFriends: 'prijateljev',
    statCountries: 'držav',
    statContinents: 'celin',
    logoutButton: 'Odjava',
    logoutConfirmTitle: 'Odjava',
    logoutConfirmMessage: 'Se res želiš odjaviti?',
    logoutErrorTitle: 'Napaka pri odjavi',
  },
} as const;
