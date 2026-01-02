const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 记录点击/访问（接收百度营销回传的真实参数）
router.get('/record', (req, res) => {
  const data = readData('clicks.json');

  const clickRecord = {
    id: Date.now(),
    // 百度营销监测参数
    channel_code: req.query.channel_code || '',
    aid: req.query.aid || '',           // 创意ID
    pid: req.query.pid || '',           // 计划ID
    uid: req.query.uid || '',           // 单元ID
    useid: req.query.useid || '',       // 用户ID
    click_id: req.query.click_id || '', // 点击ID
    idfa: req.query.idfa || '',         // iOS广告标识
    imei_md5: req.query.imei_md5 || '', // IMEI MD5
    androidid: req.query.androidid || '',
    androidid_md5: req.query.androidid_md5 || '',
    ip: req.query.ip || req.ip || '',
    ua: req.query.ua || req.headers['user-agent'] || '',
    os: req.query.os || '',
    ts: req.query.ts || '',
    ext_info: req.query.ext_info || '',
    mac_md5: req.query.mac_md5 || '',
    mac: req.query.mac || '',
    deeplink_url: req.query.deeplink_url || '',
    bd_vid: req.query.bd_vid || '',
    // 服务器记录信息
    recordTime: new Date().toISOString(),
    referer: req.headers['referer'] || '',
    realIp: req.headers['x-forwarded-for'] || req.ip || '',
    realUa: req.headers['user-agent'] || ''
  };

  data.clicks.push(clickRecord);
  writeData('clicks.json', data);

  // 返回1x1透明像素或重定向
  if (req.query.redirect) {
    res.redirect(req.query.redirect);
  } else {
    // 返回成功响应
    res.json({ code: 0, message: 'success', data: { id: clickRecord.id } });
  }
});

// POST方式记录点击
router.post('/record', (req, res) => {
  const data = readData('clicks.json');
  const params = req.body;

  const clickRecord = {
    id: Date.now(),
    channel_code: params.channel_code || '',
    aid: params.aid || '',
    pid: params.pid || '',
    uid: params.uid || '',
    useid: params.useid || '',
    click_id: params.click_id || '',
    idfa: params.idfa || '',
    imei_md5: params.imei_md5 || '',
    androidid: params.androidid || '',
    androidid_md5: params.androidid_md5 || '',
    ip: params.ip || req.ip || '',
    ua: params.ua || req.headers['user-agent'] || '',
    os: params.os || '',
    ts: params.ts || '',
    ext_info: params.ext_info || '',
    mac_md5: params.mac_md5 || '',
    mac: params.mac || '',
    deeplink_url: params.deeplink_url || '',
    bd_vid: params.bd_vid || '',
    recordTime: new Date().toISOString(),
    referer: req.headers['referer'] || '',
    realIp: req.headers['x-forwarded-for'] || req.ip || '',
    realUa: req.headers['user-agent'] || ''
  };

  data.clicks.push(clickRecord);
  writeData('clicks.json', data);

  res.json({ code: 0, message: 'success', data: clickRecord });
});

// 获取点击记录列表
router.get('/list', (req, res) => {
  const { channel_code, pid, uid, aid, bd_vid, startTime, endTime, page = 1, pageSize = 20 } = req.query;
  const data = readData('clicks.json');
  let clicks = data.clicks || [];

  // 筛选
  if (channel_code) {
    clicks = clicks.filter(c => c.channel_code === channel_code);
  }
  if (pid) {
    clicks = clicks.filter(c => c.pid === pid);
  }
  if (uid) {
    clicks = clicks.filter(c => c.uid === uid);
  }
  if (aid) {
    clicks = clicks.filter(c => c.aid === aid);
  }
  if (bd_vid) {
    clicks = clicks.filter(c => c.bd_vid === bd_vid);
  }
  if (startTime) {
    clicks = clicks.filter(c => c.recordTime >= startTime);
  }
  if (endTime) {
    clicks = clicks.filter(c => c.recordTime <= endTime);
  }

  // 按时间倒序
  clicks.sort((a, b) => new Date(b.recordTime) - new Date(a.recordTime));

  // 分页
  const total = clicks.length;
  const start = (page - 1) * pageSize;
  const list = clicks.slice(start, start + parseInt(pageSize));

  res.json({
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  });
});

// 获取单条点击记录详情
router.get('/detail/:id', (req, res) => {
  const { id } = req.params;
  const data = readData('clicks.json');
  const click = data.clicks.find(c => c.id === parseInt(id));

  if (!click) {
    return res.json({ code: 1, message: '记录不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: click });
});

// 获取点击统计
router.get('/stats', (req, res) => {
  const { startTime, endTime } = req.query;
  const data = readData('clicks.json');
  let clicks = data.clicks || [];

  if (startTime) {
    clicks = clicks.filter(c => c.recordTime >= startTime);
  }
  if (endTime) {
    clicks = clicks.filter(c => c.recordTime <= endTime);
  }

  // 按渠道统计
  const byChannel = {};
  // 按计划统计
  const byPlan = {};
  // 按单元统计
  const byUnit = {};
  // 按日期统计
  const byDate = {};

  clicks.forEach(c => {
    // 渠道统计
    if (c.channel_code) {
      byChannel[c.channel_code] = (byChannel[c.channel_code] || 0) + 1;
    }
    // 计划统计
    if (c.pid) {
      byPlan[c.pid] = (byPlan[c.pid] || 0) + 1;
    }
    // 单元统计
    if (c.uid) {
      byUnit[c.uid] = (byUnit[c.uid] || 0) + 1;
    }
    // 日期统计
    const date = c.recordTime.split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });

  res.json({
    code: 0,
    message: 'success',
    data: {
      total: clicks.length,
      byChannel,
      byPlan,
      byUnit,
      byDate
    }
  });
});

// 清空点击记录
router.delete('/clear', (req, res) => {
  writeData('clicks.json', { clicks: [] });
  res.json({ code: 0, message: 'success', data: null });
});

module.exports = router;
