import type { MapStyleElement } from 'react-native-maps';

/**
 * Retro/vintage papirnat zemljevid (Google Maps JSON style), usklajen z
 * "vintage travel stamp" barvno paleto (glej src/theme/colors.ts). Velja
 * samo, kjer je aktiven PROVIDER_GOOGLE (Android) – na iOS (Apple Maps)
 * ga react-native-maps ne uveljavi, zato je tam brez učinka.
 *
 * Namenoma brez cest/transporta/POI-jev in brez lokalnih/soseskih mej –
 * ostanejo samo obrisi držav in voda, kot na stari potovalni karti.
 */
export const VINTAGE_MAP_STYLE: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#F1E6D2' }, { saturation: -40 }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A7860' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F1E6D2' }, { weight: 3 }] },

  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F1E6D2' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#E7D8BE' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.province', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#A2432C' }, { weight: 0.8 }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3A2E1F' }],
  },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#A9C9C2' }] },
  { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
