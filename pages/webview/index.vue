<template>
	<web-view 
	:src="src" 
	@message="handleMessage"
	style="flex:1;"></web-view>
</template>

<script>
	// 引入打印插件的打印方法
	import {
		print
	} from '@/libs/print.js'

	export default {
		name: 'WebviewDemo',
		data() {
			return {
				// H5 应用的地址, 替换成自己的H5的地址
				src: "http://192.168.2.56:8080/#/pages/index/index",
				// src: "https://www.baidu.com",
			}
		},
		methods: {
			// 处理H5传递过来的消息和数据
			async handleMessage (e) {
				console.log('收到了H5网页发来的消息', e.detail)
				var options = e.detail.data[0]
				// H5传递过来跳转页面的动作
				if (options.action === 'link') { 
					uni.navigateTo({
						url: options.data
					})
				}
				
				// H5传递过来的打印动作和数据
				if (options.action === 'print') {
					// 获取已经选择的打印机
					var printerid = uni.getStorageSync('ble_printerId')
					if (printerid) {
						if (printerid != null && printerid.length > 0) {
							var str = options.data
							// 调用蓝牙打印
							print(printerid, str);
						}
					}
				}
			},
		},
		onLoad(op) {
		  let height = 0; //定义动态的高度变量
		  	let statusbar = 0; // 动态状态栏高度
		  	uni.getSystemInfo({ // 获取当前设备的具体信息
		  		success: (sysinfo) => {
		  			statusbar = sysinfo.statusBarHeight;
		  			height = sysinfo.windowHeight;
		  		}
		  	});
		  	let currentWebview = this.$scope.$getAppWebview(); //获取当前web-view
		  	setTimeout(function() {
		  		var wv = currentWebview.children()[0];
		  		wv.setStyle({ //设置web-view距离顶部的距离以及自己的高度，单位为px
		  			top: statusbar, //此处是距离顶部的高度，应该是你页面的头部
		  			height: height, //webview的高度
		  		})
		  	}, 200); //如页面初始化调用需要写延迟
		},
	}
</script>
