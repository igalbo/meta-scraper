const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.get("/api/*", async (req, res) => {
  console.log(req.params[0]);
  try {
    const metadata = await scrapeUrl(req.params[0]);

    res.send(metadata);
  } catch (err) {
    console.error(err.message);
    res.send({ "Error": err.message }); // might append .status(400) to signal error code as a response
  }
});

app.listen(PORT, () => console.log("Server started on port ", PORT));

async function scrapeUrl(url) {
  let fullUrl = url;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--lang=en-US", "en"],
  });
  const page = await browser.newPage();

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    fullUrl = "http://".concat(url);
  }

  await page.goto(fullUrl);

  const metaElements = await page.evaluate(() => {
    const items = {};

    document.querySelectorAll("meta").forEach((element) => {
      if (element.getAttributeNames().length < 2) return;

      const [rawKey, rawValue] = element.getAttributeNames();
      let key = element.getAttribute(rawKey);
      let value = element.getAttribute(rawValue);

      if (key.startsWith("og:")) {
        key = key.slice(3);
      }

      key = key.charAt(0).toUpperCase() + key.slice(1);

      items[key] = value;
    });

    return items;
  });

  browser.close();

  console.log(metaElements);
  return metaElements;
}

// ============= Reversing Hebrew letters ==============
  // Object.keys(metaElements).forEach((key) => {
  //   if (/[\u0590-\u05FF]/.test(metaElements[key])) {
  //     let arr = metaElements[key].split(" ");

  //     for (let i = 0; i < arr.length; i++) {
  //       if (/[\u0590-\u05FF]/.test(arr[i])) {
  //         arr[i] = arr[i].split("").reverse().join("");
  //       }
  //     }

  //     metaElements[key] = arr.reverse().join(" ");
  //   }
  // });