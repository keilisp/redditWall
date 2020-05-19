// TODO: implement commander.js (with sys.args command)
// TODO: comments
// TODO: refactor
// TODO: add 18+ constrol

const fs = require("fs")
const url = require("url")
const path = require("path")
const axios = require("axios")
const os = require("os")

// Home directory
const homedir = os.homedir()
// Folder where images will be stored
const destDirectory = `${homedir}/Pictures/Reddit`
// Which subreddit to download from
const subreddit = "wallpapers"
// For reddit pagination (Leave empty)
const after = ''
// Minimum width of image
const minWidth = 1920
// Minimum height of image
const minHeight = 1080
// How many posts to get for each request (Max 100)
const reqLimit = 100
// Loop count to iterate for request
const reqLoops = 1
// Posts time (hour, day, week, month, year, all)
const postTime = 'all'
// Posts type (hot, new, random, rising, top)
const postType = 'top'
// Wallpaper type (Mobile, Desktop (for r/Animewallpaper))
const imgType = ""
// Subreddit url
const redditUrl = `https://reddit.com/r/${subreddit}/${postType}/.json?t=${postTime}&limit=${reqLimit}&after=${after}`


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
	console.log('ERROR!')
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
const verifySubreddit = async subreddit => {
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
	console.log('verifySubreddit ERROR!')
  }
}

// Check if wallpapers type is set and get it if yes
const getImgType = ( post, imgType ) => {
  if (imgType.length !== 0) {
	return imgType
  }else {
	return false
  }
}

// Check if the image match current imgType
const isMatchImgType = (post) => {
  const postFlairText = post['data']['link_flair_text']
  if ( postFlairText == getImgType(post, imgType)){
	return true
  }else{
	console.log('Image don\'t match current imgType')
	return false
  }
}

// Check if the image is HD
const isHD = (post, minWidth, minHeight) => {
  const imgWidth = post['data']['preview']['images'][0]['source']['width']
  const imgHeight = post['data']['preview']['images'][0]['source']['height']
  if( imgWidth < minWidth || imgHeight < minHeight){
	console.log('Image isn\'t HD')
	return false
  }else{
	return true
  }
}


// Get posts
const getPosts = async (url, loops, after) => {
  const allPosts = []
  for(let i = 0; i < loops; i++) {
	try {
	  const posts = await axios.get(url, {
		headers: {
		  'User-agent':'getWallpapers'
		}
	  })
	  for (let post of posts['data']['data']['children']){
		if( getImgType(post, imgType) ) {
		  if(isMatchImgType(post)){
			allPosts.push(post)
		  }
		}else{
		  allPosts.push(post)
		}
	  }
	  after = posts['data']['data']['after']

	}catch (err){
	  console.log(err)
	}
  }
  return allPosts
}

// Check if url is image
const isUrlImg = imgUrl => {
  // if (imgUrl.endsWith('.png', '.jpeg', '.jpg')){
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
	})
	writeStream.on('error', reject)
  })
}

// Check if image is already downloaded
const isAlreadyDownloaded = (directory, imgUrl) => {
  let imgName = path.basename(url.parse(imgUrl).pathname)
  let localImgPath = path.join(directory, imgName)
  if(!fs.existsSync(localImgPath)) {
	return false
  }else{
	console.log('Image is already stored')
	return true
  }
}


// Main function
const main = async () => {
  await prepareDirectory(destDirectory)
  const posts  = await getPosts(redditUrl, reqLoops, after)
  for (let post of posts) {
	let imgUrl = post['data']['url']
	if (
	  isUrlValid(imgUrl) &&
	  isUrlTrusted(imgUrl) &&
	  isUrlImg(imgUrl) &&
	  !isAlreadyDownloaded(destDirectory, imgUrl) &&
	  isHD(post, minWidth, minHeight)
	){
	  await downloadImg(destDirectory, imgUrl)
	}
  }
}

main()
