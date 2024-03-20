# Energy Tracker: The Dual-Track Energy Tariff Widget

Energy Tracker is a customisable widget for iOS devices, designed to work with the Scriptable app. It allows users to track and display both gas and electricity tariffs on their home screen, fetching up-to-date tariff information from the Octopus Energy API. With Energy Tracker, you can easily keep an eye on your energy costs, making it easier to manage your household energy consumption.

## Features

- **Dual Energy Tracking**: Monitors both gas and electricity prices simultaneously.
- **Customisable Display**: Offers options to adjust visual elements like colors and symbols.
- **Automatic Updates**: Fetches the latest tariff data to keep you informed about price changes.

## Requirements

- iOS 14.0 or later.
- Scriptable app installed on your device.

## Installation

1. **Download Scriptable**: If you haven't already, download and install the Scriptable app from the iOS App Store.
2. **Add the Script**: Open Scriptable and tap the '+' icon to create a new script. Name it `Octopus Energy Tracker`.
3. **Copy and Paste**: Copy the code from the `Energy Tracker.js` file (available in this GitHub repository) and paste it into the newly created script in Scriptable.

## Usage

After installing the script, you can add the widget to your home screen:

1. **Long Press on Home Screen**: Enter jiggle mode by long-pressing an empty area on your home screen or pressing and holding an app until the apps start jiggling.
2. **Add Widget**: Tap the '+' icon in the top left corner, search for Scriptable, and select it.
3. **Choose Widget Size**: Pick the medium-sized widget for the best layout, and tap 'Add Widget'.
4. **Configure Widget**: Tap the newly added widget, select 'Energy Tracker' from the Script option, and hit 'Choose'.
5. **Place the Widget**: Move the widget to your preferred location on the home screen.

## Customisation

Energy Tracker allows for basic customisation through the script code. You can adjust the following:

- **Background Color**: Change the `widget.backgroundColor` value to customize the widget's background color.
- **Text Color**: Modify `header.textColor` and other text color properties to fit your theme.
- **API Keys**: If required by future API changes, update the base URL or add authentication details within the fetch call.
- **Region Code**: Changing the `regionCode` constant to your allocated residence. Please visit [Gas Tracker](https://shorturl.at/lLN89) to find out yours.

## Troubleshooting

If you encounter any issues with data not displaying correctly, ensure your device has an active internet connection and that there are no typos in the product and tariff codes. For further assistance, open an issue on this GitHub repository.

## Contribution

Contributions to Energy Tracker are welcome! Whether it's suggesting new features, reporting bugs, or improving the code, feel free to open an issue or pull request.

## License

Energy Tracker is released under the MIT License. See the LICENSE file for more details.
