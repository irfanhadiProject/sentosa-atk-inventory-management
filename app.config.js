export default () => {
  const ENV = process.env.APP_ENV || 'prod';
  const isDev = ENV === 'dev';

  console.log("ENV:", ENV);

  return {
    name: isDev ? "Sentosa ATK (Dev)" : "Sentosa ATK",
    slug: "sistem-inventaris-sentosa-atk",
    version: "1.2.2",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "sisteminventarissentosaatk",
    userInterfaceStyle: "automatic",

    ios: {
      buildNumber: "11",
      supportsTablet: true
    },

    android: {
      package: isDev
        ? "com.anonymous.sisteminventarissentosaatk.dev"
        : "com.anonymous.sisteminventarissentosaatk",
      versionCode: 11,
      permissions: ["REQUEST_INSTALL_PACKAGES"],
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      googleServicesFile: "./google-services.json"
    },

    updates: {
      url: "https://u.expo.dev/d9e98c14-1318-432b-88a3-3889af0bf951",
      fallbackToCacheTimeout: 0
    },

    runtimeVersion: {
      policy: "appVersion"
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#ffffff"
          }
        }
      ],
      "expo-sqlite",
      "@react-native-firebase/app"
    ],

    experiments: {
      typedRoutes: true
    },

    extra: {
      router: {},
      env: ENV,
      eas: {
        projectId: "d9e98c14-1318-432b-88a3-3889af0bf951"
      }
    }
  };
};