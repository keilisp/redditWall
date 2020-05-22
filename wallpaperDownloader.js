#!/usr/bin/env node

// TODO: implement https://github.com/nodeca/probe-image-size
// TODO: separate dekstop & mobiles
// TODO: TESTS!
// TODO: refactor

const fs = require("fs")
const url = require("url")
const path = require("path")
const axios = require("axios")
const os = require("os")
const { program } = require('commander')

program
  .requiredOption('-s, --subreddit <subreddit>', 'Specify subbreddit [REQUIRED]')
  .option('-d, --desktop', 'Download only desktop wallpapers')
  .option('-n, --nsfw', 'Include 18+ images')
// .option('-f, --folder <folder>', 'Destination folder', '$HOME/Pictures/Reddit')
  .option('-t, --time <time>', 'Specify posts time (hour, day, week, month, year, all)', 'day')
  .option('-p, --type <type>', 'Specify posts type (hot, new, random, rising, top)', 'new')
  .option('-l, --limit <limit>', 'Specify how many posts to get (max 100)', 25)
  .option('-mw, --minwidth <width>', 'Specify minimal width of the image', 1920)
  .option('-mh, --minheight <height>', 'Specify minimal height of the image', 1080)

program.parse(process.argv)

// Home directory
const homedir = os.homedir()
// Folder where images will be stored
const destDirectory = `${homedir}/Pictures/Reddit`

// Request config
// How many posts to get for each request (Max 100)
const reqLimit = parseInt(program.limit, 10)
if (reqLimit > 100 || reqLimit < 1){
  console.log('Error: Incorrect limit value');
  console.log('Possible value: max - 100, min - 1')
  process.exit(0)
}
// Posts time (hour, day, week, month, year, all)
const postTime = program.time
if (
  postTime !== 'hour' &&
  postTime !== 'day'  &&
  postTime !== 'week' &&
  postTime !== 'month' &&
  postTime !== 'year' &&
  postTime !== 'all' ){
  console.log('Error: Incorrect time value');
  console.log('Possible value: hour, day, week, month, year, all')
  process.exit(0)
}
// Posts type (hot, new, random, rising, top)
const postType = program.type
if (
  postType !== 'hot' &&
  postType !== 'new'  &&
  postType !== 'random' &&
  postType !== 'rising' &&
  postType !== 'top'){
  console.log('Error: Incorrect type value');
  console.log('Possible value: hot, new, random, rising, top')
  process.exit(0)
}
// Which subreddit to download from
const subreddit = program.subreddit
// For reddit pagination (Leave empty)
const after = ''
// Subreddit url
const redditUrl = `https://reddit.com/r/${subreddit}/${postType}/.json?t=${postTime}&limit=${reqLimit}&after=${after}`

// Wallpaper config
// Minimum width of image
const minWidth = program.minwidth
// Minimum height of image
const minHeight = program.minheight

// Search config
// Search only for desktops
let searchForDesktop = program.desktop ? true : false
// Include 18+ images in search
let includeNSFW = program.nsfw ? true : false

// Downloaded images counter
let imgDownloadCount = 0

// Check if url is valid
const isUrlValid = async url => {
  try {
	const request = await axios.get(url, {
	  headers: {
		'User-agent': 'getWallpapers'
	  }
	})
	const statusCode = request.status
	if(statusCode == 404){
	  return false
	}else{
	  return true
	}
  }catch {
	console.log('Image url is not valid!')
	return false
  }
}

// Check if image for desktop
const isImgDesktop = post => {
  if (post['data']['preview']){
	const imgWidth = post['data']['preview']['images'][0]['source']['width']
	const imgHeight = post['data']['preview']['images'][0]['source']['height']
	if( imgWidth > imgHeight){
	  return true
	}else {
	  console.log('Img isn\'t for desktops... Skipping')
	  return false
	}
  }else{
	console.log('Cant find image resolution... Skipping')
	return false
  }
}

// Creates download directory if needed
const prepareDirectory = async directory => {
  const isDirExists = await fs.existsSync(directory)
  if (!isDirExists) {
	await fs.mkdirSync(directory)
  }
}

// Check if subbrediit exists
const isSubredditOk = async subreddit => {
  try {
	let subredditUrl = `https://reddit.com/r/${subreddit}.json`
	let res = await axios.get(subredditUrl, {
	  headers: {
		'User-agent': 'getWallpapers'
	  }
	})

	if(res['data']['data']['children'].length == 0){
	  console.log('This subreddit is empty or doesn\'t exist')
	  return false
	}else {
	  return true
	}
  }catch {
	console.log('Something is wrong with this subreddit!')
	process.exit(1)
  }
}

// Check if the image is HD
const isHD = (post, minWidth, minHeight) => {
  const imgWidth = post['data']['preview']['images'][0]['source']['width']
  const imgHeight = post['data']['preview']['images'][0]['source']['height']
  if( imgWidth < minWidth || imgHeight < minHeight){
	// console.log('Image doesn\'t match prefered width and height... Skipping')
	console.log('Image isn\'t HD... Skipping')
	return false
  }else{
	return true
  }
}


// Get posts
const getPosts = async (url, after) => {
  const allPosts = []
  try {
	const posts = await axios.get(url, {
	  headers: {
		'User-agent':'getWallpapers'
	  }
	})
	for (let post of posts['data']['data']['children']){
	  if( includeNSFW ){
		if( searchForDesktop ) {
		  if ( isImgDesktop(post) ){
			allPosts.push(post)
		  }
		}else{
		  allPosts.push(post)
		}
	  }else{
		if( !isImgNSWF(post) ){
		  allPosts.push(post)
		}
	  }
	}
  }catch (err){
	console.log(err)
  }
  return allPosts
}

// Check if url is image
const isUrlImg = imgUrl => {
  if ( imgUrl.endsWith('.png') || imgUrl.endsWith('.jpeg') || imgUrl.endsWith('.jpg')){
	return true
  }else{
	console.log('Url isn\'t image')
	return false
  }
}

// Check if url is trusted
const isUrlTrusted = imgUrl => {
  const lowerImgUrl = imgUrl.toLowerCase()
  if (lowerImgUrl.startsWith('https://i.redd.it/') || lowerImgUrl.startsWith('http://i.imgur.com/')) {
	return true
  }else {
	console.log('Image url isn\'t trusted... Skipping')
	return false
  }
}
// Download images
const downloadImg = async (directory, imgUrl) => {
  const imgName = path.basename(url.parse(imgUrl).pathname)
  const imgPath = path.resolve(directory, imgName)
  const writeStream = fs.createWriteStream(imgPath)
  const response = await axios({
	url: imgUrl,
	method: "GET",
	responseType: "stream"
  })

  response.data.pipe(writeStream)

  return new Promise((resolve, reject) => {
	writeStream.on('finish', () => {
	  resolve()
	  console.log(`Image ${imgName} successfuly downloaded`)
	  imgDownloadCount++
	})
	writeStream.on('error', reject)
  })
}

// Check if image is NSFW
const isImgNSWF = post => {
  if( post['data']['over_18']){
	return true
  }else{
	console.log('Img is NSFW')
	return false
  }
}

// Check if image is already downloaded
const isAlreadyDownloaded = (directory, imgUrl) => {
  let imgName = path.basename(url.parse(imgUrl).pathname)
  let localImgPath = path.join(directory, imgName)
  if(!fs.existsSync(localImgPath)) {
	return false
  }else{
	console.log('Image is already stored... Skipping')
	return true
  }
}

const main = async () => {
  // await prepareDirectory(destDirectory)
  if ( isSubredditOk(subreddit)){
	const posts  = await getPosts(redditUrl, after)
	for await (let post of posts) {
	  let imgUrl = post['data']['url']
	  if (
		await isUrlValid(imgUrl) &&
		// await isUrlTrusted(imgUrl) &&
		await isUrlImg(imgUrl) &&
		await !isAlreadyDownloaded(destDirectory, imgUrl) &&
		await isHD(post, minWidth, minHeight)
	  ){
		await downloadImg(destDirectory, imgUrl)
	  }
	}
	console.log(`Downloaded ${imgDownloadCount} images`)
  }
}

main()
