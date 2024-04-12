// Scriptable Widget for Displaying Energy and Gas Tariff Information
// Adapted from https://github.com/smalley1992/smalley1992.github.io/blob/main/OctopusTrackerSmallWidget.scriptable

const widget = new ListWidget(); // Initialise a new list widget
widget.backgroundColor = new Color("#100030"); // Set the background color of the widget

widget.addSpacer(20); // Add space at the top
const header = widget.addText("Energy Tracker"); // Add header text
header.font = Font.boldSystemFont(14); // Set the font and size of the header
header.textColor = Color.white(); // Set the color of the header text
widget.addSpacer(8); // Add space below the header

function adjustForBST(date) {
    if (isBST(date)) {
        // Add one hour if the date is within BST period
        return new Date(date.getTime() + 3600000);
    }
    return date;
}

// Function to adjust the given date for British Summer Time (BST)
function isBST(date) {
    var lastMarchSunday = new Date(Date.UTC(date.getUTCFullYear(), 2, 31));
    lastMarchSunday.setUTCDate(lastMarchSunday.getUTCDate() - lastMarchSunday.getUTCDay());
    var lastOctoberSunday = new Date(Date.UTC(date.getUTCFullYear(), 9, 31));
    lastOctoberSunday.setUTCDate(lastOctoberSunday.getUTCDate() - lastOctoberSunday.getUTCDay());
    return date >= lastMarchSunday && date < lastOctoberSunday;
}

async function fetchTariffData(productCode, tariffCode) {
    const now = new Date();
    const londonTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
    const currentMinute = londonTime.getMinutes();

    // Adjusting the time to the closest previous half-hour mark for electricity
    let minutesToSubtract = currentMinute >= 30 ? currentMinute - 30 : currentMinute;
    let periodStartToday = new Date(londonTime.getTime() - minutesToSubtract * 60000);
    let periodEndToday = new Date(periodStartToday.getTime() + 30 * 60000); // Adding 30 minutes

    // Calculate the start period for tomorrow at the same time for electricity
    let periodStartTomorrow = new Date(periodStartToday.getTime() + 86400000); // Add one day
    let periodEndTomorrow = new Date(periodStartTomorrow.getTime() + 30 * 60000); // 30 minutes after start

    // Adjust for BST if applicable
    periodStartToday = adjustForBST(periodStartToday);
    periodEndToday = adjustForBST(periodEndToday);
    periodStartTomorrow = adjustForBST(periodStartTomorrow);
    periodEndTomorrow = adjustForBST(periodEndTomorrow);

    const baseUrl = `https://api.octopus.energy/v1/products/${productCode}/`;
    const tariffType = tariffCode.substring(0, 1).toUpperCase() === 'G' ? 'gas' : 'electricity';

    let urlToday, urlTomorrow;
    if (tariffType === 'electricity') {
        urlToday = `${baseUrl}electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodStartToday.toISOString()}&period_to=${periodEndToday.toISOString()}`;
        urlTomorrow = `${baseUrl}electricity-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodStartTomorrow.toISOString()}&period_to=${periodEndTomorrow.toISOString()}`;
    } else if (tariffType === 'gas') {
        // For gas tariffs, we only need to fetch once a day
        let todayDateStr = periodStartToday.toISOString().split('T')[0]; // Only the date part
        urlToday = `${baseUrl}gas-tariffs/${tariffCode}/standard-unit-rates/?period_from=${todayDateStr}T00:00:00Z&period_to=${todayDateStr}T23:59:59Z`;
        urlTomorrow = `${baseUrl}gas-tariffs/${tariffCode}/standard-unit-rates/?period_from=${todayDateStr}T00:00:00Z&period_to=${todayDateStr}T23:59:59Z`;  // Same as today for gas
    } else {
        console.error(`Invalid tariff type: ${tariffType}`);
        return { today: "N/A", tomorrow: "N/A" };
    }

    let dataToday, dataTomorrow;
    try {
        const responseToday = await new Request(urlToday).loadJSON();
        dataToday = responseToday.results[0].value_inc_vat.toFixed(2);
        console.log("Data fetched successfully for today:", responseToday);

        if (tariffType === 'electricity') {
            const responseTomorrow = await new Request(urlTomorrow).loadJSON();
            dataTomorrow = responseTomorrow.results[0].value_inc_vat.toFixed(2);
            console.log("Data fetched successfully for tomorrow's same half-hour:", responseTomorrow);
        }
    } catch (error) {
        console.error(`Error fetching tariff data: ${error}`);
    }

    return { today: dataToday, tomorrow: dataTomorrow };
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
const gasProductCode = "SILVER-23-12-06"; // Product code for Octopus Tracker Decemeber 2023 v1
const electricityProductCode = "AGILE-23-12-06"; // Product code for Agile Octopus December 2023 v1
const gasTariffCode = `G-1R-SILVER-23-12-06-${regionCode}`; // Tariff code for Octopus Tracker
const electricityTariffCode = `E-1R-AGILE-23-12-06-${regionCode}`; // Tariff code for Agile Octopus

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
