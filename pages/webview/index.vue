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
				src: "http://192.168.101.110:8080/#/pages/index/index",
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
	}
</script>
