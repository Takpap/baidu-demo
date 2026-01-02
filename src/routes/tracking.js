const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 百度营销监测参数字段说明
const TRACKING_PARAMS = {
  channel_code: '渠道码',
  aid: '创意ID (IDEA_ID)',
  pid: '计划ID (PLAN_ID)',
  uid: '单元ID (UNIT_ID)',
  useid: '用户ID (USER_ID)',
  click_id: '点击ID (CLICK_ID)',
  idfa: 'iOS广告标识符',
  imei_md5: 'IMEI MD5',
  androidid: '安卓ID原始值',
  androidid_md5: '安卓ID MD5',
  ip: '用户IP',
  ua: 'User Agent',
  os: '操作系统',
  ts: '时间戳',
  ext_info: '扩展信息',
  mac_md5: 'MAC地址MD5',
  mac: 'MAC地址',
  deeplink_url: '深度链接URL',
  bd_vid: '百度访问标识'
};

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
  const { baseUrl, channelCode } = req.body;

  // 生成带百度营销宏参数的链接
  const params = new URLSearchParams({
    channel_code: channelCode || 'WXQYJCTT-AXSYAAAAAB1000117',
    aid: '__IDEA_ID__',
    pid: '__PLAN_ID__',
    uid: '__UNIT_ID__',
    useid: '__USER_ID__',
    click_id: '__CLICK_ID__',
    idfa: '__IDFA__',
    imei_md5: '__IMEI__',
    androidid: '__ANDROIDID1__',
    androidid_md5: '__ANDROIDID__',
    ip: '__IP__',
    ua: '__UA__',
    os: '__OS__',
    ts: '__TS__',
    ext_info: '__EXT_INFO__',
    mac_md5: '__MAC1__',
    mac: '__MAC__',
    deeplink_url: '__DEEPLINK_URL__',
    bd_vid: '__BD_VID__'
  });

  const generatedUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;

  res.json({
    code: 0,
    message: 'success',
    data: {
      originalUrl: baseUrl,
      generatedUrl,
      params: Object.fromEntries(params),
      paramsDescription: TRACKING_PARAMS
    }
  });
});

// 获取监测参数说明
router.get('/params/description', (req, res) => {
  res.json({
    code: 0,
    message: 'success',
    data: TRACKING_PARAMS
  });
});

module.exports = router;
