const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 获取推广计划列表
router.get('/', (req, res) => {
  const { userId } = req.query;
  const data = readData('campaigns.json');
  let campaigns = data.campaigns;

  if (userId) {
    campaigns = campaigns.filter(c => c.userId === parseInt(userId));
  }

  res.json({ code: 0, message: 'success', data: campaigns });
});

// 获取单个推广计划
router.get('/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const data = readData('campaigns.json');
  const campaign = data.campaigns.find(c => c.campaignId === parseInt(campaignId));

  if (!campaign) {
    return res.json({ code: 1, message: '计划不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: campaign });
});

// 创建推广计划
router.post('/', (req, res) => {
  const { userId, campaignName, budget, startDate, endDate } = req.body;
  const data = readData('campaigns.json');

  const maxId = data.campaigns.reduce((max, c) => Math.max(max, c.campaignId), 0);
  const newCampaign = {
    campaignId: maxId + 1,
    userId,
    campaignName,
    budget: budget || 100.00,
    status: 1,
    startDate,
    endDate,
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  data.campaigns.push(newCampaign);
  writeData('campaigns.json', data);

  res.json({ code: 0, message: 'success', data: newCampaign });
});

// 更新推广计划
router.put('/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const updates = req.body;
  const data = readData('campaigns.json');
  const index = data.campaigns.findIndex(c => c.campaignId === parseInt(campaignId));

  if (index === -1) {
    return res.json({ code: 1, message: '计划不存在', data: null });
  }

  data.campaigns[index] = { ...data.campaigns[index], ...updates };
  writeData('campaigns.json', data);

  res.json({ code: 0, message: 'success', data: data.campaigns[index] });
});

// 删除推广计划
router.delete('/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const data = readData('campaigns.json');
  const index = data.campaigns.findIndex(c => c.campaignId === parseInt(campaignId));

  if (index === -1) {
    return res.json({ code: 1, message: '计划不存在', data: null });
  }

  data.campaigns.splice(index, 1);
  writeData('campaigns.json', data);

  res.json({ code: 0, message: 'success', data: null });
});

module.exports = router;
