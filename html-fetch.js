/**
 * Created by KidSirZ4i on 2016/12/15.
 */

'use strict';

var http = require("http");
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var mysql = require('mysql');

(function(){

    //初始化保存在数据库的id字段
    var id = 0;

    for ( var i = 0; i<=100 ; i++ ) {

        //目标网站 100个 ，已经对网站名称进行脱敏处理
        var target = "http://m.xx99xx.cn/money/xiandaiDetail.aspx?id="+i;

        //抓取靶网页的html文本内容
        http.get(target, function (res) {

            //设置编码
            res.setEncoding('utf-8');

            //定义一个 htmlData用来保存数据
            var htmlData = "";

            //获取到的html数据后拼接
            res.on('data', function (dataChunk) {
                htmlData += dataChunk;
            });

            //数据获取完毕后
            res.on('end', function () {

                //cheerio加载得到的html数据
                var $ = cheerio.load(htmlData);

                //目标数据所在html的位置，cheerio类似jQuery的用法
                var li = $(".mui-table-view-cellx");

                li.each(function(index, elem) {
                    //获取到数据，并进行各种拼装
                    id = ++id;
                    var name = $(this).find(".cpc-h2a").text();
                    var limit_amount =  $(this).find(".ss-list-tins .ss-list-bor:nth-child(5)").text();
                    var term =  $(this).find(".ss-list-tins .ss-list-bor:nth-child(7)").text();
                    //利率的转换 —— 扒到的数据都是 【0.7%日利率】或者【1.9%月利率】这样的格式，按照需求要分开两个字段，所以这里做了一个判断
                    var rate =  $(this).find(".ss-list-tins .ss-list-bor:nth-child(2)").text();
                    var monthly_interest_rate = "--/--";
                    var daily_interest_rate = "--/--";
                    var flag = rate.indexOf('月');
                    flag>0?monthly_interest_rate = rate.substring(0,rate.length-3):daily_interest_rate = rate.substring(0,rate.length-3);
                    //打印各数据出来瞧瞧
                    console.log(id+","+name+","+monthly_interest_rate+","+daily_interest_rate+","+term+','+limit_amount);

                    //开始数据库操作
                    (function(){
                        //初始化，并填上数据库信息
                        var connection = mysql.createConnection({
                            // 这里应该写上你自己的数据库信息
                            host     : '127.0.0.1',
                            user     : 'root',
                            password : 'password',
                            database : 'test',
                            charset : "utf8_general_ci"
                        });

                        //建立数据库链接
                        connection.connect();

                        //拼装sql语句
                        var sql = 'replace into node_fetch (id,name,monthly_interest_rate,daily_interest_rate,term,limit_amount) ' +
                            'values('+id+',"'+name+'","'+monthly_interest_rate+'","'+daily_interest_rate+'","'+term+'","'+limit_amount+'")';
                        //打印sql语句出来瞧瞧
                        console.log("打印查询语句："+sql);

                        //开始查询数据库操作
                        connection.query(sql, function(err, rows, fields) {
                            if (err) {
                                console.log("操作失败，原因："+err);
                            }
                            else {
                                console.log("操作成功!");
                            }
                        });
                        //断开数据库，结束
                        connection.end();
                    })();
                });
            });
        }).on('error', function (e) {
            console.log(e.message);
        });
    }
})();

