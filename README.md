# Calorie tracker (iOS) React Native App

This app is a simple data-entry and tracking focused app that allows a user to track their daily calorie intake (meals). The data is stored as structured JSON data and is stored via AsyncStorage that allows built-in iCloud backups. Manual data exports also possible through the app itself, along with data imports.

## Development

#### Requirements
- Node >16
- React-native CLI
- X Code
- Ruby > 2.6.10
- cocoapods > 1.11.3
- watchman

> Generally follow the setup instructions given in [React Native Docs](https://reactnative.dev/docs/environment-setup)

#### Install new dependencies
To install new dependencies, generally follow instructions on that dependency. Some are as simple as an `npm install --save <name>`, while others require linking library files to gems in the project. This can bee done using `npx pod-install ios` from the main directory.

For some dependencies, it can also be required to perform some actions in xcode. An XCode workspace can be created in the `<project_root>/ios` directory.

## Device Installation

#### Development installation
From the main project directory, the project can be built and launched onto a connected iOS device or simulator via the commands:

###### Dev hot-loading build
```
npx react-native start
```
Starts a metro server and auto-reloads app upon changes to files

###### Dev standalone build
```
npx react-native run-ios --mode Release
```
Builds the app onto the device with the development profile.

> Note that all dev builds will expire in 1 week from the initial cerificate installation on an iOS device. This is a restriction from apple and cannot be avoided. Regular re-installs are allowed but require connecting to a dev machine and rebuilding every time.

#### Ad-Hoc device installation
For longer term standalone usage, an Ad-Hoc build can be done on the device with a year-long certificate. Note that this requires an Apple Developer membership account for $99/year.

1. Get an Apple developer account.
1. Open XCode and ensure that your Apple developer account is connected. If not yet done, create a workspace for the app at `<project_root>/ios`.
1. Set the destination of the build to be `Any iOS device (arm64)`
1. Create a build archive. Go to `Project` > `Archive` to start the archival process. This can take some time.
1. Once the archive is complete, the organizer window automatically opens. If you want to export an existing archive or this window did not open, this window can be opened without archiving by going to `Window` > `Organizer`.
1. Click on the archive you wish to load onto the device, and choose `Distribute App`.
1. Choose `Ad-Hoc`, `None` for app-thinning. Over-the-air installation is not necessary if the device is connected via USB. Click `Automatically manage signing`.
1. On the review page, you'll see the profile and certificate that will be used. Each of these has an expiration that is one year from its creation, and after this date the app will have to be re-signed and re-installed.
1. After the `.ipa` file is exported, you can install it onto the device. This can be done via Xcode or Apple Configurator.
##### Xcode App Install
1. Open the devices window from `Windows` > `Devices and Simulators`.
1. If your iOS device is connected, it should show here. Click the `+` button under `Installed Apps` to install a new app
1. Select the `.ipa` file that was exported to install it.
##### Apple Configurator App install
1. Open the `Apple Configurator` app (download it from AppStore if needed).
1. If your phone is connected, it should show up here. Select it and choose `Add` -> `App`. Navigate to the `.ipa` file and install it.
1. Once the process is completed, the app should appear in the "Recently installed" section of the app drawer.
