const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataStore');

// 获取账户信息
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const data = readData('accounts.json');
  const account = data.accounts.find(a => a.userId === parseInt(userId));

  if (!account) {
    return res.json({ code: 1, message: '账户不存在', data: null });
  }

  res.json({ code: 0, message: 'success', data: account });
});

// 更新账户预算
router.put('/:userId/budget', (req, res) => {
  const { userId } = req.params;
  const { budget } = req.body;
  const data = readData('accounts.json');
  const index = data.accounts.findIndex(a => a.userId === parseInt(userId));

  if (index === -1) {
    return res.json({ code: 1, message: '账户不存在', data: null });
  }

  data.accounts[index].budget = budget;
  writeData('accounts.json', data);

  res.json({ code: 0, message: 'success', data: data.accounts[index] });
});

module.exports = router;
