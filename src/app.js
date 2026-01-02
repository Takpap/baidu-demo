const express = require('express');
const path = require('path');
const app = express();

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 模拟百度营销 API 认证中间件
app.use('/api', (req, res, next) => {
  const token = req.headers['authorization'];
  // 模拟 token 验证，实际使用时需要真实验证
  if (!token && req.path !== '/auth/token') {
    // 为了演示方便，暂时不强制验证
    // return res.status(401).json({ code: 401, message: '未授权访问' });
  }
  next();
});

// 路由
const accountRouter = require('./routes/account');
const campaignRouter = require('./routes/campaign');
const adgroupRouter = require('./routes/adgroup');
const keywordRouter = require('./routes/keyword');
const creativeRouter = require('./routes/creative');
const reportRouter = require('./routes/report');
const trackingRouter = require('./routes/tracking');
const promotionUrlRouter = require('./routes/promotionUrl');
const clickRouter = require('./routes/click');

app.use('/api/account', accountRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/adgroup', adgroupRouter);
app.use('/api/keyword', keywordRouter);
app.use('/api/creative', creativeRouter);
app.use('/api/report', reportRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/promotion-url', promotionUrlRouter);
app.use('/api/click', clickRouter);

// 落地页路由 - 接收百度监测参数并记录
const landingRouter = require('./routes/landing');
app.use('/landing', landingRouter);
app.use('/promo', landingRouter);
app.use('/product', landingRouter);
app.use('/sale', landingRouter);

// 模拟获取 token
app.post('/api/auth/token', (req, res) => {
  const { username, password } = req.body;
  // 模拟验证
  if (username === 'demo_user' && password === 'demo123') {
    res.json({
      code: 0,
      message: 'success',
      data: {
        accessToken: 'mock_access_token_' + Date.now(),
        expiresIn: 3600
      }
    });
  } else {
    res.json({ code: 1, message: '用户名或密码错误' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 文档
app.get('/api-docs', (req, res) => {
  res.json({
    name: '百度营销平台 API 模拟服务',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/token': '获取访问令牌'
      },
      account: {
        'GET /api/account/:userId': '获取账户信息',
        'PUT /api/account/:userId/budget': '更新账户预算'
      },
      campaign: {
        'GET /api/campaign': '获取推广计划列表',
        'GET /api/campaign/:campaignId': '获取单个推广计划',
        'POST /api/campaign': '创建推广计划',
        'PUT /api/campaign/:campaignId': '更新推广计划',
        'DELETE /api/campaign/:campaignId': '删除推广计划'
      },
      adgroup: {
        'GET /api/adgroup': '获取推广单元列表',
        'GET /api/adgroup/:adgroupId': '获取单个推广单元',
        'POST /api/adgroup': '创建推广单元',
        'PUT /api/adgroup/:adgroupId': '更新推广单元',
        'DELETE /api/adgroup/:adgroupId': '删除推广单元'
      },
      keyword: {
        'GET /api/keyword': '获取关键词列表',
        'GET /api/keyword/:keywordId': '获取单个关键词',
        'POST /api/keyword': '创建关键词',
        'POST /api/keyword/batch': '批量创建关键词',
        'PUT /api/keyword/:keywordId': '更新关键词',
        'DELETE /api/keyword/:keywordId': '删除关键词'
      },
      creative: {
        'GET /api/creative': '获取创意列表',
        'GET /api/creative/:creativeId': '获取单个创意',
        'POST /api/creative': '创建创意',
        'PUT /api/creative/:creativeId': '更新创意',
        'DELETE /api/creative/:creativeId': '删除创意'
      },
      report: {
        'GET /api/report': '获取报告数据',
        'GET /api/report/summary': '获取汇总报告'
      },
      tracking: {
        'GET /api/tracking': '获取监测链接列表',
        'GET /api/tracking/:trackingId': '获取单个监测链接',
        'POST /api/tracking': '创建监测链接',
        'PUT /api/tracking/:trackingId': '更新监测链接',
        'DELETE /api/tracking/:trackingId': '删除监测链接',
        'POST /api/tracking/generate': '生成带监测参数的完整链接'
      },
      promotionUrl: {
        'GET /api/promotion-url': '获取推广链接列表',
        'GET /api/promotion-url/:urlId': '获取单个推广链接',
        'POST /api/promotion-url': '创建推广链接',
        'POST /api/promotion-url/batch': '批量创建推广链接',
        'PUT /api/promotion-url/:urlId': '更新推广链接',
        'DELETE /api/promotion-url/:urlId': '删除推广链接',
        'POST /api/promotion-url/validate': '验证链接有效性'
      },
      click: {
        'GET /api/click/record': '记录点击(接收百度监测参数)',
        'POST /api/click/record': '记录点击(POST方式)',
        'GET /api/click/list': '获取点击记录列表',
        'GET /api/click/detail/:id': '获取点击记录详情',
        'GET /api/click/stats': '获取点击统计',
        'DELETE /api/click/clear': '清空点击记录'
      }
    }
  });
});

const PORT = 6001;
app.listen(PORT, () => {
  console.log(`百度营销平台模拟服务已启动: http://localhost:${PORT}`);
  console.log(`管理界面: http://localhost:${PORT}/`);
  console.log(`API 文档: http://localhost:${PORT}/api-docs`);
});
