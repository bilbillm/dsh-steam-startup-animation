# DeepSeek 开屏动画

[English](README.md)

为 DeepSeek Harness 桌面端加入 6 秒开屏：带粗细变化的终端工作站逐笔成形，流畅变成圆环，再显现 DeepSeek 官方鲸鱼和文字。可选 Steam 大屏幕模式原版启动音效，保留原速和双声道。

![DeepSeek 开屏](assets/startup.png)
![终端工作站](assets/terminal.png)

## 桌面端安装

需要 DeepSeek Harness **0.2.1-rc.3 或更新的 0.2.x 版本**。

1. 从 [Releases](https://github.com/bilbillm/dsh-startup-animation/releases/latest) 下载 `dsh-startup-animation.tgz`。
2. 打开桌面端的**插件管理 → 添加插件**，输入本地压缩包路径，或 Release 下载地址。
3. 启用插件；宿主提示需要刷新时，重新加载应用。

请通过桌面端自己的插件管理器安装，确保进入桌面端的 profile。单独安装到 `web` profile 不会影响桌面端。

普通 Web profile 也可安装：

```sh
dsh plugin --profile web add https://github.com/bilbillm/dsh-startup-animation/releases/latest/download/dsh-startup-animation.tgz
```

默认仅桌面端自动播放；可在插件页面开启 Web 自动播放。

## 使用

打开插件详情页，可设置启动时播放、音效、音量、仅桌面端播放，并随时播放预览。设置保存在当前应用的浏览器本地存储中，对下一次启动或预览生效。

- 点击**跳过**或按 **Esc** 立即结束。
- 系统开启**减少动态效果**时，跳过自动播放。
- 浏览器阻止自动播放声音时，会出现**开启声音**按钮；动画仍按时结束。
- 切换任务和热加载不会反复播放；重新加载应用会开始新一轮开屏。
- 鲸鱼消失时背景同步变暗，随后露出真实应用界面。

插件不读取对话或凭据，不请求网络，不修改宿主源码，也没有安装期脚本。动画、光场和音效都随插件打包。禁用或卸载时会停止音频、取消动画帧、释放观察器和事件监听、移除遮罩并恢复焦点。

## 开发

仓库已包含构建后的 `lib/`，从源码安装无需运行构建脚本。Node.js 22+ 可重新构建：

```sh
npm run check
npm pack
```

`tests/browser.cjs` 通过 Playwright 验证 Canvas 渲染与浏览器生命周期；`scripts/build.mjs` 仅使用 Node 内置模块。React 与 Cordis slots 由宿主提供，配置页通过公开的 `plugins.bundle.config` 扩展位注册。

## 署名与许可

插件代码使用 MIT 许可证。DeepSeek 品牌标记与 Valve 的 Steam 启动音频归各自权利人所有，不属于代码的 MIT 授权范围，详见[第三方声明](THIRD_PARTY_NOTICES.md)。

本插件为独立社区项目，与 DeepSeek、Valve 无隶属关系。
