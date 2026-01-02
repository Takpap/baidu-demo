const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 获取推广链接列表
router.get('/', (req, res) => {
  const { campaignId, adgroupId } = req.query;
  const data = readData('promotionUrls.json');
  let urls = data.promotionUrls;

  if (campaignId) {
    urls = urls.filter(u => u.campaignId === parseInt(campaignId));
  }

  if (adgroupId) {
    urls = urls.filter(u => u.adgroupId === parseInt(adgroupId));
  }

  res.json({ code: 0, message: 'success', data: urls });
});

// 获取单个推广链接
router.get('/:urlId', (req, res) => {
  const { urlId } = req.params;
  const data = readData('promotionUrls.json');
  const url = data.promotionUrls.find(u => u.urlId === parseInt(urlId));

  if (!url) {
    return res.json({ code: 1, message: '推广链接不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: url });
});

// 创建推广链接
router.post('/', (req, res) => {
  const { campaignId, adgroupId, urlName, pcUrl, mobileUrl, displayUrl } = req.body;
  const data = readData('promotionUrls.json');

  const maxId = data.promotionUrls.reduce((max, u) => Math.max(max, u.urlId), 0);
  const newUrl = {
    urlId: maxId + 1,
    campaignId,
    adgroupId,
    urlName,
    pcUrl,
    mobileUrl,
    displayUrl,
    status: 1,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  data.promotionUrls.push(newUrl);
  writeData('promotionUrls.json', data);

  res.json({ code: 0, message: 'success', data: newUrl });
});

// 批量创建推广链接
router.post('/batch', (req, res) => {
  const { urls } = req.body;
  const data = readData('promotionUrls.json');

  let maxId = data.promotionUrls.reduce((max, u) => Math.max(max, u.urlId), 0);
  const newUrls = urls.map(u => ({
    urlId: ++maxId,
    campaignId: u.campaignId,
    adgroupId: u.adgroupId,
    urlName: u.urlName,
    pcUrl: u.pcUrl,
    mobileUrl: u.mobileUrl,
    displayUrl: u.displayUrl,
    status: 1,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  }));

  data.promotionUrls.push(...newUrls);
  writeData('promotionUrls.json', data);

  res.json({ code: 0, message: 'success', data: newUrls });
});

// 更新推广链接
router.put('/:urlId', (req, res) => {
  const { urlId } = req.params;
  const updates = req.body;
  const data = readData('promotionUrls.json');
  const index = data.promotionUrls.findIndex(u => u.urlId === parseInt(urlId));

  if (index === -1) {
    return res.json({ code: 1, message: '推广链接不存在', data: null });
  }

  data.promotionUrls[index] = { ...data.promotionUrls[index], ...updates };
  writeData('promotionUrls.json', data);

  res.json({ code: 0, message: 'success', data: data.promotionUrls[index] });
});

// 删除推广链接
router.delete('/:urlId', (req, res) => {
  const { urlId } = req.params;
  const data = readData('promotionUrls.json');
  const index = data.promotionUrls.findIndex(u => u.urlId === parseInt(urlId));

  if (index === -1) {
    return res.json({ code: 1, message: '推广链接不存在', data: null });
  }

  data.promotionUrls.splice(index, 1);
  writeData('promotionUrls.json', data);

  res.json({ code: 0, message: 'success', data: null });
});

// 验证链接有效性（模拟）
router.post('/validate', (req, res) => {
  const { url } = req.body;

  // 模拟链接验证
  const isValid = url && (url.startsWith('http://') || url.startsWith('https://'));

  res.json({
    code: 0,
    message: 'success',
    data: {
      url,
      isValid,
      statusCode: isValid ? 200 : 0,
      responseTime: isValid ? Math.floor(Math.random() * 500) + 100 : 0,
      checkTime: new Date().toISOString()
    }
  });
});

module.exports = router;
