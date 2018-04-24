# 介绍

本人编写的一个小小的node定向爬虫，基于crawler框架。用于展示交流，如果喜欢请给一个Star。

## 支持

+ 爬取数据并记录为`json`文件
+ 下载图片到本地
+ 保存图书为`.md`文件

## 实现

app.js文件内main函数

~~~
    //getJianshu() // 读取简书首页文章
    //getImage()    //爬取憨憨三次元美女首页图片
    //getCnBlog()   //爬取博客园4000篇博客目录
    //getBookList() //获取笔趣阁首页所有的小说
    //getBookJson('我是至尊',__dirname + `/data/book/我是至尊/info.json`) //读取我是至尊的本地info.json下载章节
    //getBookInfo('https://www.qu.la/book/3952/')   //爬取我是至尊章节目录
~~~

## 开始

1. 安装依赖 `npm i`
2. 运行服务`node app`z

**注意：**启动第二步前，请根据需要对`app.js` 里面的`main`方法进行修改

## 声明

该项目只是用于学习交流所用。请大家温柔对待世界...




