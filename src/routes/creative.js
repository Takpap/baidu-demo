const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 获取创意列表
router.get('/', (req, res) => {
  const { adgroupId } = req.query;
  const data = readData('creatives.json');
  let creatives = data.creatives;

  if (adgroupId) {
    creatives = creatives.filter(c => c.adgroupId === parseInt(adgroupId));
  }

  res.json({ code: 0, message: 'success', data: creatives });
});

// 获取单个创意
router.get('/:creativeId', (req, res) => {
  const { creativeId } = req.params;
  const data = readData('creatives.json');
  const creative = data.creatives.find(c => c.creativeId === parseInt(creativeId));

  if (!creative) {
    return res.json({ code: 1, message: '创意不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: creative });
});

// 创建创意
router.post('/', (req, res) => {
  const { adgroupId, title, description1, description2, pcDestinationUrl, mobileDestinationUrl } = req.body;
  const data = readData('creatives.json');

  const maxId = data.creatives.reduce((max, c) => Math.max(max, c.creativeId), 0);
  const newCreative = {
    creativeId: maxId + 1,
    adgroupId,
    title,
    description1,
    description2,
    pcDestinationUrl,
    mobileDestinationUrl,
    status: 1,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  data.creatives.push(newCreative);
  writeData('creatives.json', data);

  res.json({ code: 0, message: 'success', data: newCreative });
});

// 更新创意
router.put('/:creativeId', (req, res) => {
  const { creativeId } = req.params;
  const updates = req.body;
  const data = readData('creatives.json');
  const index = data.creatives.findIndex(c => c.creativeId === parseInt(creativeId));

  if (index === -1) {
    return res.json({ code: 1, message: '创意不存在', data: null });
  }

  data.creatives[index] = { ...data.creatives[index], ...updates };
  writeData('creatives.json', data);

  res.json({ code: 0, message: 'success', data: data.creatives[index] });
});

// 删除创意
router.delete('/:creativeId', (req, res) => {
  const { creativeId } = req.params;
  const data = readData('creatives.json');
  const index = data.creatives.findIndex(c => c.creativeId === parseInt(creativeId));

  if (index === -1) {
    return res.json({ code: 1, message: '创意不存在', data: null });
  }

  data.creatives.splice(index, 1);
  writeData('creatives.json', data);

  res.json({ code: 0, message: 'success', data: null });
});

module.exports = router;
