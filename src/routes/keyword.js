const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 匹配类型: 1-精确匹配, 2-短语匹配, 3-广泛匹配

// 获取关键词列表
router.get('/', (req, res) => {
  const { adgroupId } = req.query;
  const data = readData('keywords.json');
  let keywords = data.keywords;

  if (adgroupId) {
    keywords = keywords.filter(k => k.adgroupId === parseInt(adgroupId));
  }

  res.json({ code: 0, message: 'success', data: keywords });
});

// 获取单个关键词
router.get('/:keywordId', (req, res) => {
  const { keywordId } = req.params;
  const data = readData('keywords.json');
  const keyword = data.keywords.find(k => k.keywordId === parseInt(keywordId));

  if (!keyword) {
    return res.json({ code: 1, message: '关键词不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: keyword });
});

// 创建关键词
router.post('/', (req, res) => {
  const { adgroupId, keyword, matchType, price } = req.body;
  const data = readData('keywords.json');

  const maxId = data.keywords.reduce((max, k) => Math.max(max, k.keywordId), 0);
  const newKeyword = {
    keywordId: maxId + 1,
    adgroupId,
    keyword,
    matchType: matchType || 1,
    price: price || 1.00,
    status: 1,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  data.keywords.push(newKeyword);
  writeData('keywords.json', data);

  res.json({ code: 0, message: 'success', data: newKeyword });
});

// 批量创建关键词
router.post('/batch', (req, res) => {
  const { keywords: keywordList } = req.body;
  const data = readData('keywords.json');

  let maxId = data.keywords.reduce((max, k) => Math.max(max, k.keywordId), 0);
  const newKeywords = keywordList.map(k => ({
    keywordId: ++maxId,
    adgroupId: k.adgroupId,
    keyword: k.keyword,
    matchType: k.matchType || 1,
    price: k.price || 1.00,
    status: 1,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  }));

  data.keywords.push(...newKeywords);
  writeData('keywords.json', data);

  res.json({ code: 0, message: 'success', data: newKeywords });
});

// 更新关键词
router.put('/:keywordId', (req, res) => {
  const { keywordId } = req.params;
  const updates = req.body;
  const data = readData('keywords.json');
  const index = data.keywords.findIndex(k => k.keywordId === parseInt(keywordId));

  if (index === -1) {
    return res.json({ code: 1, message: '关键词不存在', data: null });
  }

  data.keywords[index] = { ...data.keywords[index], ...updates };
  writeData('keywords.json', data);

  res.json({ code: 0, message: 'success', data: data.keywords[index] });
});

// 删除关键词
router.delete('/:keywordId', (req, res) => {
  const { keywordId } = req.params;
  const data = readData('keywords.json');
  const index = data.keywords.findIndex(k => k.keywordId === parseInt(keywordId));

  if (index === -1) {
    return res.json({ code: 1, message: '关键词不存在', data: null });
  }

  data.keywords.splice(index, 1);
  writeData('keywords.json', data);

  res.json({ code: 0, message: 'success', data: null });
});

module.exports = router;
