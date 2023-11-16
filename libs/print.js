var device = null,
    BAdapter = null,
    BluetoothAdapter = null,
    uuid = null,
    UUID = null,
    main = null,
    bluetoothSocket = null
var OutputStreamWriter = null

// #ifdef APP-PLUS
OutputStreamWriter = plus.android.importClass("java.io.OutputStreamWriter")
// #endif

/**
 * 打印
 * @param mac_address 打印机ID
 * @param data 指令集字符串, 为了灵活起见, 指令集在业务代码中进行转换然后传递进来
 */
export const print = (mac_address, data) => {
    var that = this
    if (!mac_address) {
        uni.showModal({
            title: "提示",
            content: "请选择蓝牙打印机",
            showCancel: false,
        })
        return
    }
    if (!data) {
        uni.showModal({
            title: "提示",
            content: "请提供打印数据.",
            showCancel: false,
        })
        return
    }

    main = plus.android.runtimeMainActivity()
    BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter")
    var UUID = plus.android.importClass("java.util.UUID")
    uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    BAdapter = BluetoothAdapter.getDefaultAdapter()
    if (!BAdapter.isEnabled()) {
        uni.showModal({
            title: "提示",
            content: "蓝牙处于关闭状态，是否打开？",
            success: (_) => {
                if (_.confirm) {
                    BAdapter.enable()
                }
            },
        })
        console.log("蓝牙处于关闭状态，正在打开...")
        return
    }

    device = BAdapter.getRemoteDevice(mac_address)
    plus.android.importClass(device)
    bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid)
    plus.android.importClass(bluetoothSocket)
    if (!bluetoothSocket.isConnected()) {
        console.log("检测到设备未连接，尝试连接....")
        bluetoothSocket.connect()
    }
    console.log("设备已连接")
    if (bluetoothSocket.isConnected()) {
        var outputStream = bluetoothSocket.getOutputStream()
        plus.android.importClass(outputStream)
        outputStream.write([0x1b, 0x40]) //打印复位
        outputStream.flush()

        var bytes = plus.android.invoke(data, "getBytes", "gbk") /*utf-8*/

        outputStream.write(bytes)
        outputStream.flush()

        device = null //这里关键
        bluetoothSocket.close()
    }
}

// 打印测试
export const printTest = function () {
    var printerid = uni.getStorageSync("ble_printerId")
    if (printerid) {
        if (printerid != null && printerid.length > 0) {
            var data = {
                name: "鹤山市捷仕克汽车配件有限公司",
                model: "型号123456789",
                code: "编码123456789",
                line: "产线1",
                box: "序号1",
                date: "2023/11/15",
                operator: "操作人",
                auditor: "审核人",
            }
            // 标签开始
            var str = " ! 0 200 200 350 1 " + "\r\n"
            str += "PAGE-WIDTH 600" + "\r\n"

            // 标签内容
            str += "TEXT 24 0 10 10 " + data.name + "\r\n"
            // 二维码
            str += "B QR 380 20 M 2 U 3" + "\r\n"
            str += "MA," + data.code + "\r\n"
            str += "ENDQR" + "\r\n"

            str += "TEXT 24 0 10 50 车型: " + data.model + "\r\n"
            str += "TEXT 24 0 10 100 条码编号:" + data.code + "\r\n"
            str += "TEXT 24 0 300 100 生产线号:" + data.line + "\r\n"
            str += "TEXT 24 0 10 150 装箱序号:" + data.box + "\r\n"
            str += "TEXT 24 0 300 150 日期:" + data.date + "\r\n"
            str += "TEXT 24 0 10 200 装箱人:" + data.operator + "\r\n"
            str += "TEXT 24 0 300 200 确认人:" + data.auditor + "\r\n"

            // 标签结束
            str += "GAP-SENSE" + "\r\n"
            str += "FORM " + "\r\n"
            str += "PRINT " + "\r\n"

            print(printerid, str)
        }
    } else {
        uni.showModal({
            title: "提示",
            content: "请先选择已配对的蓝牙打印机, 再进行测试.",
            showCancel: false,
        })
    }
}

export const IsNullOrEmpty = function (obj) {
    if (obj == null || obj.length == 0) {
        return true
    } else {
        return false
    }
}

export const GetValueOrEmpty = function (obj) {
    if (IsNullOrEmpty(obj)) {
        return ""
    } else {
        return obj
    }
}

//打印标签
export const print_label_ble = function (data) {
    const printerid = uni.getStorageSync("ble_printerId")
    if (printerid) {
        if (printerid != null && printerid.length > 0) {
            var str = get_printstr(data, true)
            console.log("---------print_label_ble---------")
            print_ble(printerid, str)
        }
    } else {
        uni.showModal({
            title: "提示",
            content: "请先选择已配对的蓝牙打印机, 再进行测试.",
            confirmText: "去设置",
            showCancel: true,
            success: (_) => {
                if (_.confirm) {
                    uni.navigateTo({
                        url: "/pages/DefaultPrintSet/index",
                    })
                }
            },
        })
    }
}

//内箱标签
export const print_label_s_ble = function (data) {
    const printerid = uni.getStorageSync("ble_printerId")
    if (printerid) {
        if (printerid != null && printerid.length > 0) {
            var str = get_printstr_S(data)
            print_ble(printerid, str)
        }
    } else {
        uni.showModal({
            title: "提示",
            content: "请先选择已配对的蓝牙打印机, 再进行测试.",
            confirmText: "去设置",
            showCancel: true,
            success: (_) => {
                if (_.confirm) {
                    uni.navigateTo({
                        url: "/pages/DefaultPrintSet/index",
                    })
                }
            },
        })
    }
}

export const get_printer_ip = function () {
    var printerip = uni.getStorageSync("printerip")
    if (IsNullOrEmpty(printerip)) {
        printerip = ""
    }
    return printerip
}

//获取打印机类型
export const get_printer_type = function () {
    var printer_type = uni.getStorageSync("printer_type")
    if (IsNullOrEmpty(printer_type)) {
        printer_type = "1"
    }
    return printer_type
}

export const set_printer_ip = function (printer_ip) {
    if (!IsNullOrEmpty(printer_ip)) {
        uni.setStorageSync("printerip", printer_ip)
    }
}

//打印标签
export const print_barode = function (data) {
    var printer_type = get_printer_type()
    if (printer_type == "1") {
        var str = get_printstr(data, false)
        return printSocket(str)
    } else if (printer_type == "2") {
        return print_label_ble(data, true)
    }
}

//打印内箱标签
export const print_barode_s = function (data) {
    var printer_type = get_printer_type()
    if (printer_type == "1") {
        var str = get_printstr_S(data)
        return printSocket(str)
    } else if (printer_type == "2") {
        return print_label_s_ble(data)
    }
}

export const getstr = function () {
    var data = {
        ReelCode: "SE2018060405B01",
        PartNo: "60016711",
        QtyWithUnit: "12000 PC",
        BatchNo: "8888888888ddd",
        Remark: "非静电敏感*5301*3010*1928100199",
        QrCode: "SM00000191008566084|P60016711|Q12000|9D1941|1T1928100199|R|2T8888888888",
    }

    var s1 = ""
    var s2 = ""
    var s3 = ""
    var s4 = ""
    var s5 = ""
    var qrcode = ""
    if (!IsNullOrEmpty(data.ReelCode)) {
        s1 = data.ReelCode
    }
    if (!IsNullOrEmpty(data.PartNo)) {
        s2 = data.PartNo
    }
    if (!IsNullOrEmpty(data.QtyWithUnit)) {
        s3 = data.QtyWithUnit
    }
    if (!IsNullOrEmpty(data.BatchNo)) {
        s4 = data.BatchNo
    }
    if (!IsNullOrEmpty(data.Remark)) {
        s5 = data.Remark
    }
    if (!IsNullOrEmpty(data.QrCode)) {
        qrcode = data.QrCode
    }

    var str = " ! 0 200 200 216 1 " + "\r\n"
    str += "PAGE-WIDTH 460" + "\r\n"

    str += "BOX  5 0 460 210 2" + "\r\n"
    str += "LINE 5 40 300 40 2" + "\r\n"
    str += "LINE 5 80 300 80 2" + "\r\n"
    str += "LINE 5 120 300 120 2" + "\r\n"
    str += "LINE 5 160 460 160 2" + "\r\n"
    str += "LINE 67 0 67 210 2" + "\r\n"
    str += "LINE 300 0 300 160 2" + "\r\n"

    str += "SETBOLD 0" + "\r\n"
    str += "TEXT 24 0 16 15 ICT  " + s1 + "\r\n"
    str += "TEXT 24 0 16 55 料号 " + s2 + "\r\n"
    str += "TEXT 24 0 16 95 数量 " + s3 + "\r\n"
    str += "TEXT 24 0 16 135 批次 " + s4 + "\r\n"
    str += "TEXT 24 0 16 175 备注 " + s5 + "\r\n"

    str += "B QR 307 10 M 2 U 4" + "\r\n"
    str += "MA," + qrcode + "\r\n"
    str += "ENDQR" + "\r\n"
    str += "GAP-SENSE" + "\r\n"
    str += "FORM " + "\r\n"

    str += "PRINT " + "\r\n"

    return str
}

export const getstr_xq = function () {
    var vendorName = ""
    var partNo = ""
    var qty = ""
    var partDesc = ""
    var reelCode = ""
    var dShippingDate = ""
    var dateCode = ""
    var shippingDate = ""
    var dDateCode = ""
    var qrcode = ""
    var vendorCode = ""

    var data = {
        VendorCode: "PRC00001",
        VendorName: "xx有限公司",
        PartNo: "600014910-01-GP2",
        Qty: "800",
        PartDescription: "水冷板CNC1(上盖+下盖+水嘴)-去油-Text测试一下测试一下",
        ReelCode: "M0000019100856608",
        DShippingDate: "2020-04-11",
        DateCode: "200408",
        ShippingDate: "20200411",
        DDateCode: "4月",
        QrCode: "SM0000019100856608|P600014910-01-GP2|Q800|9D2004|1T1928100199|R|2T8888888888|KCM",
    }
    var vendorName = ""
    var partNo = ""
    var qty = ""
    var partDesc = ""
    var reelCode = ""
    var dShippingDate = ""
    var dateCode = ""
    var shippingDate = ""
    var dDateCode = ""
    var qrcode = ""
    var vendorCode = ""
    if (!IsNullOrEmpty(data.VendorName)) {
        vendorName = data.VendorName
    }
    if (!IsNullOrEmpty(data.PartNo)) {
        partNo = data.PartNo
    }
    if (!IsNullOrEmpty(data.Qty)) {
        qty = data.Qty
    }
    if (!IsNullOrEmpty(data.PartDescription)) {
        partDesc = data.PartDescription
    }
    if (!IsNullOrEmpty(data.ReelCode)) {
        reelCode = data.ReelCode
    }
    if (!IsNullOrEmpty(data.DShippingDate)) {
        dShippingDate = data.DShippingDate
    }
    if (!IsNullOrEmpty(data.DateCode)) {
        dateCode = data.DateCode
    }
    if (!IsNullOrEmpty(data.ShippingDate)) {
        shippingDate = data.ShippingDate
    }
    if (!IsNullOrEmpty(data.DDateCode)) {
        dDateCode = data.DDateCode
    }
    if (!IsNullOrEmpty(data.VendorCode)) {
        vendorCode = data.VendorCode
    }
    if (!IsNullOrEmpty(data.QrCode)) {
        qrcode = data.QrCode
    }

    var str = " ! 0 200 200 672 1 " + "\r\n"
    str += "PAGE-WIDTH 624" + "\r\n"

    str += "BOX  12 0 567 636 2" + "\r\n"

    str += "LINE 12 80 567 80 2" + "\r\n"
    str += "LINE 12 155 567 155 2" + "\r\n"
    str += "LINE 12 232 567 232 2" + "\r\n"
    str += "LINE 12 309 567 309 2" + "\r\n"
    str += "LINE 12 479 567 479 2" + "\r\n"
    str += "LINE 12 555 567 555 2" + "\r\n"

    str += "LINE 402 80 152 636 2" + "\r\n" // 竖线
    str += "LINE 269 155 379 232 2" + "\r\n"
    str += "LINE 467 155 467 232 2" + "\r\n"
    str += "LINE 287 479 287 555 2" + "\r\n"
    str += "LINE 419 479 419 555 2" + "\r\n"
    str += "LINE 367 555 367 636 2" + "\r\n" //最后一个空格的竖线

    str += "SETBOLD 0" + "\r\n"

    str += "SETMAG 2 2" + "\r\n"
    str += "TEXT 24 0 147 30 CoolerMaster(现品票)" + "\r\n"
    str += "TEXT 24 0 19 107 Supplyer" + "\r\n"
    str += "SETMAG 1 1" + "\r\n"
    str += "TEXT 24 0 167 107 " + vendorCode + "  " + vendorName + "\r\n"
    str += "SETMAG 2 2" + "\r\n"
    str += "TEXT 24 0 19 183 Part No" + "\r\n"
    str += "SETMAG 1 1" + "\r\n"
    str += "TEXT 24 0 167 183 " + partNo + "\r\n"
    str += "SETMAG 2 2" + "\r\n"
    str += "TEXT 24 0 397 183 Qty" + "\r\n"
    str += "TEXT 24 0 475 183 " + qty + "\r\n"
    str += "TEXT 24 0 19 260 Desc" + "\r\n"
    str += "SETMAG 1 1" + "\r\n"
    if (partDesc.length < 21) {
        str += "TEXT 24 0 167 260 " + partDesc + "\r\n"
    } else {
        var pd1 = partDesc.substr(0, 20)
        var pd2 = partDesc.substr(21)
        str += "TEXT 24 0 167 240 " + pd1 + "\r\n"
        str += "TEXT 24 0 167 267 " + pd2 + "\r\n"
    }
    str += "SETMAG 2 2" + "\r\n"
    str += "TEXT 24 0 19 391 Box NO" + "\r\n"
    str += "SETMAG 1 1" + "\r\n"
    str += "TEXT 24 0 329 345 " + reelCode + "\r\n"
    str += "TEXT 24 0 329 395 " + dShippingDate + "\r\n"
    str += "SETMAG 2 2" + "\r\n"
    str += "TEXT 24 0 19 507 生产日期" + "\r\n"
    str += "TEXT 24 0 167 507 " + dateCode + "\r\n"
    str += "TEXT 24 0 292 507 出货日期" + "\r\n"
    str += "TEXT 24 0 429 507 " + shippingDate + "\r\n"

    str += "TEXT 24 0 42 585 月份" + "\r\n"
    str += "SETMAG 4 4" + "\r\n"
    str += "TEXT 24 0 227 560 " + dDateCode + "\r\n"
    str += "SETMAG 1 1" + "\r\n"

    str += "B QR 167 323 M 2 U 4" + "\r\n"
    str += "MA," + qrcode + "\r\n"
    str += "ENDQR" + "\r\n"

    /*标签检测 begin*/
    str += "GAP-SENSE" + "\r\n"
    str += "FORM " + "\r\n"
    /*标签检测 end*/

    str += "PRINT " + "\r\n"

    return str
}

export const PrinterIsReady = function () {
    var printer_type = get_printer_type()
    if (printer_type == "2") {
        return PrinterIsReady_ble()
    }

    var ip = get_printer_ip()

    if (IsNullOrEmpty(ip)) {
        uni.showToast({
            title: "WIFI打印机IP没有设定，请先设置好, 再使用.",
        })
        return false
    }
    if (plus.os.name == "Android") {
        var Socket = plus.android.importClass("java.net.Socket")
        var InetSocketAddress = plus.android.importClass("java.net.InetSocketAddress")
        var socket
        var outputStream
        //解决高低版本兼容
        var StrictMode = plus.android.importClass("android.os.StrictMode")
        var Build = plus.android.importClass("android.os.Build")
        if (Build.VERSION.SDK_INT > 9) {
            var policy = new StrictMode.ThreadPolicy.Builder().permitAll().build()
            StrictMode.setThreadPolicy(policy)
        }

        try {
            //socket = new Socket(ip, 9100);
            socket = new Socket()
            socket.connect(new InetSocketAddress(ip, 9100), 1500) //设置连接请求超时时间1.5秒

            socket.setSoTimeout(5000)
            socket.setKeepAlive(true)
            outputStream = socket.getOutputStream()
            plus.android.importClass(outputStream)

            //var bytes = plus.android.invoke("", 'getBytes', 'gbk');
            //outputStream.write(bytes);
            //outputStream.flush();
            socket.shutdownOutput()
        } catch (e) {
            uni.showModal({
                title: "提示",
                content: "网络连接超时，请确认打印机有没有打开或连接！",
                showCancel: false,
            })
            return false
        }
    }
    return true
}

//蓝牙
export const PrinterIsReady_ble = function () {
    if (localStorage.getItem("ble_printerId")) {
        var printerid = localStorage.getItem("ble_printerId")
        if (printerid == null || printerid.length <= 0) {
            uni.showToast({
                title: "请选择蓝牙打印机.",
                icon: "none",
            })
            return false
        }
        try {
            BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter")
            UUID = plus.android.importClass("java.util.UUID")
            uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
            BAdapter = BluetoothAdapter.getDefaultAdapter()
            BAdapter.enable()

            device = BAdapter.getRemoteDevice(printerid)
            plus.android.importClass(device)
            console.log("test blu print.")
            bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid)
            plus.android.importClass(bluetoothSocket)

            if (!bluetoothSocket.isConnected()) {
                bluetoothSocket.connect()
            }
        } catch (ex) {
            bluetoothSocket.close()
            uni.showModal({
                title: "提示",
                content: ex.message,
                showCancel: false,
            })
            return false
        }
    } else {
        uni.showToast({
            title: "请先选择已配对的蓝牙打印机.",
        })
        return false
    }

    return true
}

//WIFI打印
export const printSocket = function (str) {
    var ip = get_printer_ip()

    if (IsNullOrEmpty(ip)) {
        uni.showModal({
            title: "提示",
            content: "WIFI打印机IP没有设定，请先设置好, 再使用.",
            showCancel: false,
            success: (_) => {
                if (_.confirm) {
                    uni.navigateTo({
                        url: "/pages/DefaultPrintSet/index",
                    })
                }
            },
        })
        return false
    }
    if (plus.os.name == "Android") {
        var Socket = plus.android.importClass("java.net.Socket")
        var InetSocketAddress = plus.android.importClass("java.net.InetSocketAddress")
        var socket
        var outputStream
        //解决高低版本兼容
        var StrictMode = plus.android.importClass("android.os.StrictMode")
        var Build = plus.android.importClass("android.os.Build")
        if (Build.VERSION.SDK_INT > 9) {
            var policy = new StrictMode.ThreadPolicy.Builder().permitAll().build()
            StrictMode.setThreadPolicy(policy)
        }

        try {
            //socket = new Socket(ip, 9100);
            socket = new Socket()
            socket.connect(new InetSocketAddress(ip, 9100), 1500) //设置连接请求超时时间1.5秒
            socket.setSoTimeout(5000)

            socket.setKeepAlive(true)
            outputStream = socket.getOutputStream()
            plus.android.importClass(outputStream)

            var bytes = plus.android.invoke(str, "getBytes", "gbk")
            //var bytes = plus.android.invoke(str, 'getBytes', 'UTF-8');
            outputStream.write(bytes)
            outputStream.flush()
            socket.shutdownOutput()
            return true
        } catch (e) {
            uni.showToast({
                title: "WIFI打印机连接超时，请确定是否有正确设置打印机的IP地址或者确认打印机是否有开机！",
            })
            return false
            //TODO handle the exception
        } finally {
            uni.hideLoading()
        }
    }
}

//蓝牙打印
export const print_ble = function (mac_address, str) {
    if (!mac_address) {
        uni.showToast({
            title: "请选择蓝牙打印机",
            icon: "none",
        })
        return
    }
    /* if (IsNullOrEmpty(data)) {
		mui.toast('请提供打印数据.');
		return;
	} */

    main = plus.android.runtimeMainActivity()
    BluetoothAdapter = plus.android.importClass("android.bluetooth.BluetoothAdapter")
    UUID = plus.android.importClass("java.util.UUID")
    uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    BAdapter = BluetoothAdapter.getDefaultAdapter()
    if (!BAdapter.isEnabled()) {
        uni.showModal({
            title: "提示",
            content: "蓝牙处于关闭状态，是否打开？",
            success: (_) => {
                if (_.confirm) {
                    BAdapter.enable()
                }
            },
        })
        return
    }
    try {
        device = BAdapter.getRemoteDevice(mac_address)
        plus.android.importClass(device)
        bluetoothSocket = device.createInsecureRfcommSocketToServiceRecord(uuid)
        plus.android.importClass(bluetoothSocket)
        if (!bluetoothSocket.isConnected()) {
            console.log("检测到设备未连接，尝试连接....")
            bluetoothSocket.connect()
        }
    } catch (ex) {
        console.log(JSON.stringify(ex))
        uni.showModal({
            title: "提示",
            content: "设备连接出错,请确认打印机是否开启." + GetValueOrEmpty(ex.message),
            showCancel: false,
        })
        bluetoothSocket.close()
        return
    }

    if (bluetoothSocket.isConnected()) {
        var outputStream = bluetoothSocket.getOutputStream()
        plus.android.importClass(outputStream)

        //outputStream.write([0x1B, 0x40]); //打印复位
        //outputStream.flush();

        // console.log(str);
        var bytes = plus.android.invoke(decodeURIComponent(str), "getBytes", "gbk")
        outputStream.write(bytes)
        outputStream.flush()

        device = null //这里关键
        bluetoothSocket.close()
    } else {
        uni.showModal({
            title: "提示",
            content: "设备连接不成功",
            showCancel: false,
        })
    }
}

//蓝牙打印测试
export const print_ble_test = function () {
    if (localStorage.getItem("ble_printerId")) {
        var printerid = localStorage.getItem("ble_printerId")
        console.log(printerid, "printerid")
        if (printerid != null && printerid.length > 0) {
            var data = {
                VendorCode: "PRC00001",
                VendorName: "AS电子有限公司",
                PartNo: "600014910-01-GP2",
                Qty: "800",
                QtyWithUnit: "800件",
                PartName: "水冷板CNC1(上盖+下盖+水嘴)-去油",
                PartDesc: "dkady334",
                LotCode: "21e",
                ReelCode: "M0000019100856608",
                DShippingDate: "2020-04-11",
                DateCode: "200408",
                ShippingDate: "20200411",
                DDateCode: "4月",
                QrCode: "SM0000019100856608|P600014910-01-GP2|Q800|9D2004|1T1928100199|R|2T8888888888|KCM",
            }
            var str = get_print_ble_demostr(data)
            print_ble(printerid, str)
        }
    } else {
        uni.showModal({
            title: "提示",
            content: "请先选择已配对的蓝牙打印机, 再进行测试.",
            confirmText: "去设置",
            success: (_) => {
                uni.navigateTo({
                    url: "/pages/DefaultPrintSet/index",
                })
            },
        })
    }
}

//蓝牙打印测试字符串
export const get_print_ble_demostr = function (data) {
    var space = ""
    // 75mm * 50mm
    var str = " ! 0 200 200 400 1 " + "\r\n"
    str += "PAGE-WIDTH 600" + "\r\n"

    str += "SETBOLD 2" + "\r\n"
    str += "TEXT 24 0 25 0 xx \r\n"
    str += "TEXT 24 0 365 0 物 料 标 签 \r\n"

    str += "LINE 0 42 590 42 3" + "\r\n"

    str += "SETBOLD 0" + "\r\n"
    str += "BARCODE 128 0 1 40 20 55 " + GetValueOrEmpty(data.ReelCode) + " \r\n"
    str += "TEXT 24 0 20 98 " + GetValueOrEmpty(data.ReelCode) + " \r\n"

    str += "BARCODE 128 0 1 40 20 130 " + GetValueOrEmpty(data.PartNo) + " \r\n"
    str += "TEXT 24 0 20 175 " + GetValueOrEmpty(data.PartNo) + " \r\n"

    str += "TEXT 24 0 300 175 数量: \r\n"
    str += "TEXT 24 0 385 175 " + GetValueOrEmpty(data.QtyWithUnit) + "\r\n"

    str += "TEXT 24 0 20 210 物料名称: \r\n"
    str += "TEXT 24 0 125 210 " + GetValueOrEmpty(data.PartName) + "\r\n"

    str += "TEXT 24 0 20 240 物料规格: \r\n"
    str += "TEXT 24 0 125 240 " + GetValueOrEmpty(data.PartDesc) + "\r\n"

    str += "TEXT 24 0 20 270 供应商: \r\n"
    str += "TEXT 24 0 125 270 " + GetValueOrEmpty(data.VendorName) + "\r\n"

    str += "TEXT 24 0 20 300 生产日期:\r\n"
    str += "TEXT 24 0 140 300 " + GetValueOrEmpty(data.DateCode) + "\r\n"

    str += "TEXT 24 0 300 300 批次号:\r\n"
    str += "TEXT 24 0 385 300 " + GetValueOrEmpty(data.LotCode) + "\r\n"

    var qrcode = ""
    if (!IsNullOrEmpty(data.QrCode)) {
        qrcode = data.QrCode
    }

    str += "B QR 380 55 M 2 U 3" + "\r\n"
    str += "MA," + qrcode + "\r\n"
    str += "ENDQR" + "\r\n"
    str += "GAP-SENSE" + "\r\n"
    str += "FORM " + "\r\n"
    str += "PRINT " + "\r\n"

    return str
}

export const get_printstr = function (data, isBle) {
    var bcdType = GetValueOrEmpty(data.BcdType)
    console.log(bcdType)
    var result = ""
    switch (bcdType) {
        case "Y":
            result = get_printstr_Y(data)
            break
        case "Z":
            result = get_printstr_Z(data)
            break
        case "J":
            result = get_printstr_J(data)
            break
        case "S":
            result = get_printstr_S(data)
            break
        case "CVTE":
            result = get_printstr_CVTE(data)
            break
        default:
            result = get_printstr_Y(data)
    }
    return result
}
