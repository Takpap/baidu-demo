const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataStore');

// 获取报告数据
router.get('/', (req, res) => {
  const { campaignId, startDate, endDate } = req.query;
  const data = readData('reports.json');
  let reports = data.reports;

  if (campaignId) {
    reports = reports.filter(r => r.campaignId === parseInt(campaignId));
  }

  if (startDate) {
    reports = reports.filter(r => r.date >= startDate);
  }

  if (endDate) {
    reports = reports.filter(r => r.date <= endDate);
  }

  res.json({ code: 0, message: 'success', data: reports });
});

// 获取汇总报告
router.get('/summary', (req, res) => {
  const { campaignId, startDate, endDate } = req.query;
  const data = readData('reports.json');
  let reports = data.reports;

  if (campaignId) {
    reports = reports.filter(r => r.campaignId === parseInt(campaignId));
  }

  if (startDate) {
    reports = reports.filter(r => r.date >= startDate);
  }

  if (endDate) {
    reports = reports.filter(r => r.date <= endDate);
  }

  const summary = reports.reduce((acc, r) => ({
    impressions: acc.impressions + r.impressions,
    clicks: acc.clicks + r.clicks,
    cost: acc.cost + r.cost,
    conversions: acc.conversions + r.conversions
  }), { impressions: 0, clicks: 0, cost: 0, conversions: 0 });

  // 计算衍生指标
  summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions * 100).toFixed(2) + '%' : '0%';
  summary.cpc = summary.clicks > 0 ? (summary.cost / summary.clicks).toFixed(2) : '0';
  summary.cvr = summary.clicks > 0 ? (summary.conversions / summary.clicks * 100).toFixed(2) + '%' : '0%';
  summary.cost = summary.cost.toFixed(2);

  res.json({ code: 0, message: 'success', data: summary });
});

module.exports = router;
