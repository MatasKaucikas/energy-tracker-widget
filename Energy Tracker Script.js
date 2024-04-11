// Scriptable Widget for Displaying Energy and Gas Tariff Information
// Adapted from https://github.com/smalley1992/smalley1992.github.io/blob/main/OctopusTrackerSmallWidget.scriptable

const widget = new ListWidget(); // Initialise a new list widget
widget.backgroundColor = new Color("#100030"); // Set the background color of the widget

widget.addSpacer(20); // Add space at the top
const header = widget.addText("Energy Tracker"); // Add header text
header.font = Font.boldSystemFont(14); // Set the font and size of the header
header.textColor = Color.white(); // Set the color of the header text
widget.addSpacer(8); // Add space below the header

// Function to adjust the given date for British Summer Time (BST)
function adjustForBST(date) {
    // BST starts at 01:00 UTC on the last Sunday of March
    const bstStart = new Date(Date.UTC(date.getUTCFullYear(), 2, 31));
    bstStart.setUTCDate(bstStart.getUTCDate() - bstStart.getUTCDay()); // Move to last Sunday
    bstStart.setUTCHours(1, 0, 0, 0); // Set to 01:00 UTC

    // BST ends at 01:00 UTC on the last Sunday of October
    const bstEnd = new Date(Date.UTC(date.getUTCFullYear(), 9, 31));
    bstEnd.setUTCDate(bstEnd.getUTCDate() - bstEnd.getUTCDay());
    bstEnd.setUTCHours(1, 0, 0, 0);

    // Check if current date is within BST period
    if (date >= bstStart && date < bstEnd) {
        // Adjust for BST by adding one hour
        return new Date(date.getTime() + 3600000);
    }
    return date; // Return unmodified date if not within BST period
}

// Function to fetch tariff data for electricity or gas
async function fetchTariffData(productCode, tariffCode) {
    const today = adjustForBST(new Date()); // Get today's date
    const tomorrow = adjustForBST(new Date(today.getTime() + 86400000)); // Calculate tomorrow's date
    const baseUrl = `https://api.octopus.energy/v1/products/${productCode}/`; // Base URL for the API
    const tariffType = tariffCode.substring(0, 1).toUpperCase() == 'G' ? 'gas' : 'electricity';

    let urlToday, urlTomorrow;
    if (tariffType == 'electricity') {
        // Handle electricity tariffs (half-hourly updates)
        let startOfHalfHour = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours(), today.getUTCMinutes() >= 30 ? 30 : 0, 0);
        startOfHalfHour = adjustForBST(startOfHalfHour);
        const endOfHalfHour = new Date(startOfHalfHour.getTime() + (30 * 60 * 1000));
        urlToday = `${baseUrl}electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${startOfHalfHour.toISOString()}&period_to=${endOfHalfHour.toISOString()}`;

        let startOfHalfHourTomorrow = new Date(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), tomorrow.getUTCHours(), tomorrow.getUTCMinutes() >= 30 ? 30 : 0, 0);
        startOfHalfHourTomorrow = adjustForBST(startOfHalfHourTomorrow);
        const endOfHalfHourTomorrow = new Date(startOfHalfHourTomorrow.getTime() + (30 * 60 * 1000));
        urlTomorrow = `${baseUrl}electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${startOfHalfHourTomorrow.toISOString()}&period_to=${endOfHalfHourTomorrow.toISOString()}`;
    } else if (tariffType == 'gas') {
        // Handle gas tariffs (daily updates)
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        urlToday = `${baseUrl}gas-tariffs/${tariffCode}/standard-unit-rates/?period_from=${todayStr}T00:00:00Z&period_to=${todayStr}T23:59:59Z`;

        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        urlTomorrow = `${baseUrl}gas-tariffs/${tariffCode}/standard-unit-rates/?period_from=${tomorrowStr}T00:00:00Z&period_to=${tomorrowStr}T23:59:59Z`;
    } else {
        console.error(`Invalid tariff type: ${tariffType}`);
        return { today: "N/A", tomorrow: "N/A" };
    }

    let dataToday, dataTomorrow;
    try {
        let responseToday = await new Request(urlToday).loadJSON();
        if (responseToday.results && responseToday.results.length > 0) {
            dataToday = responseToday.results[0].value_inc_vat.toFixed(2);
        } else {
            throw new Error('Invalid or empty results array for today');
        }

        let responseTomorrow = await new Request(urlTomorrow).loadJSON();
        if (responseTomorrow.results && responseTomorrow.results.length > 0) {
            dataTomorrow = responseTomorrow.results[0].value_inc_vat.toFixed(2);
        } else {
            throw new Error('Invalid or empty results array for tomorrow');
        }
    } catch (error) {
        console.error(`Error fetching tariff data: ${error}`);
        dataToday = "N/A";
        dataTomorrow = "N/A";
    }

    return { today: dataToday, tomorrow: dataTomorrow }; // Return today and tomorrow's data
}

// Function to display the tariff data on the widget
async function displayTariffData(productCode, tariffCode, symbolName) {
    const data = await fetchTariffData(productCode, tariffCode); // Fetch the tariff data
    let row = widget.addStack(); // Create a new row in the widget
    row.centerAlignContent(); // Center-align the content in the row

    const symbol = SFSymbol.named(symbolName); // Get the SF Symbol for the tariff type
    symbol.applyMediumWeight(); // Apply medium weight to the symbol for better visibility
    const img = row.addImage(symbol.image); // Add the symbol image to the row
    img.tintColor = Color.white(); // Set the symbol's color to white
    img.imageSize = new Size(30, 30); // Set the size of the symbol image
    img.resizable = true; // Allow the symbol image to be resizable
    row.addSpacer(8); // Add space after the symbol

    // Display today's price in a large font
    let priceElement = row.addText(`${data.today}p`);
    priceElement.font = Font.boldSystemFont(23);
    priceElement.textColor = Color.white();

    widget.addSpacer(4); // Add space below today's price

    let subText, subElement;
    // Check if tomorrow's price is available and not "N/A"
    if (data.tomorrow && data.tomorrow !== "N/A") {
        let change = data.today && data.today !== "N/A" ? ((parseFloat(data.tomorrow) - parseFloat(data.today)) / parseFloat(data.today)) * 100 : 0;
        // Determine the arrow direction based on price change
        let arrow = change > 0 ? "↑" : (change < 0 ? "↓" : ""); // Add an arrow for increase or decrease
        subText = `Tomorrow: ${data.tomorrow}p ${arrow}`;
        subElement = widget.addText(subText);
        // Color the text based on price change direction
        subElement.textColor = change > 0 ? new Color("#FF3B30") : (change < 0 ? new Color("#30D158") : Color.white());
        subElement.font = Font.systemFont(12);
    } else {
        subText = `Tomorrow: N/A`;
        subElement = widget.addText(subText);
        subElement.textColor = Color.white();
        subElement.font = Font.systemFont(8);
    }

    widget.addSpacer(20); // Add final spacer for layout
}

const regionCode = "C"; // Region code for London. Please change this to your region code if different
const gasProductCode = "SILVER-BB-23-12-06"; // Product code for Octopus Tracker Decemeber 2023 v1
const electricityProductCode = "AGILE-23-12-06"; // Product code for Agile Octopus December 2023 v1
const gasTariffCode = "G-1R-SILVER-23-12-06-${regionCode}"; // Tariff code for Octopus Tracker
const electricityTariffCode = "E-1R-AGILE-23-12-06-${regionCode}"; // Tariff code for Agile Octopus

// Display tariff information for gas and electricity
await displayTariffData(gasProductCode, gasTariffCode, "flame.fill");
await displayTariffData(electricityProductCode, electricityTariffCode, "bolt.fill");

// Optional: Set the url of the widget to open the Octopus Tracker website
widget.url = "https://octopustracker.small3y.co.uk";

// Preview the widget in the app if not running in a widget context
if (!config.runsInWidget) {
    await widget.presentMedium();
}

// Set the widget in the scriptable app
Script.setWidget(widget); 
Script.complete();
