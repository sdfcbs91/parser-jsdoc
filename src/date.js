 // 获得格式化时间
  exports.getFormatDate = function(rule, date) {
    // 'YYYY-MM-DD hh:mm:ss'
    let strRule = rule
    if (date === '' || date === undefined || date === null) {
      return ''
    }
    const typeStr = typeof date
    if ((typeStr === 'string' || typeStr === 'number')) {
      date = new Date(date)
    }
    const regList = [{
      reg: /YYYY/,
      func: 'getFullYear',
    }, {
      reg: /MM/,
      func: 'getMonth',
      add: 1,
    }, {
      reg: /DD/,
      func: 'getDate',
    }, {
      reg: /hh/,
      func: 'getHours',
    }, {
      reg: /mm/,
      func: 'getMinutes',
    }, {
      reg: /ss/,
      func: 'getSeconds',
    }]
    
    const dateAsAny = date
    regList.forEach(o => {
      const { reg, func } = o
      if (reg.test(rule)) {
        strRule = strRule.replace(reg, `${dateAsAny[func]() + (o.add ? o.add : 0)}`.padStart(2, '0'))
      }
    })

    return strRule
  }
