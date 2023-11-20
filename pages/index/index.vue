<template>
	<view>
		<view>
			<view>
				<input v-model="formData.name" class="uni-input" placeholder="公司名称" />
				<input v-model="formData.model" class="uni-input" placeholder="车型" />
				<input v-model="formData.code" class="uni-input" placeholder="条码" />
				<input v-model="formData.line" class="uni-input" placeholder="产线" />
				<input v-model="formData.box" class="uni-input" placeholder="箱号" />
				<input v-model="formData.date" class="uni-input" placeholder="日期" />
				<input v-model="formData.operator" class="uni-input" placeholder="装箱人" />
				<input v-model="formData.auditor" class="uni-input" placeholder="确认人" />
			</view>
			<view class="buttos-bar">
				<button class="plain-button plain-button--blue" @click="printTest">打印测试</button>
				<navigator url="/pages/setting/index" hover-class="navigator-hover">
					<button type="default">跳转到设置界面</button>
				</navigator>
				<navigator url="/pages/webview/index" hover-class="navigator-hover">
					<button type="default">跳转到webview界面</button>
				</navigator>
			</view>
		</view>
	</view>
	</view>
</template>

<script>
	import h5View from '../webview/index.vue'
	// 引入打印插件的打印方法
	import {
		print
	} from '@/libs/print.js'

	export default {
		name: 'PrintDemo',
		components:{ h5View },
		data() {
			return {
				// 业务数据
				formData: {
					name: "鹤山市捷仕克汽车配件有限公司",
					model: "型号123456789",
					code: "编码123456789",
					line: "产线1",
					box: "序号1",
					date: "2023/11/15",
					operator: "操作人",
					auditor: "审核人",
				}
			}
		},
		methods: {
			printTest() {
				// 从缓存中获取已经连接的打印机信息
				var printerid = uni.getStorageSync('ble_printerId')
				if (printerid) {
					if (printerid != null && printerid.length > 0) {
						
						const data = this.formData
						
						// 标签开始, 固定开头, 详见 指令集文档
						var str = " ! 0 200 200 350 1 " + '\r\n';
						// 设置打印纸张宽度
						str += "PAGE-WIDTH 600" + '\r\n';
						
						// 标签内容
						// 文本 {command} {font} {size} {x} {y} {data}
						str += "TEXT 24 0 30 50 " + data.name +"\r\n";
						
						/*
						 * 二维码 
						 * {command} {type} {x} {y} [M n] [U n] {data}
						 * 
						 * 
						 * */
						// 
						str += "B QR 380 20 M 2 U 5" + '\r\n';
						str += "MA," + data.code +"\r\n";
						str += "ENDQR" + '\r\n';
						
						str += "TEXT 24 0 30 100 车型: " + data.model +"\r\n";
						str += "TEXT 24 0 30 150 条码编号:" + data.code +"\r\n";
						str += "TEXT 24 0 320 150 生产线号:" + data.line +"\r\n";
						str += "TEXT 24 0 30 200 装箱序号:" + data.box +"\r\n";
						str += "TEXT 24 0 320 200 日期:" + data.date +"\r\n";
						str += "TEXT 24 0 30 250 装箱人:" + data.operator +"\r\n";
						str += "TEXT 24 0 320 250 确认人:" + data.auditor +"\r\n";
						
						
						/*
						 * 线框
						 * {command} {x0} {y0} {x1} {y1} {width}
						 * {command}：BOX 
						 * {x0}：左上角的横坐标 
						 * {y0}：左上角的纵坐标 
						 * {x1}：右下角的横坐标 
						 * {y1}：右下角的纵坐标 
						 * {width}：矩形框线条的单位宽度
						*/
						str += "BOX 20 90 300 140 2" + "\r\n";
							
						// 标签结束
						str += "GAP-SENSE" + '\r\n';
						str += "FORM " + '\r\n';
						str += "PRINT " + '\r\n';
						
						// 指令集拼接完成, 调用打印插件打印方法进行打印
						print(printerid, str);
					}
				} else {
					uni.showModal({
						title: '提示',
						content: '请先选择已配对的蓝牙打印机, 再进行测试.',
						showCancel: false
					})
				}
			},
		},
	}
</script>

<style scoped lang="scss">
	.uni-input {
		margin-top: 10px;
		height: 30px;
		border: 1px solid #eee;
	}
</style>