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

// Function to adjust the current time to the closest previous half-hour mark (Updated Function)
function getAdjustedTimes() {
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
    localTime.setSeconds(0, 0); // Reset seconds and milliseconds
    const minutes = localTime.getMinutes();
    localTime.setMinutes(minutes >= 30 ? 30 : 0);
    let periodStart = new Date(localTime);
    let periodEnd = new Date(localTime.getTime() + 30 * 60000); // 30 minutes later
    return { periodStart, periodEnd };
}

// Function to build URL for API request
function buildUrl(productCode, tariffCode, periodStart, periodEnd, tariffType) {
    let dateStr = periodStart.toISOString().replace(/\.\d+/, '');
    let periodStr = `${dateStr}&period_to=${periodEnd.toISOString().replace(/\.\d+/, '')}`;
    return `${BASE_URL}${productCode}/${tariffType}-tariffs/${tariffCode}/standard-unit-rates/?period_from=${periodStr}`;
}

// Function to fetch tariff data
// Fetches tariff data for both today and tomorrow
async function fetchTariffData(productCode, tariffCode, tariffType) {
    const { periodStart, periodEnd } = getAdjustedTimes();
    const periodStartTomorrow = new Date(periodStart.getTime() + 86400000);
    const periodEndTomorrow = new Date(periodEnd.getTime() + 86400000);

    let urlToday = buildUrl(productCode, tariffCode, periodStart, periodEnd, tariffType);
    let urlTomorrow = buildUrl(productCode, tariffCode, periodStartTomorrow, periodEndTomorrow, tariffType);

    try {
        const responseToday = await new Request(urlToday).loadJSON();
        const responseTomorrow = await new Request(urlTomorrow).loadJSON();
        const todayPrice = responseToday.results[0]?.value_inc_vat || "N/A";
        const tomorrowPrice = responseTomorrow.results[0]?.value_inc_vat || "N/A";
        return { today: todayPrice, tomorrow: tomorrowPrice };
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        return { today: "N/A", tomorrow: "N/A" };
    }
}

// Function to display tariff data including tomorrow's forecast
async function displayTariffData(productCode, tariffCode, symbolName, widget) {
    const tariffType = tariffCode.charAt(0) === 'G' ? 'gas' : 'electricity';
    const data = await fetchTariffData(productCode, tariffCode, tariffType);

    let row = widget.addStack();
    row.centerAlignContent();

    const symbol = SFSymbol.named(symbolName);
    symbol.applyMediumWeight();
    const img = row.addImage(symbol.image);
    img.tintColor = WHITE_COLOR;
    img.imageSize = new Size(30, 30);
    img.resizable = true;
    row.addSpacer(8);

    createText(row, `${data.today}p`, 23, WHITE_COLOR);

    // Display tomorrow's price and change
    if (data.tomorrow !== "N/A") {
        let change = data.today !== "N/A" ? ((parseFloat(data.tomorrow) - parseFloat(data.today)) / parseFloat(data.today)) * 100 : 0;
        let arrow = change > 0 ? "↑" : (change < 0 ? "↓" : ""); // Determine arrow based on change
        let textColor = change > 0 ? ERROR_COLOR : (change < 0 ? SUCCESS_COLOR : WHITE_COLOR);
        let subText = `Tomorrow: ${data.tomorrow}p ${arrow}`;
        createText(widget, subText, 12, textColor);
    } else {
        createText(widget, "Tomorrow: N/A", 8, WHITE_COLOR);
    }

    widget.addSpacer(20); // Add final spacer for layout
}

// Initialize widget and set properties
const widget = new ListWidget();
widget.backgroundColor = new Color("#100030");
createText(widget, "Energy Tracker", 14, WHITE_COLOR);
widget.addSpacer(8);
const regionCode = "C";
const gasProductCode = "SILVER-23-12-06";
const electricityProductCode = "AGILE-23-12-06";
const gasTariffCode = `G-1R-SILVER-23-12-06-${regionCode}`;
const electricityTariffCode = `E-1R-AGILE-23-12-06-${regionCode}`;
await displayTariffData(gasProductCode, gasTariffCode, "flame.fill", widget);
await displayTariffData(electricityProductCode, electricityTariffCode, "bolt.fill", widget);
widget.url = "https://octopustracker.small3y.co.uk";
if (!config.runsInWidget) {
    await widget.presentMedium();
}
Script.setWidget(widget);
Script.complete();
