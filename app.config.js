// Dinamična konfiguracija: osnova ostane app.json, tukaj dodamo samo tisto,
// kar mora priti iz okolja (ključ ne sme biti trdo zapisan v repozitoriju).
// Ključ se prebere ob buildu: lokalno iz .env, na EAS iz EAS env spremenljivk.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY },
    },
  },
});
