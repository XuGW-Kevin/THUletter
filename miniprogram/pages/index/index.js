const app = getApp() // 全局APP
let that = null // 页面this指针
Page({
  data: {
    spage: 0, // 切换页面开始，勿改
    epage: 0, // 切换页面结束，勿改
    status: 0, // 报名状态
    form: {}, // 报名信息填写
    info: {
      start: {
        title: '姚预20官方整活', // 活动名称
        local: '北京·清华大学', // 地点
        time: '敬请期待', // 时间
        hold: '姚预20' // 下方的举办方
      },
      invite: {
        title: '各位同学：', // 邀请对象
        text: '让我们期待下次活动！'
      },
      meeting: [{ // 会议流程
        time: '0:00-23:59',
        text: '敬请期待'
      }],
      address: {
        point: [40.003304, 116.326759], // 地图展示的中心点
        marker: { // 地图当前标记点
          id: 0, // 标记点ID，不用变更
          latitude: 40.003304, // 标记点所在纬度
          longitude: 116.326759, // 标记点所在经度
          iconPath: '../../images/show.png', // 标记点图标，png或jpg类型
          width: '40', // 标记点图标宽度
          height: '48' // 标记点图标高度
        },
        local: '北京市清华大学', // 地址
        time: '2023年13月32日', // 举办时间
        tel: '010 6666 8888' // 联系电话
      }
    }
  },
  /**
   * 页面加载
   */
  onLoad () {
    that = this // 页面this指向指针变量
    const { windowHeight, windowWidth } = wx.getSystemInfoSync() // 获取系统屏幕信息
    that.setData({
      noserver: (windowWidth / windowHeight) > 0.6 // 如果宽高比大于0.6，则差不多平板感觉，不适合邀请函的UI
    })
    that.init() // 初始化
  },
  /**
   * 初始化加载信息
   */
  async init () {
    const result = await app.call({ name: 'get' }) // 调用云函数，获取当前用户报名状态
    that.setData({
      status: result // 将状态存入data，0-未报名，1-审核中，2-报名成功
    })
  },
  /**
   * 覆盖全局的上下页切换，用于地图和表单组件中，禁用全局上下翻页
   * @param {*} e 页面信息
   */
  changeno (e) {
    if (e.type === 'begin' || e.type === 'touchstart') { // 如果触发状态为触摸开始，或者地图移动开始
      that.no = true // 设置不干预变量为true
    } else if (e.type === 'end' || e.type === 'touchend') { // 如果触发状态未触摸结束，或地图移动结束
      setTimeout(function () { // 延迟100ms设置，防止低端机型的线程强占
        that.no = false // 设置不干预变量为false
      }, 100)
    }
  },
  /**
   * 上下翻页
   * @param {*} e 页面信息
   */
  movepage (e) {
    if (that.no === true) return // 如果不干预变量为true，说明禁用翻页
    const { clientY } = e.changedTouches[0] // 获取触摸点Y轴位置
    if (e.type === 'touchstart') { // 如果是触摸开始
      that.startmove = clientY // 记录一下开始点
    }
    if (e.type === 'touchend') { // 如果是触摸结束
      let { epage } = that.data // 获取data中的结束页
      const spage = that.data.epage // 将结束页传给开始页，要从这里动作
      if (that.startmove > clientY) { // 如果触摸点比初次高
        if (epage < 4) epage++ // 在结束页小于4时加1，因为一共就4页
      } else if (that.startmove < clientY) { // 如果触摸点比初次低
        if (epage > 0) epage-- // 在结束页大于0时减1
      }
      if (spage !== epage) { // 如果初始页和结束页相同，则证明翻到底了，不同才要改变
        that.setData({ // 更新存储
          spage: spage,
          epage: epage
        })
      }
    }
  },
  /**
   * 更新输入框输入值
   * @param {*} e 页面信息
   */
  oninput (e) {
    const key = `form.${e.currentTarget.dataset.key}` // 将key值带入，生成改变路径
    that.setData({ // 更改对应路径为输入信息
      [key]: e.detail.value
    })
  },
  /**
   * 提交报名
   */
  async submit () {
    let flag = true // 先设置flag为true，用于检查
    const check = that.data.info.form // 取出form原始结构
    const form = that.data.form // 取出输入的
    for (const i in check) { // 对原始结构进行循环
      if (form[i] == null || form[i] === '') { // 如果原始需要填写的没有写
        wx.showModal({ // 提示要补充
          content: `${check[i].name}未填写，请补充！`,
          showCancel: false
        })
        flag = false // 设置false，跳过提交环节
        break // 退出for循环
      }
    }
    if (flag === true) { // 如果flag=true，证明验证通过
      wx.showLoading({ // 显示加载中
        title: '提交中',
        mask: true
      })
      await app.call({ // 发起云函数，提交信息
        name: 'add',
        data: form
      })
      await that.init() // 更新信息
      wx.hideLoading() // 隐藏加载中
    }
  }
})
