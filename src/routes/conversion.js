const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 百度回传API地址
const BAIDU_API_URL = 'https://ocpc.baidu.com/ocpcapi/api/uploadConvertData';

// 从配置文件读取转化类型
function getConversionTypes() {
  const config = readData('conversionTypes.json');
  return config.conversionTypes || {};
}

// 获取配置
router.get('/config', (req, res) => {
  const data = readData('conversions.json');
  res.json({
    code: 0,
    message: 'success',
    data: {
      token: data.config?.token || '',
      apiUrl: data.config?.apiUrl || BAIDU_API_URL
    }
  });
});

// 保存配置
router.post('/config', (req, res) => {
  const { token, apiUrl } = req.body;
  const data = readData('conversions.json');
  data.config = {
    token: token || '',
    apiUrl: apiUrl || BAIDU_API_URL
  };
  writeData('conversions.json', data);
  res.json({ code: 0, message: 'success' });
});

// 获取自动回传配置
router.get('/auto-upload/config', (req, res) => {
  const data = readData('conversions.json');
  res.json({
    code: 0,
    message: 'success',
    data: data.autoUpload || { enabled: false, types: [], delay: 0 }
  });
});

// 保存自动回传配置
router.post('/auto-upload/config', (req, res) => {
  const { enabled, types, delay } = req.body;
  const data = readData('conversions.json');
  data.autoUpload = {
    enabled: enabled !== undefined ? enabled : false,
    types: Array.isArray(types) ? types.map(t => parseInt(t)) : [],
    delay: parseInt(delay) || 0
  };
  writeData('conversions.json', data);
  res.json({ code: 0, message: 'success' });
});

// 自动回传处理函数（供landing.js调用）
async function autoUploadConversion(click) {
  const data = readData('conversions.json');
  const autoConfig = data.autoUpload;
  const token = data.config?.token;

  // 检查是否启用自动回传
  if (!autoConfig?.enabled || !token) {
    return null;
  }

  // 检查是否有配置的转化类型
  if (!autoConfig.types || autoConfig.types.length === 0) {
    return null;
  }

  // 检查点击记录是否有必要的参数
  if (!click.bd_vid && !click.ext_info) {
    return null;
  }

  // 构建logidUrl
  let logidUrl = '';
  if (click.bd_vid) {
    logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?bd_vid=${click.bd_vid}`;
  } else if (click.ext_info) {
    logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?ext_info=${click.ext_info}`;
  }

  // 为每个配置的转化类型创建回传数据
  const conversionTypes = autoConfig.types.map(newType => {
    const conversionData = {
      logidUrl,
      newType: parseInt(newType)
    };
    if (click.ext_info) conversionData.ext_info = click.ext_info;
    return conversionData;
  });

  // 延迟执行（如果配置了延迟）
  const doUpload = async () => {
    try {
      const response = await fetch(data.config.apiUrl || BAIDU_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          conversionTypes
        })
      });

      const result = await response.json();

      // 记录回传历史
      const freshData = readData('conversions.json');
      const record = {
        id: Date.now(),
        clickId: click.id,
        conversionTypes,
        result,
        isAuto: true,
        createTime: new Date().toISOString()
      };
      freshData.conversions.push(record);
      writeData('conversions.json', freshData);

      console.log(`[自动回传] 点击ID: ${click.id}, 类型: ${autoConfig.types.join(',')}, 状态: ${result?.header?.status === 0 ? '成功' : '失败'}`);
      return result;
    } catch (error) {
      console.error(`[自动回传] 失败: ${error.message}`);
      return { error: error.message };
    }
  };

  if (autoConfig.delay > 0) {
    setTimeout(doUpload, autoConfig.delay * 1000);
    return { scheduled: true, delay: autoConfig.delay };
  } else {
    return doUpload();
  }
}

// 导出自动回传函数
router.autoUploadConversion = autoUploadConversion;

// 获取转化类型列表
router.get('/types', (req, res) => {
  const { platform } = req.query; // 可选参数: search 或 feed
  const types = getConversionTypes();

  // 如果指定了平台，过滤出该平台支持的类型
  if (platform && (platform === 'search' || platform === 'feed')) {
    const filtered = {};
    Object.entries(types).forEach(([key, value]) => {
      if (value[platform] && value[platform].length > 0) {
        filtered[key] = value;
      }
    });
    return res.json({
      code: 0,
      message: 'success',
      data: filtered
    });
  }

  res.json({
    code: 0,
    message: 'success',
    data: types
  });
});

// 回传转化数据到百度
router.post('/upload', async (req, res) => {
  const { conversionTypes } = req.body;
  const data = readData('conversions.json');
  const token = data.config?.token;

  if (!token) {
    return res.json({ code: 1, message: '请先配置API Token' });
  }

  if (!conversionTypes || conversionTypes.length === 0) {
    return res.json({ code: 1, message: 'conversionTypes不能为空' });
  }

  if (conversionTypes.length > 100) {
    return res.json({ code: 1, message: 'conversionTypes数组长度不能超过100' });
  }

  try {
    const response = await fetch(data.config.apiUrl || BAIDU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        conversionTypes
      })
    });

    const result = await response.json();

    // 记录回传历史
    const record = {
      id: Date.now(),
      conversionTypes,
      result,
      createTime: new Date().toISOString()
    };
    data.conversions.push(record);
    writeData('conversions.json', data);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.json({
      code: 1,
      message: '回传失败: ' + error.message
    });
  }
});

// 从点击记录回传转化
router.post('/upload-from-click', async (req, res) => {
  const { clickId, newType, convertValue, convertTime, attributeSource, interactionsType } = req.body;
  const clicksData = readData('clicks.json');
  const convData = readData('conversions.json');
  const token = convData.config?.token;

  if (!token) {
    return res.json({ code: 1, message: '请先配置API Token' });
  }

  // 查找点击记录
  const click = clicksData.clicks.find(c => c.id === clickId);
  if (!click) {
    return res.json({ code: 1, message: '点击记录不存在' });
  }

  // 构建logidUrl
  let logidUrl = '';
  if (click.bd_vid) {
    logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?bd_vid=${click.bd_vid}`;
  } else if (click.ext_info) {
    logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?ext_info=${click.ext_info}`;
  } else {
    return res.json({ code: 1, message: '点击记录缺少bd_vid或ext_info' });
  }

  // 构建转化数据
  const conversionData = {
    logidUrl,
    newType: parseInt(newType)
  };

  if (convertValue) conversionData.convertValue = parseInt(convertValue);
  if (convertTime) conversionData.convertTime = parseInt(convertTime);
  if (attributeSource !== undefined) conversionData.attributeSource = parseInt(attributeSource);
  if (interactionsType) conversionData.interactionsType = parseInt(interactionsType);
  if (click.ext_info) conversionData.ext_info = click.ext_info;

  try {
    const response = await fetch(convData.config.apiUrl || BAIDU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        conversionTypes: [conversionData]
      })
    });

    const result = await response.json();

    // 记录回传历史
    const record = {
      id: Date.now(),
      clickId,
      conversionTypes: [conversionData],
      result,
      createTime: new Date().toISOString()
    };
    convData.conversions.push(record);
    writeData('conversions.json', convData);

    res.json({
      code: 0,
      message: 'success',
      data: result
    });
  } catch (error) {
    res.json({
      code: 1,
      message: '回传失败: ' + error.message
    });
  }
});

// 批量回传（从多个点击记录）
router.post('/upload-batch', async (req, res) => {
  const { items } = req.body; // [{clickId, newType, convertValue?, convertTime?}]
  const clicksData = readData('clicks.json');
  const convData = readData('conversions.json');
  const token = convData.config?.token;

  if (!token) {
    return res.json({ code: 1, message: '请先配置API Token' });
  }

  if (!items || items.length === 0) {
    return res.json({ code: 1, message: '回传数据不能为空' });
  }

  if (items.length > 100) {
    return res.json({ code: 1, message: '单次回传不能超过100条' });
  }

  const conversionTypes = [];
  const errors = [];

  items.forEach((item, index) => {
    const click = clicksData.clicks.find(c => c.id === item.clickId);
    if (!click) {
      errors.push({ index, message: '点击记录不存在' });
      return;
    }

    let logidUrl = '';
    if (click.bd_vid) {
      logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?bd_vid=${click.bd_vid}`;
    } else if (click.ext_info) {
      logidUrl = `https://baidu.tempocc.cn${click.landingPath || '/landing'}?ext_info=${click.ext_info}`;
    } else {
      errors.push({ index, message: '缺少bd_vid或ext_info' });
      return;
    }

    const conversionData = {
      logidUrl,
      newType: parseInt(item.newType)
    };

    if (item.convertValue) conversionData.convertValue = parseInt(item.convertValue);
    if (item.convertTime) conversionData.convertTime = parseInt(item.convertTime);
    if (item.attributeSource !== undefined) conversionData.attributeSource = parseInt(item.attributeSource);
    if (item.interactionsType) conversionData.interactionsType = parseInt(item.interactionsType);
    if (click.ext_info) conversionData.ext_info = click.ext_info;

    conversionTypes.push(conversionData);
  });

  if (conversionTypes.length === 0) {
    return res.json({ code: 1, message: '没有有效的回传数据', errors });
  }

  try {
    const response = await fetch(convData.config.apiUrl || BAIDU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        conversionTypes
      })
    });

    const result = await response.json();

    // 记录回传历史
    const record = {
      id: Date.now(),
      conversionTypes,
      result,
      createTime: new Date().toISOString()
    };
    convData.conversions.push(record);
    writeData('conversions.json', convData);

    res.json({
      code: 0,
      message: 'success',
      data: result,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.json({
      code: 1,
      message: '回传失败: ' + error.message
    });
  }
});

// 获取回传历史
router.get('/history', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const data = readData('conversions.json');
  let conversions = data.conversions || [];

  // 按时间倒序
  conversions.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

  // 分页
  const total = conversions.length;
  const start = (page - 1) * pageSize;
  const list = conversions.slice(start, start + parseInt(pageSize));

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

// 清空回传历史
router.delete('/history', (req, res) => {
  const data = readData('conversions.json');
  data.conversions = [];
  writeData('conversions.json', data);
  res.json({ code: 0, message: 'success' });
});

// 模拟回传（不实际调用百度API，用于测试）
router.post('/mock-upload', (req, res) => {
  const { conversionTypes } = req.body;
  const data = readData('conversions.json');

  if (!conversionTypes || conversionTypes.length === 0) {
    return res.json({ code: 1, message: 'conversionTypes不能为空' });
  }

  // 模拟成功响应
  const mockResult = {
    header: {
      desc: 'success',
      status: 0
    }
  };

  // 记录回传历史
  const record = {
    id: Date.now(),
    conversionTypes,
    result: mockResult,
    isMock: true,
    createTime: new Date().toISOString()
  };
  data.conversions.push(record);
  writeData('conversions.json', data);

  res.json({
    code: 0,
    message: 'success',
    data: mockResult
  });
});

module.exports = router;
