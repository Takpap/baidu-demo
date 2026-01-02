const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 落地页处理 - 记录百度监测参数并展示页面
router.get('/', (req, res) => {
  // 记录点击数据
  const data = readData('clicks.json');

  const clickRecord = {
    id: Date.now(),
    // 落地页路径
    landingPath: req.baseUrl + req.path,
    // 百度营销监测参数
    channel_code: req.query.channel_code || '',
    aid: req.query.aid || '',
    pid: req.query.pid || '',
    uid: req.query.uid || '',
    useid: req.query.useid || '',
    click_id: req.query.click_id || '',
    idfa: req.query.idfa || '',
    imei_md5: req.query.imei_md5 || '',
    androidid: req.query.androidid || '',
    androidid_md5: req.query.androidid_md5 || '',
    ip: req.query.ip || '',
    ua: req.query.ua || '',
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

  // 返回落地页HTML
  const pageTitles = {
    '/landing': '欢迎访问 - 官网落地页',
    '/promo': '限时优惠活动',
    '/product': '产品详情',
    '/sale': '促销活动'
  };

  const title = pageTitles[req.baseUrl] || '欢迎访问';

  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - 百度营销Demo</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <!-- 成功提示 -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <span class="text-green-700 font-medium">监测参数已成功记录!</span>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">${title}</h1>
        <p class="text-gray-600 mb-4">这是百度营销平台的模拟落地页，用于测试监测链接参数回传功能。</p>
        <div class="bg-blue-50 rounded-lg p-4">
          <p class="text-blue-800 text-sm">
            <strong>记录ID:</strong> ${clickRecord.id}<br>
            <strong>记录时间:</strong> ${clickRecord.recordTime}
          </p>
        </div>
      </div>

      <!-- 参数详情 -->
      <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">接收到的监测参数</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-gray-600">参数名</th>
                <th class="px-4 py-2 text-left text-gray-600">参数值</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr><td class="px-4 py-2 text-gray-500">channel_code</td><td class="px-4 py-2 break-all">${clickRecord.channel_code || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">aid (创意ID)</td><td class="px-4 py-2">${clickRecord.aid || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">pid (计划ID)</td><td class="px-4 py-2">${clickRecord.pid || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">uid (单元ID)</td><td class="px-4 py-2">${clickRecord.uid || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">useid (用户ID)</td><td class="px-4 py-2">${clickRecord.useid || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">click_id</td><td class="px-4 py-2 break-all">${clickRecord.click_id || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">bd_vid</td><td class="px-4 py-2 break-all">${clickRecord.bd_vid || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">idfa</td><td class="px-4 py-2">${clickRecord.idfa || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">imei_md5</td><td class="px-4 py-2">${clickRecord.imei_md5 || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">androidid</td><td class="px-4 py-2">${clickRecord.androidid || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">androidid_md5</td><td class="px-4 py-2">${clickRecord.androidid_md5 || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">ip</td><td class="px-4 py-2">${clickRecord.ip || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">ua</td><td class="px-4 py-2 break-all">${clickRecord.ua || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">os</td><td class="px-4 py-2">${clickRecord.os || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">ts</td><td class="px-4 py-2">${clickRecord.ts || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">ext_info</td><td class="px-4 py-2 break-all">${clickRecord.ext_info || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">mac_md5</td><td class="px-4 py-2">${clickRecord.mac_md5 || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">mac</td><td class="px-4 py-2">${clickRecord.mac || '-'}</td></tr>
              <tr><td class="px-4 py-2 text-gray-500">deeplink_url</td><td class="px-4 py-2 break-all">${clickRecord.deeplink_url || '-'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 服务器信息 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">服务器获取的信息</h2>
        <div class="space-y-2 text-sm">
          <p><span class="text-gray-500">真实IP:</span> <span class="text-gray-800">${clickRecord.realIp}</span></p>
          <p><span class="text-gray-500">User-Agent:</span> <span class="text-gray-800 break-all">${clickRecord.realUa}</span></p>
          <p><span class="text-gray-500">Referer:</span> <span class="text-gray-800">${clickRecord.referer || '-'}</span></p>
        </div>
      </div>

      <!-- 返回按钮 -->
      <div class="mt-6 text-center">
        <a href="/" class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          返回管理后台
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `);
});

// 支持子路径
router.get('/:subpath', (req, res) => {
  req.baseUrl = req.baseUrl + '/' + req.params.subpath;
  router.handle(req, res);
});

module.exports = router;
