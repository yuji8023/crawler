var Crawler = require("crawler");
const fs = require('fs')
const request = require('request');
const path = require("path"); 

function replaceText(text) {
  return text.replace(/\n/g, "").replace(/\s/g, "");
}

//图片下载方法
function download(){
    console.log("准备下载图片")
    fs.readFile(__dirname + '/data/img.json',(err, data) => {
        if (err) throw err;
        const imgList = JSON.parse(data).data;
        imgList.forEach(function(item, i) {
            if(item.src){
                console.log(`开始下载第${i+1}张图片`)
                const itemArr = item.src.split('/');
                const imgName = itemArr[itemArr.length - 1]
                request(item.src, function(){
                    console.log(`第${i+1}张图片下载完成`)
                })
                    .on('error', function(err) {
                        console.log(err);
                    })
                    .pipe(fs.createWriteStream(__dirname + "/data/images/" + imgName));
            }
                
        })
    })
};
 

var c = new Crawler({
    maxConnections : 10,
    //rateLimit:1000,
    // 这个回调每个爬取到的页面都会触发
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;
            // $默认使用Cheerio
            // 这是为服务端设计的轻量级jQuery核心实现
            console.log($("title").text());
        }
        done();
    }
});

// 爬取一个URL，使用默认的callback
//c.queue('https://www.jianshu.com/');

// 爬取URL列表
//c.queue(['http://www.google.com/','http://www.yahoo.com']);

// 爬取页面，自定义callback和参数
function getJianshu(){
    console.log('开始爬取简书首页文章列表')
    c.queue([{
        uri: 'https://www.jianshu.com/',
        jQuery: true,
        timeout : 8000, // 单位是毫秒 (默认 15000).
        // 覆盖全局的callback
        callback: function (error, res, done) {
            console.log('开始写入简书数据')
            if(error){
                console.log(error);
            }else{
                var $ = res.$;
                let data = [];
                $('#list-container .note-list li').each(function (i, elem) {
                    let _this = $(elem);
                    data.push({
                        id: _this.attr('data-note-id'),
                        slug: _this.find('.title').attr('href').replace(/\/p\//, ""),
                        author: {
                            slug: _this.find('.avatar').attr('href').replace(/\/u\//, ""),
                            avatar: _this.find('.avatar img').attr('src'),
                            nickname: replaceText(_this.find('.blue-link').text()),
                            sharedTime: _this.find('.time').attr('data-shared-at')
                        },
                        title: replaceText(_this.find('.title').text()),
                        abstract: replaceText(_this.find('.abstract').text()),
                        thumbnails: _this.find('.wrap-img img').attr('src'),
                        collection_tag: replaceText(_this.find('.collection-tag').text()),
                        reads_count: replaceText(_this.find('.ic-list-read').parent().text()) * 1,
                        comments_count: replaceText(_this.find('.ic-list-comments').parent().text()) * 1,
                        likes_count: replaceText(_this.find('.ic-list-like').parent().text()) * 1
                    });
                });
                fs.writeFile(__dirname + '/data/article.json', JSON.stringify({
                    status: 0,
                    title:`总共${data.length}篇文章`,
                    data: data
                }), function (err) {
                    if (err) throw err;
                    console.log('写入简书数据完成');
                });
            }
            done();
        }
    }]);
}

// 爬取页面，自定义callback和参数
function getImage(){
    console.log("开始爬取http://m.hanhande.com/tu/scy/index.shtml图片")
    c.queue([{
        uri: 'http://m.hanhande.com/tu/scy/index.shtml',
        jQuery: true,
        timeout : 8000, // 单位是毫秒 (默认 15000).
        // 覆盖全局的callback
        callback: function (error, res, done) {
            if(error){
                console.log(error);
            }else{
                var $ = res.$;
                let data = [];
                $('article .articles:first-child .ullist li').each(function (i, elem) {
                    let _this = $(elem);
                    const imgSrc = _this.find('img').attr('src')
                    data.push({
                        index:i,
                        href: _this.find('a').attr('href'),
                        src: imgSrc,
                    });
                });
                fs.writeFile(__dirname + '/data/img.json', JSON.stringify({
                    status: 0,
                    title:`总共${data.length}张图片`,
                    data: data
                }), function (err) {
                    if (err) throw err;
                    console.log(`总共爬取到${data.length}张图片`);
                    download()
                });

            }
            done();
        }
    }]);
}

let urlsArray = [];
function getCnBlog(){
    console.log("开始爬取Blog")
    let pageUrls = [],  //存放收集文章页面网站
        pageNum = 200;  //要爬取文章的页数
    for(var i=1 ; i<= 200 ; i++){
        pageUrls.push('http://www.cnblogs.com/#p'+i);
    }
    pageUrls.forEach((item,i) => {
        c.queue([{
            uri: item,
            jQuery: true,
            timeout : 8000, // 单位是毫秒 (默认 15000).
            // 覆盖全局的callback
            callback: function (error, res, done) {
                if(error){
                    console.log(error);
                }else{
                    var $ = res.$;
                    var curPageUrls = $('.post_item_body');
                    let data = [];
                    for(var i = 0 ; i < curPageUrls.length ; i++){
                        urlsArray.push({
                            url:replaceText(curPageUrls.eq(i).find(".titlelnk").attr('href')),
                            title: replaceText(curPageUrls.eq(i).find(".titlelnk").text()),
                            author:replaceText(curPageUrls.eq(i).find('.post_item_foot .lightblue').text()),
                            time:replaceText(curPageUrls.eq(i).find('.post_item_foot')[0].childNodes[2].data),
                            intro:replaceText(curPageUrls.eq(i).find('.post_item_summary').text())
                        });
                    } 
                    writeBlog()  
                }
                done();
            }
        }]);
    })

}

/*爬取笔趣阁小说排行榜*/
function getBookList(){
    console.log("开始爬取小说")
    c.queue([{
        uri: 'https://www.biquge5200.com/',
        jQuery: true,
        timeout : 8000, // 单位是毫秒 (默认 15000).
        // 覆盖全局的callback
        callback: function (error, res, done) {
            if(error){
                console.log(error);
            }else{
                var $ = res.$;
                let data = [];
                $('#main .content').each(function (i, elem) {
                    let _this = $(elem);
                    $(elem).find('a').each(function (j, enem) {
                        let _that = $(enem)
                        data.push({
                            title:_that.text(),
                            src:_that.attr('href')
                        })
                    })
                });
                
                fs.writeFile(__dirname + '/data/book.json', JSON.stringify({
                    title:`总共${data.length}本图书`,
                    data: data
                }), function (err) {
                    if (err) throw err;
                    console.log(`图书爬取完成`);
                    downBookList()
                });

            }
            done();
        }
    }]);
}
function downBookList(){
    console.log("准备下载图书")
    fs.readFile(__dirname + '/data/book.json',(err, data) => {
        if (err) throw err;
        const bookList = JSON.parse(data).data;
        bookList.forEach(function(item, i) {
            if(item.src){
                console.log(`开始下载第${i+1}本图书`)
                getBookInfo(item.src)
            }
                
        })
    })
}
function getBookInfo(url){
    c.queue([{
        uri: url,
        jQuery: true,
        timeout : 8000, // 单位是毫秒 (默认 15000).
        // 覆盖全局的callback
        callback: function (error, res, done) {
            if(error){
                console.log(error);
            }else{
                var $ = res.$;
                const booksName = $('#info').find('h1').text(); //小说名称
                console.log(`开始爬取${booksName}章节`)
                if(!fs.existsSync(`/data/book/${booksName}`)){
                    fs.mkdir(__dirname + `/data/book/${booksName}`,(err) => {
                        console.log(`创建${booksName}文件夹失败`)
                    });
                }
                let data = [];
                $('#list').find('dd').each(function (i, e) { //获取章节UrlList
                    data.push({
                        title:$(e).find('a').text(),
                        src:$(e).find('a').attr('href'),
                    })
                });
                fs.writeFile(__dirname + `/data/book/${booksName}/info.json`, JSON.stringify({
                    title:`总共${data.length}章节`,
                    name: booksName,
                    data: data
                }), function (err) {
                    if (err) throw err;
                    console.log(`章节爬取完成`);
                    getBookJson(booksName,__dirname + `/data/book/${booksName}/info.json`)
                });
            }
            done();
        }
    }]);
}
function getBookJson(name,url){
    fs.readFile(url,(err, data) => {
        if (err) {
            console.log('读取本地info.json失败');
            return false;
        }
        const bookList = JSON.parse(data).data;
        console.log(`开始下载${name}`)
        bookList.forEach(function(item, i) {
            if(item.src){
                getBookArticle(name,`https://www.qu.la${item.src}`)
            }
                
        })
    })
}
function getBookArticle(name,url){
    c.queue([{
        uri: url,
        jQuery: true,
        rateLimit: parseInt(Math.random()*2+2)*1000,
        maxConnections: 1,
        timeout : 8000, // 单位是毫秒 (默认 15000).
        // 覆盖全局的callback
        callback: function (error, res, done) {
            if(error){
                console.log("爬取" + url + "链接出错！")
            }else{
                var $ = res.$;
                // 小说内容
                var content = ($("#content").text()).replace(/\s{2,}/g, '\n\n')
                const listTitle = $(".bookname").find('h1').text();
                console.log(`开始下载${listTitle}`)
                if (fs.existsSync(`${__dirname}/data/book/${name}/${name}.md`)) {
                    fs.appendFileSync(`${__dirname}/data/book/${name}/${name}.md`, '### ' + listTitle)
                    fs.appendFileSync(`${__dirname}/data/book/${name}/${name}.md`, content)
                } else {
                    fs.writeFileSync(`${__dirname}/data/book/${name}/${name}.md`, '### ' + listTitle)
                    fs.appendFileSync(`${__dirname}/data/book/${name}/${name}.md`, content)
                }
            }
            done();
        }
    }]);
}
function writeBlog(){
    fs.writeFile(__dirname + '/data/blog.json', JSON.stringify({
        status: 0,
        title:`总共${urlsArray.length}篇blog`,
        data: urlsArray
    }), function (err) {
        if (err) throw err;
        console.log('写入blog数据完成');
    });
}
c.on('drain', function() {
    console.log("爬虫工作全部完成")
            
});

function main(){
    console.log('爬虫开始工作')
    //getJianshu() // 读取简书首页文章
    //getImage()    //爬取憨憨三次元美女首页图片
    //getCnBlog()   //爬取博客园4000篇博客目录
    //getBookList() //获取笔趣阁首页所有的小说
    //getBookJson('我是至尊',__dirname + `/data/book/我是至尊/info.json`) //读取我是至尊的本地info.json下载章节
    //getBookInfo('https://www.qu.la/book/3952/')   //爬取我是至尊章节目录
}

main()
