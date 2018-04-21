# What is this
This project is dedicated to scraping the North Korean http://kcna.co.jp website for analysis for a friends masters thesis.
The KCNA website requires a Japanese IP in order to view its content.


#Installing

Linux and Mac

`npm install`

Windows

`npm install --no-bin-links`

# Running
Go to the directory you extracted the project to:

`cd ~/kcna_scraper`

From that directory, run the index file of src

`node /src/index.js [dates|content|body|all|help]`


#### Dates
Dates will go through the calendar listing and pull all available dates were content is reported to have been published

#### Content
Content will go through all dates discovered and  find available articles

#### Body
Body will go through all available articles and parse the contents

#### All
All will run everything in order

# Examining data
Data is stored in the `./cache` directory.