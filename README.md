# Reddit Wallapaper Downloader

# Description

Script for downloading wallpapers from any given subreddit

# Installation

Clone the repo in your folder

```sh
cd *your-folder*
git clone https://github.com/mediocreeee/nodeVids.git
```

Install all required packages via npm

```javascript
npm install
```

Then put folder where you cloned the repo in your \$PATH

# Usage

```sh
Usage: redditwall [options]

Options:
  -s, --subreddit <subreddit>  Specify subbreddit [REQUIRED]
  -d, --desktop                Download only desktop wallpapers
  -t, --time <time>            Specify posts time (hour, day, week, month, year, all) (default: "day")
  -p, --type <type>            Specify posts type (hot, new, random, rising, top) (default: "new")
  -l, --limit <limit>          Specify how many posts to get (max 100) (default: 25)
  -mw, --minwidth <width>      Specify minimal width of the image (default: 1920)
  -mh, --minheight <height>    Specify minimal height of the image (default: 1080)
  -h, --help                   display help for command

```
