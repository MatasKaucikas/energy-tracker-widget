// Constants for configuration
const BASE_URL = "https://api.octopus.energy/v1/products/";
const WHITE_COLOR = new Color("#ffffff");
const ERROR_COLOR = new Color("#FF3B30");
const SUCCESS_COLOR = new Color("#30D158");

// Helper function to create and format text
function createText(widget, content, fontSize, color, fontWeight = 'bold') {
    let text = widget.addText(content);
    text.font = fontWeight === 'bold' ? Font.boldSystemFont(fontSize) : Font.systemFont(fontSize);
    text.textColor = color;
    return text;
}

// Function to adjust the current time to the closest previous half-hour mark
function getAdjustedTimes() {
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
    const currentMinute = localTime.getMinutes();
    const minutesToSubtract = currentMinute >= 30 ? currentMinute - 30 : currentMinute;

    let periodStart = new Date(localTime.getTime() - minutesToSubtract * 60000);
    let periodEnd = new Date(periodStart.getTime() + 30 * 60000);
    return { periodStart, periodEnd };
}

// Function to build URL for API request
function buildUrl(productCode, tariffCode, periodStart, periodEnd, tariffType) {
    let dateStr = periodStart.toISOString().replace(/\.\d+/, '');
    let periodStr = `${dateStr}&period_to=${periodEnd.toISOString().replace(/\.\d+/, '')}`;
    return `${BASE_URL}${productCode}/${tariffType}-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodStr}`;
}

// Function to fetch tariff data
async function fetchTariffData(productCode, tariffCode, tariffType) {
    const { periodStart, periodEnd } = getAdjustedTimes();
    let url = buildUrl(productCode, tariffCode, periodStart, periodEnd, tariffType);

    try {
        const response = await new Request(url).loadJSON();
        return response.results[0].value_inc_vat || "N/A";
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        return "N/A";
    }
}

// Main function to display tariff data
async function displayTariffData(productCode, tariffCode, symbolName, widget) {
    const tariffType = tariffCode.charAt(0) === 'G' ? 'gas' : 'electricity';
    const priceToday = await fetchTariffData(productCode, tariffCode, tariffType);

    let row = widget.addStack();
    row.centerAlignContent();

    const symbol = SFSymbol.named(symbolName);
    symbol.applyMediumWeight();
    const img = row.addImage(symbol.image);
    img.tintColor = WHITE_COLOR;
    img.imageSize = new Size(30, 30);
    img.resizable = true;
    row.addSpacer(8);

    createText(row, `${priceToday}p`, 20, WHITE_COLOR);
    widget.addSpacer(20); // Add final spacer for layout
}

// Initialize widget and set properties
const widget = new ListWidget();
widget.backgroundColor = new Color("#100030");

// Add header and spacer
createText(widget, "Energy Tracker", 14, WHITE_COLOR);
widget.addSpacer(8);

// Display tariff information for gas and electricity
const regionCode = "C";
const gasProductCode = "SILVER-23-12-06";
const electricityProductCode = "AGILE-23-12-06";
const gasTariffCode = `G-1R-SILVER-23-12-06-${regionCode}`;
const electricityTariffCode = `E-1R-AGILE-23-12-06-${regionCode}`;

await displayTariffData(gasProductCode, gasTariffCode, "flame.fill", widget);
await displayTariffData(electricityProductCode, electricityTariffCode, "bolt.fill", widget);

// Optional: Set the url of the widget to open the Octopus Tracker website
widget.url = "https://octopustracker.small3y.co.uk";

// Preview or set the widget
if (!config.runsInWidget) {
    await widget.presentMedium();
}
Script.setWidget(widget);
Script.complete();
