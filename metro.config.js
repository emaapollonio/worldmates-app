const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Sentry-jev wrapper okoli privzete Expo Metro konfiguracije (debug IDji za source maps).
module.exports = getSentryExpoConfig(__dirname);
