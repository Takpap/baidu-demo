const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 获取推广单元列表
router.get('/', (req, res) => {
  const { campaignId } = req.query;
  const data = readData('adgroups.json');
  let adgroups = data.adgroups;

  if (campaignId) {
    adgroups = adgroups.filter(a => a.campaignId === parseInt(campaignId));
  }

  res.json({ code: 0, message: 'success', data: adgroups });
});

// 获取单个推广单元
router.get('/:adgroupId', (req, res) => {
  const { adgroupId } = req.params;
  const data = readData('adgroups.json');
  const adgroup = data.adgroups.find(a => a.adgroupId === parseInt(adgroupId));

  if (!adgroup) {
    return res.json({ code: 1, message: '单元不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: adgroup });
});

// 创建推广单元
router.post('/', (req, res) => {
  const { campaignId, adgroupName, maxPrice } = req.body;
  const data = readData('adgroups.json');

  const maxId = data.adgroups.reduce((max, a) => Math.max(max, a.adgroupId), 0);
  const newAdgroup = {
    adgroupId: maxId + 1,
    campaignId,
    adgroupName,
    maxPrice: maxPrice || 1.00,
    status: 1,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  data.adgroups.push(newAdgroup);
  writeData('adgroups.json', data);

  res.json({ code: 0, message: 'success', data: newAdgroup });
});

// 更新推广单元
router.put('/:adgroupId', (req, res) => {
  const { adgroupId } = req.params;
  const updates = req.body;
  const data = readData('adgroups.json');
  const index = data.adgroups.findIndex(a => a.adgroupId === parseInt(adgroupId));

  if (index === -1) {
    return res.json({ code: 1, message: '单元不存在', data: null });
  }

  data.adgroups[index] = { ...data.adgroups[index], ...updates };
  writeData('adgroups.json', data);

  res.json({ code: 0, message: 'success', data: data.adgroups[index] });
});

// 删除推广单元
router.delete('/:adgroupId', (req, res) => {
  const { adgroupId } = req.params;
  const data = readData('adgroups.json');
  const index = data.adgroups.findIndex(a => a.adgroupId === parseInt(adgroupId));

  if (index === -1) {
    return res.json({ code: 1, message: '单元不存在', data: null });
  }

  data.adgroups.splice(index, 1);
  writeData('adgroups.json', data);

  res.json({ code: 0, message: 'success', data: null });
});

module.exports = router;
