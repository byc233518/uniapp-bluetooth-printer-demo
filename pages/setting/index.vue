<!-- 
初始化：打开蓝牙模块
搜寻：检测附近存在的设备
连接：找到目标设备进行
监听：开启监听功能，接收其他设备传过来的数据
发送指令：不管发送数据还是读取数据，都可以理解为向外发送指令 
-->
<template>
	<view class="container">
		<net-tip :styles="{top:0}" />
		<view class="btns">
			<button style="margin-right:30rpx;" type="desault" size="mini" @click="searchDevices">搜索设备</button>
			<button style="margin-right:30rpx;" type="desault" size="mini" @click="printTest">打印测试</button>
			<button type="default" size="mini" @click="gotoDemo">Demo界面</button>
		</view>
		<scroll-view scroll-y="true">
			<view class="wrap" v-if="pairedList.length>0">
				<view class="title"><text>已配对设备</text></view>
				<view class="wrap-item">
					<view class="block-item" v-for="(item,index) in pairedList" :key="index">
						<text style="flex:1;">{{ item.name || '未知设备' }}</text>
						<text v-if="currentBlePrint === item.address" class="desc">当前设备</text>
						<text v-else @click="onConn(item.address)">选择打印机</text>
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>

	import {
		printTest
	} from '@/libs/print.js'
	export default {
		name: 'BluetoothPring',
		components: {},
		data() {
			return {
				currentBlePrint: uni.getStorageSync('ble_printerId'),
				isLoading: false,
				unpairedList: [],
				pairedList: [],
				pairedId: null,
				OutputStreamWriter: null
			}
		},
		watch: {
			async pairedList(newVal) {
				if (newVal && newVal.length > 0) {
					let res = await uni.getStorage({
						key: 'printerid'
					})
					if (res) {
						this.pairedId = res[1].data
						return
					}
				}
				this.pairedId = null
			}
		},
		methods: {
			gotoDemo() {
				uni.navigateTo({
					url: '/pages/index/index',
				})
			},
			printTest() {
				printTest()
			},
			onConn(mac_address) {
				uni.setStorage({
					key: 'ble_printerId',
					data: mac_address,
					success: () => {
						this.currentBlePrint = mac_address
						uni.showToast({
							title: '蓝牙打印机设置成功, 可以点击打印测试, 进行测试.',
							icon: 'none'
						})
					},
					fail: () => {
						uni.showToast({
							title: '设置打印机失败',
							icon: 'none'
						})
					}
				})
			},
			//设置蓝牙打印机
			setprinter(mac_address) {
				if (mac_address) {
					uni.setStorage({
						key: 'ble_printerId',
						data: mac_address,
						success: _ => {
							uni.showModal({
								title: '提示',
								content: '蓝牙打印机设置成功, 可以点击打印测试, 进行测试.',
								confirmText: '取消',
								cancelText: '确定'
							})
						}
					})
				}
			},
			//开始搜寻附近的蓝牙外围设备
			searchDevices(address) {
				uni.getSystemInfo({
					success:function(data){  
						var permissionArr;  
						if(data.osAndroidAPILevel<31){  
							permissionArr = ["android.permission.ACCESS_FINE_LOCATION"];  
						}else{  
							permissionArr = ["android.permission.ACCESS_FINE_LOCATION","android.permission.BLUETOOTH_SCAN","android.permission.BLUETOOTH_CONNECT"];//,"android.permission.BLUETOOTH_ADVERTISE" 发现蓝牙权限暂时不需要  
						}  
						plus.android.requestPermissions(permissionArr);// 内部封装了plus.android.requestPermissions  
					},
					fail:function(){  
						uni.showModal({  
							title:"信息获取失败",  
							content: "信息获取失败，请返回主页面",  
							confirmText:"返回",  
							success:function(data){  
								uni.navigateBack({  
									delta:0  
								})  
							}  
						})  
					}  
				})
				var that = this
				//注册类  
				var main = plus.android.runtimeMainActivity();
				var IntentFilter = plus.android.importClass('android.content.IntentFilter');
				var BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter");
				var BluetoothDevice = plus.android.importClass("android.bluetooth.BluetoothDevice");
				var BAdapter = BluetoothAdapter.getDefaultAdapter();
				this.loading = true
				if (!BAdapter.isEnabled()) {
					uni.showModal({
						title: '提示',
						content: '蓝牙处于关闭状态，是否打开？',
						success: _ => {
							BAdapter.enable();
						}
					})
					console.log("蓝牙处于关闭状态，正在打开...");
					return;
				}

				console.log("开始搜索设备");
				var filter = new IntentFilter();
				var bdevice = new BluetoothDevice();
				this.unpairedList = [] //注册容器用来显示未配对设备

				this.pairedList = [] //注册容器用来显示已配对设备

				this.isLoading = true;
				this.btfind = '正在搜索...';
				// BAdapter.startDiscovery(); //开启搜索

				// 获取已配对设备
				const lists = BAdapter.getBondedDevices()
				plus.android.importClass(lists)

				const iterator = lists.iterator()

				plus.android.importClass(iterator)

				while (iterator.hasNext()) {
					const device = iterator.next()
					plus.android.importClass(device)
					console.log('名称：' + device.getName() + '，地址：' + device.getAddress())
					this.pairedList.push({
						address: device.getAddress(),
						name: device.getName(),
					})
				}

				return

				var receiver = plus.android.implements('io.dcloud.android.content.BroadcastReceiver', {
					onReceive: function(context, intent) { //实现onReceiver回调函数
						console.log('context', context)
						plus.android.importClass(intent); //通过intent实例引入intent类，方便以后的‘.’操作
						console.log(intent.getAction()); //获取action
						if (intent.getAction() == "android.bluetooth.adapter.action.DISCOVERY_FINISHED") {
							main.unregisterReceiver(receiver) //取消监听
							that.isLoading = false
							that.btfind = '刷新设备'
							console.log("搜索结束")
						} else {
							var BleDevice = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
							if (!BleDevice || !BleDevice.getAddress() || !BleDevice.getName()) {
								return;
							}
							var cur_address = BleDevice.getAddress();
							var find_obj = that.pairedList.find(i => i && i.id == cur_address) // 
							//判断是否配对
							if (BleDevice.getBondState() == bdevice.BOND_NONE) {
								console.log("未配对蓝牙设备：" + BleDevice.getName() + '    ' + BleDevice
									.getAddress());
								//参数如果跟取得的mac地址一样就配对  
								if (address == BleDevice.getAddress()) {
									if (BleDevice.createBond()) { //配对命令.createBond()  
										uni.showModal({
											title: '提示',
											content: '配对成功',
											showCancel: false
										})
										let flag = false
										that.pairedList.map(i => {
											if (i.id == BleDevice.getAddress()) {
												flag = true
											}
										})
										if (!flag) {
											that.pairedList.push({
												id: BleDevice.getAddress(),
												label: BleDevice.getName(),
												isSet: false
											})
										}
									}
								} else {
									if (cur_address && !find_obj) { //判断防止重复添加  
										let flag = false
										that.unpairedList.map(i => {
											if (i.id == BleDevice.getAddress()) {
												flag = true
											}
										})
										if (!flag) {
											that.unpairedList.push({
												id: BleDevice.getAddress(),
												label: BleDevice.getName()
											})
										}
									}
								}
							} else {
								//if (BleDevice.getName() != un) { //判断防止重复添加  
								if (cur_address && !find_obj) { //判断防止重复添加 
									console.log("已配对蓝牙设备：" + BleDevice.getName() + '    ' + BleDevice
										.getAddress());
									var printerid = BleDevice.getAddress();
									uni.setStorage({
										key: 'printerid',
										data: printerid
									})
									let flag = false
									that.pairedList.map(i => {
										if (i.id == BleDevice.getAddress()) {
											flag = true
										}
									})
									if (!flag) {
										that.pairedList.push({
											id: BleDevice.getAddress(),
											label: BleDevice.getName(),
											isSet: true
										})
									}
								}
							}
						}
					}
				});

				filter.addAction(bdevice.ACTION_FOUND);
				filter.addAction(BAdapter.ACTION_DISCOVERY_STARTED);
				filter.addAction(BAdapter.ACTION_DISCOVERY_FINISHED);
				filter.addAction(BAdapter.ACTION_STATE_CHANGED);

				main.registerReceiver(receiver, filter); //注册监听  

				// this.submitForm()
			},
			init() {
				uni.openBluetoothAdapter({
					success: (res) => {
						uni.startBluetoothDevicesDiscovery({
							services: [],
							success: (res) => {
								console.log('startBluetoothDevicesDiscovery', res)
								this.getBluetoothDevices()
								uni.stopBluetoothDevicesDiscovery({
									success: (res) => {
										console.log('stopBluetoothDevicesDiscovery',
											res)
									},
									fail: (res) => {
										console.log('stopBluetoothDevicesDiscovery',
											res)
									}
								})
							}
						})
					},
					fail: (err) => {
						console.log(err)
						if (err.errCode === 10001) {
							uni.showModal({
								title: '提示',
								content: '当前蓝牙适配器不可用,请检查蓝牙功能是否开启',
								showCancel: false,
								success: function(res) {
									if (res.confirm) {
										console.log('用户点击确定');
									} else if (res.cancel) {
										console.log('用户点击取消');
									}
								}
							});
							return
						}
						if (err.errCode === -1) {
							uni.showToast({
								title: '当前蓝牙已连接',
								icon: 'none'
							})
							return
						}
						if (err.errCode === -1) {
							uni.showToast({
								title: '当前蓝牙已连接',
								icon: 'none'
							})
							return
						}
					}
				})
			}
		},
		onShow() {
			this.OutputStreamWriter = plus.android.importClass("java.io.OutputStreamWriter");
			console.log('OutputStreamWriter', this.OutputStreamWriter)
			this.searchDevices()
			// this.init()
		},
	}
</script>

<style scoped lang="scss">
	uni-page-body {
		background-color: #f2f2f2;
	}

	.container {
		display: flex;
		flex-direction: column;
		padding: 10px;

		.wrap {
			margin-bottom: 20px;

			.title {
				margin-bottom: 10px;
				font-weight: bold;
			}

			.wrap-item {
				background-color: #fff;
				border-radius: 10px;
				padding: 10px;

				.block-item {
					display: flex;
					flex-direction: row;
					align-items: center;
					border-bottom: 1px solid #ddd;
					padding: 10px 0;

					span {
						margin-right: 10px;
					}

					.desc {
						font-size: 13px;
						color: #00bb77;
					}
				}
			}
		}

	}

	@keyframes rotating {
		0% {
			transform: rotateZ(0deg);
		}

		100% {
			transform: rotateZ(360deg);
		}
	}

	.loading {
		animation: rotating 1s linear infinite;

		.iconfont {
			font-size: 36px;
		}
	}

	.noData {
		text-align: center;
		color: #999;
	}

	.scrollWrap {
		height: 500rpx;
	}

	.btns {
		padding: 10px;
		text-align: center;
	}
</style>