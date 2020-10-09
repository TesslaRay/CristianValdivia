const puppeteer = require("puppeteer");
const fs = require('fs');
const Mustache = require('mustache');

const MUSTACHE_MAIN_DIR = './main.mustache';

let DATA = {
  refresh_date: new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'America/Santiago',
  }),
};

async function scracpCEN() {
  try {
    let browser = await puppeteer.launch({ headless: true });

    let page = await browser.newPage();

    await page.goto(`https://www.coordinador.cl/operacion/graficos/operacion-real/generacion-real-del-sistema/`);
    await page.click('div[id="Heading3"]');

    await page.waitForSelector("g.amcharts-pie-item");

    let dataEnergy = await page.evaluate(() => {
      let genTypeList = document.querySelectorAll(`g.amcharts-pie-item`);

      let dataEnergySelector = [];

      for (let i = 0; i < genTypeList.length; i++) {
        dataEnergySelector[i] = {
          Type: genTypeList[i].getAttribute("aria-label"),
        }
      }

      return dataEnergySelector;
    })

    let dataEnergyArray = [];
    for (let i = 0; i < dataEnergy.length; i++) {
      let data = dataEnergy[i].Type.split(' ');
      dataEnergyArray[i] = {
        type: data[0],
        percent: data[1],
        gen: data[2],
      }
    }

    DATA.term = dataEnergyArray[0].percent;
    DATA.eolic = dataEnergyArray[1].percent;
    DATA.hidro = dataEnergyArray[3].percent;
    DATA.solar = dataEnergyArray[4].percent;

    await browser.close();
    console.log("Browser Closed");
  } catch (err) {
    await browser.close();
    console.log("Browser Closed");
  }
};

console.log(DATA);

async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
   /**
   * Scrap CEN web page
   */

  await scracpCEN();

  /**
   * Generate README
   */
  await generateReadMe();

}

action();