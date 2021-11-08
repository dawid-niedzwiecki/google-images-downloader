const cheerio = require('cheerio')
const fs = require('fs')
const puppeteer = require('puppeteer')
const fetch = require('node-fetch')

async function download (uri, filename, stratum) {
  try {
    const response = await fetch(uri, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
      }
    })
    let format = 'png'
    const contentType = response.headers.get('content-type')
    if (contentType.includes('html') || contentType.includes('svg')) format = 'svg'
    else format = contentType.split('/')[1].split(';')[0]
    const buffer = await response.buffer()
    fs.writeFile(filename + '.' + format, buffer, () => { console.log('Downloaded ' + filename + '.' + format) })
  } catch (error) {
    fs.appendFileSync('pliki/errors.txt', stratum + ' : ' + uri + '\n')
    console.error('Error with url: ' + uri)
    console.error(error)
  }
}

let SALONOWE = []

const data = fs.readFileSync('pliki/test.txt', 'utf-8')
SALONOWE = data.split(',');

(async () => {
  let browser = await puppeteer.launch({ headless: true })
  let page = await browser.newPage()
  for (let i = 0; i < SALONOWE.length; i++) {
    const STRATUM = SALONOWE[i]
    try {
      await page.goto('https://www.google.com/search?q=' + STRATUM + '&sxsrf=ALeKk00qZYjsUBxP3In0c4EooWEFdNknsQ:1628038348292&source=lnms&tbm=isch&sa=X&ved=2ahUKEwi1uLi7k5byAhUKC-wKHYmMDa8Q_AUoAXoECAEQAw&cshid=1628038604183909&biw=1680&bih=907&dpr=1')
      await page.click('#islrg div[jsaction][data-tbnid]', { button: 'right' })
      const html = await page.content()
      const $ = cheerio.load(html)
      const bigLink = $('#islrg div[jsaction][data-tbnid]').find("a[href^='/imgres']").attr('href')
      const link = decodeURIComponent(bigLink.split('?imgurl=')[1].split('&imgrefurl')[0])
      download(link, 'images/' + STRATUM, STRATUM, () => {})
    } catch (error) {
      console.error('Error with search: ' + STRATUM)
      await browser.close()
      browser = await puppeteer.launch({ headless: true })
      page = await browser.newPage()
      i--
    }
  }
  await browser.close()
})()
