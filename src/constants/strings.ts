/**
 * Centralizirana UI besedila.
 *
 * Priprava za morebiten i18n kasneje – ta datoteka NE spreminja vedenja ali
 * izgleda aplikacije, samo premakne obstoječa (slovenska) besedila na eno
 * mesto namesto raztresenih po zaslonih. Ključi so poimenovani po angleški
 * razvojni konvenciji (npr. STRINGS.addPerson.saveButtonAdd), vrednosti pa
 * ostanejo točno trenutno prikazano besedilo.
 */
const APP_NAME = 'MetMap';

export const STRINGS = {
  common: {
    appName: APP_NAME,
    cancel: 'Cancel',
    retry: 'Try again',
    back: 'Back',
    edit: 'Edit',
    delete: 'Delete',
    error: 'Error',
    loading: 'Loading …',
    genericRetryMessage: 'Please try again.',
    unknownError: 'Unknown error',
    offlineBanner: 'Offline – showing last known data',
    loadPeopleErrorGeneric: 'Could not load people.',
  },

  /** Skupno za AddPersonScreen in PersonProfileScreen (izbira/prikaz tipa kontakta). */
  contactLabels: {
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    telegram: 'Telegram',
    email: 'Email',
  },

  tabs: {
    map: 'Map',
    friends: 'Friends',
    trips: 'Trips',
    profile: 'Profile',
  },

  navigation: {
    addPersonTitle: 'Add friend',
    editPersonTitle: 'Edit person',
    personProfileTitle: 'Friend details',
  },

  tabNavigator: {
    addPersonAccessibilityLabel: 'Add friend',
  },

  searchBar: {
    placeholder: 'Search by name, city or country …',
  },

  /** Skupno za MapScreen in ListScreen, ko oseb sploh (še) ni. */
  emptyState: {
    peopleTitle: 'Your friendship atlas awaits',
    peopleSubtitle: 'Add the first person you met while traveling.',
    addPersonButton: 'Add person',
  },

  auth: {
    appName: APP_NAME,
    subtitle: 'Log in or create a new account',
    emailLabel: 'Email',
    emailPlaceholder: 'name@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    signInButton: 'Log in',
    signUpButton: 'Sign up',
    missingFieldsTitle: 'Missing information',
    missingFieldsMessage: 'Enter your email and password.',
    signInFailedTitle: 'Log in failed',
    signUpFailedTitle: 'Sign up failed',
    confirmEmailTitle: 'Check your email',
    confirmEmailMessage: 'We sent you a confirmation link. Once you confirm your email, you can log in.',
  },

  addPerson: {
    privacyNotice: 'Private – your data is stored only on your device.',
    firstNameLabel: 'First name *',
    firstNamePlaceholder: 'e.g. Marco',
    lastNameLabel: 'Last name *',
    lastNamePlaceholder: 'e.g. Rossi',
    locationSectionTitle: 'Where do they live? *',
    countryLabel: 'Country',
    countryPlaceholder: 'Italy',
    cityLabel: 'City',
    cityPlaceholder: 'Rome',
    locationHint:
      'Coordinates are looked up automatically on save (OpenStreetMap / Nominatim) based on the country and city entered.',
    metLocationSectionTitle: 'Where did you meet?',
    metLocationPlaceholder: 'e.g. Hostel Oasis, Lisbon (optional)',
    metLocationHint:
      'If it differs from where they live – this is also geocoded automatically, for the "Where we met" view on the map.',
    contactSectionTitle: 'Contact platform',
    photosSectionTitle: 'Photos',
    photosHint: 'The first photo added is the profile picture; add shared memory photos here.',
    photoActionSheetTitle: "Friend's photos",
    photoActionSheetMessage: 'Choose a source (you can select multiple in the gallery)',
    cameraOption: 'Camera',
    galleryOption: 'Gallery',
    removeAllPhotosOption: 'Remove all photos',
    cameraPermissionTitle: 'Permission needed',
    cameraPermissionMessage: 'Allow camera access to take a photo.',
    galleryPermissionMessage: 'Allow gallery access to choose a photo.',
    photoLoadErrorMessage: 'Could not load the photo.',
    tagsSectionTitle: 'Tags',
    tagsPlaceholder: 'e.g. hostel, travel buddy (Enter or comma adds a tag)',
    noteSectionTitle: 'Notes',
    notePlaceholder: 'Where you met, what you did together, recommendations ...',
    missingFieldsTitle: 'Missing information',
    missingFieldsPrefix: 'Please fill in: ',
    missingFieldNames: {
      firstName: 'first name',
      lastName: 'last name',
      country: 'country',
      city: 'city',
    },
    locationNotFoundTitle: 'Could not find location',
    locationNotFoundMessage: (city: string, country: string) =>
      `We couldn't find coordinates for "${city}, ${country}". Check the spelling of the city/country and try again.`,
    saveErrorTitle: 'Error while saving',
    offlineSaveMessage: 'You need an internet connection to add a person.',
    savingLocation: 'Looking up location …',
    savingPhotos: 'Uploading photos …',
    saving: 'Saving …',
    saveButtonEdit: 'Save changes',
    saveButtonAdd: 'Save to atlas',
    savedToastEdit: 'Person updated',
    savedToastAdd: 'Person saved',
    loadErrorNotFound: 'Could not find the person.',
    loadErrorGeneric: 'Loading failed.',
  },

  personProfile: {
    notFound: 'Could not find the person.',
    loadErrorGeneric: 'Loading failed.',
    missingParamError: 'Missing personId in navigation parameters.',
    noContactTitle: 'No contact',
    noContactSavedMessage: 'No contact saved for this person.',
    noContactUrlMessage: 'Could not convert the contact into a link.',
    openLinkErrorTitle: 'Error',
    openLinkErrorMessage: 'Could not open the link.',
    writeButtonPrefix: 'Message via ',
    writeButtonNoContact: 'No contact saved',
    meetingSectionTitle: 'How we met',
    noteSectionTitle: 'Notes',
    gallerySectionTitle: 'Photo gallery',
    deleteConfirmTitle: 'Delete person',
    deleteConfirmMessage: (name: string) => `Are you sure you want to delete ${name}? This cannot be undone.`,
    deleteErrorTitle: 'Error while deleting',
    deletedToast: 'Person deleted',
    shareButton: 'Share',
    shareErrorMessage: 'Sharing failed. Please try again.',
    shareMessage: (name: string, city: string) => `Met ${name} in ${city} 🌍 – ${APP_NAME}`,
  },

  map: {
    refreshAccessibilityLabel: 'Refresh pins',
    livesOption: 'Where they live',
    metOption: 'Where we met',
    loadErrorTitle: 'Error while loading',
    noFilterResults: 'No results for the selected search/filter.',
    noMetLocations: 'No person has a meeting location set yet.',
    loadingMessage: 'Loading people …',
  },

  list: {
    sortLabel: 'Sort:',
    sortAlpha: 'Alphabetical',
    sortMetDate: 'Meeting date',
    sortCountry: 'Country',
    noFilterResults: 'No results for your search/filter.',
  },

  trips: {
    title: 'Trips',
    subtitle: 'Enter a city or country you plan to visit.',
    searchPlaceholder: 'Where are you traveling? (city or country)',
    promptHint: 'Enter a city or country above to see who you already know there.',
    noMatches: "You don't know anyone there yet.",
    resultHeading: (destination: string, count: number, word: string) =>
      `You know ${count} ${word} in ${destination}`,
    personWordSingular: 'person',
    personWordDual: 'people',
    personWordFew: 'people',
    personWordMany: 'people',
  },

  profile: {
    title: 'Profile',
    subtitle: 'Your account, statistics (number of countries / continents) and settings.',
    statsTitle: 'Statistics',
    statFriends: 'friends',
    statCountries: 'countries',
    statContinents: 'continents',
    logoutButton: 'Log out',
    logoutConfirmTitle: 'Log out',
    logoutConfirmMessage: 'Are you sure you want to log out?',
    logoutErrorTitle: 'Error while logging out',
  },
} as const;
