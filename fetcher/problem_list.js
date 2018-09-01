let cheerio = require('cheerio');
let fs = require('fs');

let build$ = (html) => {
  return cheerio.load(html, {decodeEntities: false});
};

module.exports = async () => {
  let baseUrl = 'http://ybt.ssoier.cn:8088/';

  console.log('\n[!==== 开始采集链接 =====!]\n');
  // 列表页 每页链接
  let pageLinks = [];
  await request.get(baseUrl + 'problem_list.php').then(htmlString => {
    let $ = build$(htmlString);
    let pageLinkElems = $('caption.plist a.list_link');
    for (let i = 0; i < pageLinkElems.length; i++) {
      let linkElem = $(pageLinkElems[i]);
      pageLinks.push(baseUrl + linkElem.attr('href'));
    }
  });

  console.log(`[pageLinks] 已获取 ${pageLinks.length} 个`);

  // 题目内页链接
  let questions = [];
  for (let i = 0; i < pageLinks.length; i++) {
    await request.get(pageLinks[i]).then(htmlString => {
      let $ = build$(htmlString);
      let listItems = $('table.plist > tbody > tr:not(:first-child)');

      for (let o = 0; o < listItems.length; o++) {
        let itemElem = $(listItems[o]);
        let id = itemElem.find('td:nth-child(1) > a').text().trim();
        let name = itemElem.find('td:nth-child(2) > a').text().trim();
        let link = itemElem.find('td:nth-child(2) > a').attr('href').trim();

        questions.push({id, name, link});
      };
      console.log(`[第 ${i+1} 页] questionLinks += ${listItems.length}`);
    });
  }

  console.log('\n[!==== 开始采集题目 =====!]');

  // 采集内页内容
  for (let i = 0; i < questions.length; i++) {
    await request.get(baseUrl + questions[i].link).then(htmlString => {
      let $ = build$(htmlString);
      let descText = $('.pcontent > font > p:nth-child(2)').text().trim();
      let inDescText = $('.pcontent > font > p:nth-child(4)').text().trim();
      let outDescText = $('.pcontent > font > p:nth-child(7)').text().trim();
      let inDescEgText = $('.pcontent > font > font > div:nth-child(1) > pre').text().trim();
      let outDescEgText = $('.pcontent > font > font > font:nth-child(2) > font > div > pre').text().trim();
      let sourceText = $('.pcontent > font > font > font > font > font > font > a').text().trim();
      _.merge(questions[i], {descText, inDescText, outDescText, inDescEgText, outDescEgText, sourceText})
      console.log(`[题号=${i}] 内容已采集`);
    }).catch(function (err) {
      console.log(`[题号=${i}] 采集错误`, err);
    });
  }

  console.log('\n[!==== 保存文件 =====!]');
  fs.writeFileSync('storage/problem_list.json', JSON.stringify(questions));

  console.log('\n[!==== 已完成 =====!]');
};
