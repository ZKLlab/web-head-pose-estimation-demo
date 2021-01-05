**纯前端人脸关键点识别及头部姿态估计算法实现 DEMO**

---

**原理：**

- 使用 [face-api.js](https://github.com/justadudewhohacks/face-api.js) 识别人脸关键点
- 使用自己编译的 [opencv](https://github.com/opencv/opencv)\.js 实现算法估计头部姿态
- 通过[魔改版 live2d-widget.js](https://github.com/ZKLlab/live2d-widget.js) 渲染纸片人形象

**效果：**

- 点击[页面](https://zhipianren.zkllab.com/)下方“开启视频”，将人脸移入屏幕区域
- 等待 Live2D 模型加载完成
- 出现人脸识别框和纸片人之后，纸片人的头部会随着摄像头前的人面部角度变化而变化(不同模型有效果好坏之区分)

**许可证：**

ISC
