const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 监测类型: 1-基础监测, 2-转化监测, 3-深度转化监测

// 获取监测链接列表
router.get('/', (req, res) => {
  const { campaignId } = req.query;
  const data = readData('tracking.json');
  let trackingUrls = data.trackingUrls;

  if (campaignId) {
    trackingUrls = trackingUrls.filter(t => t.campaignId === parseInt(campaignId));
  }

  res.json({ code: 0, message: 'success', data: trackingUrls });
});

// 获取单个监测链接
router.get('/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const data = readData('tracking.json');
  const tracking = data.trackingUrls.find(t => t.trackingId === parseInt(trackingId));

  if (!tracking) {
    return res.json({ code: 1, message: '监测链接不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: tracking });
});

// 创建监测链接
router.post('/', (req, res) => {
  const { campaignId, trackingName, trackingUrl, trackingType } = req.body;
  const data = readData('tracking.json');

  const maxId = data.trackingUrls.reduce((max, t) => Math.max(max, t.trackingId), 0);
  const newTracking = {
    trackingId: maxId + 1,
    campaignId,
    trackingName,
    trackingUrl,
    trackingType: trackingType || 1,
    status: 1,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  data.trackingUrls.push(newTracking);
  writeData('tracking.json', data);

  res.json({ code: 0, message: 'success', data: newTracking });
});

// 更新监测链接
router.put('/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const updates = req.body;
  const data = readData('tracking.json');
  const index = data.trackingUrls.findIndex(t => t.trackingId === parseInt(trackingId));

  if (index === -1) {
    return res.json({ code: 1, message: '监测链接不存在', data: null });
  }

  data.trackingUrls[index] = { ...data.trackingUrls[index], ...updates };
  writeData('tracking.json', data);

  res.json({ code: 0, message: 'success', data: data.trackingUrls[index] });
});

// 删除监测链接
router.delete('/:trackingId', (req, res) => {
  const { trackingId } = req.params;
  const data = readData('tracking.json');
  const index = data.trackingUrls.findIndex(t => t.trackingId === parseInt(trackingId));

  if (index === -1) {
    return res.json({ code: 1, message: '监测链接不存在', data: null });
  }

  data.trackingUrls.splice(index, 1);
  writeData('tracking.json', data);

  res.json({ code: 0, message: 'success', data: null });
});

// 生成带监测参数的完整链接
router.post('/generate', (req, res) => {
  const { baseUrl, campaignId, adgroupId, creativeId, keyword } = req.body;

  const params = new URLSearchParams({
    bd_vid: `bd_${Date.now()}`,
    campaignid: campaignId || '',
    adgroupid: adgroupId || '',
    creativeid: creativeId || '',
    keyword: keyword || '',
    timestamp: Date.now()
  });

  const generatedUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;

  res.json({
    code: 0,
    message: 'success',
    data: {
      originalUrl: baseUrl,
      generatedUrl,
      params: Object.fromEntries(params)
    }
  });
});

module.exports = router;
