const express = require('express')
const app = express()
const axios = require('axios')
const cheerio = require('cheerio')
const XLSX = require('xlsx')
const fs = require('fs')

const url = 'https://jprp.vn/index.php/JPRP/issue/archive'

async function scrapeData() {
    try {
        var listUrl = await getListUrl('.issue-summary .media-body', url)
        var listAllUrl = []
        // k the su dung forEach
        for (var suburl of listUrl) {
            var listSubUrl = await getListUrl('.col-md-10', suburl)
            if (listSubUrl) {
                listAllUrl = [...listAllUrl, ...listSubUrl]
            }
        }
        const posts = []
        for (var suburl of listAllUrl) {
            const { data } = await axios.get(suburl)
            const $ = cheerio.load(data)
            const post = {}
            post.title = $('header h2').text()
            var dateData = $('.list-group-item.date-published').text().split(':')[1]
            if (dateData) {
                post.date = dateData.trim()
            }
            post.doi = $('.doi a').attr('href')
            post.numberMagazine = $('.panel-body .title').text()
            posts.push(post)
        }

        const worksheet = XLSX.utils.json_to_sheet(posts);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dates");
        XLSX.writeFile(workbook, "post.xlsx")

    } catch (err) {
        console.log(err)
    }
}

async function getListUrl(list, url) {
    try {
        const { data } = await axios.get(url)
        const $ = cheerio.load(data)
        const listUrl = []
        const listItems = $(list)
        listItems.each((idx, el) => {
            var link = $(el).children('a').attr('href')
            if (link) listUrl.push(link)
        })
        return listUrl
    } catch (err) {
        console.log(err)
    }
}

scrapeData()
app.listen(8080)
