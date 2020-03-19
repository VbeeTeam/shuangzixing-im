<template>
    <div class="hello" id="hello">
        <!-- NavBar -->
        <van-nav-bar class="navbar" :title="user.userName" left-text="返回" left-arrow @click-left="onClickLeft" @click-right="onClickRight" fixed>
            <van-icon name="ellipsis" slot="right" />
        </van-nav-bar>
        <!-- NavBar -->
        <van-pull-refresh v-model="isLoading" @refresh="onRefresh">
            <div id="message" class="message">
                <ul>
                    <transition-group name="slide-fade">
                        <li :id="'id' + item.id" v-for="(item, index) in messageList" :key="item.id">
                            <p class="time">
                                <span>{{ item.createTime }}</span>
                            </p>
                            <div class="leftmsg" v-if="item.direction == 'RECEIVE' && item.type != 5">
                                <!-- <span class="ltime">{{ item.createTime }}</span> -->
                                <div class="main">
                                    <div class="avatarplace"></div>
                                    <img class="avatar" width="40" height="40" :src="customerImg" />
                                    <div class="text" v-html="item.content"></div>
                                </div>
                            </div>
                            <div class="rightmsg" v-if="item.direction == 'REPLY'">
                                <!-- <span class="rtime">{{ item.createTime }}</span> -->
                                <div class="main self">
                                    <div class="avatarplace"></div>
                                    <img class="avatar" width="40" height="40" :src="user.avatar" />
                                    <div class="text" v-html="item.content" v-if="item.type == 1"></div>
                                    <div class="textimg" v-html="item.content" v-if="item.type == 2" @click.capture="showPopImg(item.content)"></div>
                                    <div class="textlink" v-html="item.content" v-if="item.type == 3"></div>
                                </div>
                            </div>
                            <div class="" v-if="item.type == 5">
                                <!-- <span class="rtime">{{ item.createTime }}</span> -->
                                <div class="main system">
                                    <div class="text" v-html="'系统提醒:' + item.content" v-if="item.type == 5"></div>
                                </div>
                            </div>
                        </li>
                    </transition-group>
                </ul>
            </div>
        </van-pull-refresh>
        <div class="imputtext">
            <textarea class="tarea" placeholder="按 Enter 发送" v-model="content" @keyup="onKeyup"></textarea>
            <van-button class="send" color="linear-gradient(to right, #06C8FC, #0092FE)" size="small" round type="primary" text="发送" @click="sendClick" />
            <div class="bar">
                <div class="barlist">
                    <span class="icon iconfont icon-zhishiku" @click="openKonw"></span>
                    <van-uploader :accept="'image/*'" :after-read="onRead">
                        <span class="icon iconfont icon-paizhao"></span>
                    </van-uploader>
                    <span class="icon iconfont icon-fangan" @click="sendPlan"></span>
                    <span class="icon iconfont icon-wenjuan" @click="sendQA"></span>

                    <!-- <van-icon size="25px" name="coupon" /> -->
                </div>
            </div>
        </div>
        <!-- action-sheet -->
        <van-action-sheet class="sheet" v-model="showSheet" :actions="actions" cancel-text="取消" @cancel="onCancel" @select="onSelect" />
        <!-- action-sheet -->
        <van-popup v-model="show" position="bottom" class="popwrap">
            <knowledge @sureImg="senImage"></knowledge>
        </van-popup>
        <van-popup v-model="showImg" position="center" class="popImg">
            <div class="" v-html="showImgUrl"></div>
            <!-- <img :src="showImgUrl" alt="" class="fullimg" /> -->
        </van-popup>
    </div>
</template>

<script>
import Knowledge from '@/views/chat/knowledge.vue'
import { load } from 'protobufjs'
import { uploadFile, getPlan } from '@/api/knowledge'
import io from 'socket.io-client'
import moment from 'moment'
import axios from 'axios'

import Vue from 'vue'
import { Dialog, Notify } from 'vant'
Vue.use(Dialog)
Vue.use(Notify)

const base_url = process.env.BASE_API

export default {
    name: 'chat',
    data() {
        return {
            userId: '',
            customerId: '',
            customerUserId: '',
            show: false,
            showImg: false,
            showImgUrl: '',
            showSheet: false, //点击右上角 上拉菜单
            actions: [
                { name: '查看用户信息', color: '#2EE2AC', value: true },
                { name: '关闭对话', color: '#FF631D', value: false }
            ],

            socket: null, //定义socket实例
            // buffer: null,
            // message: null,
            content: '',
            fetchTime: '',
            messageList: {},
            isLoading: false,
            customerImg: '',
            // proto
            common_data: {},
            msg_list_data: {},
            getMsgListData: {},
            readMessageData: {},
            reply_data: {},
            putLinkData: {},
            msgID: 0
        }
    },
    components: {
        Knowledge
    },
    directives: {},
    computed: {},
    created() {},
    mounted() {
        this.customerId = this.$route.query.customerId
        this.userId = this.$route.query.userId
        this.customerUserId = this.$route.query.customerUserId

        this.checkSocket()
        let that = this
        this.customerImg = this.$store.getters.getCustomerImg

        // 以当前时间获取
        this.fetchTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        load('./static/common.proto', function(err, root) {
            if (err) throw err
            that.common_data = root.lookupType('CommonMessage')
            that.msg_list_data = root.lookupType('ConsultMsgList')
            that.getMsgListData = root.lookupType('ConsultGetMsgList')
            that.readMessageData = root.lookupType('ReadMessage')
            that.reply_data = root.lookupType('ConsultMessageReply')
            that.message_data = root.lookupType('ConsultMessage')
            that.putLinkData = root.lookupType('PutLink')
            that.setSessionStatus = root.lookupType('SetSessionStatus')

            // 获取和某个客户的对话消息列表
            that.socket.emit('getMsgList', that.encodeData(that.getMsgListData, { createTime: that.fetchTime, customerId: that.customerId }), function(data) {
                let msgData = that.decodeData(that.msg_list_data, data)
                console.log('GOOGLE: mounted -> msgData', msgData)
                msgData.msgList.reverse()

                // 处理消息类型 2img套上img标签
                for (let i = 0; i < msgData.msgList.length; i++) {
                    const element = msgData.msgList[i]
                    element.id = that.msgID
                    that.msgID++
                    if (element.type == 2) {
                        element.content = `<img class="ximg" width="100" height="100" src="${element.content}" />`
                    }
                }
                that.messageList = msgData.msgList
                that.customerId = msgData.customerId
                // 根据时间段上报已读消息
                that.socket.emit('readMessage', that.encodeData(that.readMessageData, { customerId: that.customerId }), function(data) {})
                // 滚动聊天底部
                that.$nextTick(() => {
                    let msg = document.getElementById('hello') // 获取对象
                    msg.scrollTop = msg.scrollHeight // 滚动高度
                })
            })

            // 接收客户消息 监听
            that.socket.on('consult', function(data) {
                let userMsg = that.decodeData(that.message_data, data)
                console.log('GOOGLE: mounted -> userMsg', userMsg)
                let nowTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

                that.messageList.push({
                    adviserId: userMsg.adviserId,
                    content: userMsg.messageContent,
                    createTime: nowTime,
                    customerId: userMsg.customerId,
                    direction: 'RECEIVE',
                    markRead: true,
                    type: userMsg.messageType,
                    id: that.msgID
                })
                that.msgID++
                // 滚动聊天底部
                that.$nextTick(() => {
                    let msg = document.getElementById('hello') // 获取对象
                    msg.scrollTop = msg.scrollHeight // 滚动高度
                })
            })
        })
        // // 接收客户消息
        // that.socket.on('consult', function(data) {
        //     console.log('==============>')
        //     // console.log('==============>' + data)
        //     // console.log(`接收客户消息 = ${JSON.stringify(that.decodeData(that.message_data, data))}`)
        // })
        // // 获取和某个客户的对话消息列表
        // let param = { createTime: '2019-12-12 13:36:59', customerId: 'xxx' }
        // console.log('GOOGLE: that.getMsgListData', that.getMsgListData)
        // console.log('GOOGLE: that.userInfo_data', that.userInfo_data)
        // this.socket.emit('getMsgList', that.encodeData(that.getMsgListData, param), function(data) {
        //     // console.log('getMsgList = ', that.decodeData(that.msg_list_data, data))
        //     // that.messageList = that.decodeData(that.msg_list_data, data)
        // })

        // // 滚动聊天底部
        // this.$nextTick(() => {
        //     let msg = document.getElementById('hello') // 获取对象
        //     msg.scrollTop = msg.scrollHeight // 滚动高度
        // })
    },

    methods: {
        // 关闭会话
        closeChat() {
            let that = this
            that.socket.emit('setSessionStatus', that.encodeData(that.setSessionStatus, { customerId: that.customerId, closed: true }), function(data) {
                let msg = that.decodeData(that.common_data, data)
                console.log('GOOGLE: closed', msg)
                if (msg.message == 'OK') {
                    that.$toast('会话关闭成功')
                }
            })
        },
        // 输入框绑定回车
        onKeyup(e) {
            if (e.keyCode === 13 && this.content.length) {
                this.sendMessage()
            }
        },
        // 消息类型1 发送文字消息 type 1 文字, type 2 图片, type 3 方案/保单
        sendMessage() {
            let that = this
            let nowTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

            // 顾问回复消息
            this.socket.emit(
                'reply',
                that.encodeData(that.reply_data, {
                    customerId: that.customerId,
                    replyType: 1,
                    replyContent: that.content
                }),
                function(data) {
                    let msg = that.decodeData(that.common_data, data)
                    console.log('GOOGLE: msg', msg)
                    if (msg.status == 3) {
                        Notify({ type: 'danger', message: msg.message })
                        return
                    } else if (msg.status == 2) {
                        Notify({ type: 'danger', message: '发送失败,请稍后重试' })
                        return
                    }
                    // 添加消息队列显示
                    that.messageList.push({
                        adviserId: that.user.id,
                        content: that.content,
                        createTime: nowTime,
                        customerId: that.customerId,
                        direction: 'REPLY',
                        markRead: true,
                        type: 1,
                        id: that.msgID
                    })
                    that.msgID++
                    // 输入框置空
                    that.content = ''
                    // 滚到底部
                    that.$nextTick(() => {
                        let msg = document.getElementById('hello') // 获取对象
                        msg.scrollTop = msg.scrollHeight // 滚动高度
                    })
                }
            )
        },
        // 消息类型2 发送图片消息
        sendMessageImg(imgurl) {
            let imgmsg = `<img class="ximg" width="100" height="100" src="${imgurl}" />`
            // 上传获取链接后直接发送
            let that = this
            let nowTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

            // 顾问回复消息
            this.socket.emit(
                'reply',
                that.encodeData(that.reply_data, {
                    customerId: that.customerId,
                    replyType: 2,
                    replyContent: imgurl
                }),
                function(data) {
                    let msg = that.decodeData(that.common_data, data)
                    console.log('GOOGLE: msg', msg)
                    if (msg.status == 3) {
                        Notify({ type: 'danger', message: msg.message })
                        return
                    } else if (msg.status == 2) {
                        Notify({ type: 'danger', message: '发送失败,请稍后重试' })
                        return
                    }
                    // 添加消息队列显示
                    that.messageList.push({
                        adviserId: that.user.id,
                        content: imgmsg,
                        createTime: nowTime,
                        customerId: that.customerId,
                        direction: 'REPLY',
                        markRead: true,
                        type: 2,
                        id: that.msgID
                    })
                    that.msgID++
                    // 滚到底部
                    that.$nextTick(() => {
                        let msg = document.getElementById('hello') // 获取对象
                        msg.scrollTop = msg.scrollHeight // 滚动高度
                    })
                }
            )
        },
        // 消息类型3 发送方案 问卷消息 不调用reply
        sendMessageLink() {
            // let that = this

            let nowTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

            // 添加消息队列显示
            this.messageList.push({
                adviserId: this.user.id,
                content: this.content,
                createTime: nowTime,
                customerId: this.customerId,
                direction: 'REPLY',
                markRead: true,
                type: 3,
                id: that.msgID
            })
            that.msgID++
            // 输入框置空
            this.content = ''
            // 滚到底部
            this.$nextTick(() => {
                let msg = document.getElementById('hello') // 获取对象
                msg.scrollTop = msg.scrollHeight // 滚动高度
            })
        },
        sendClick() {
            if (this.content.length) {
                this.sendMessage()
            }
        },
        onClickLeft() {
            this.$router.push({
                name: 'list'
            })
        },
        onClickRight() {
            this.showSheet = true
        },
        // 关闭上拉菜单
        onCancel() {
            this.showSheet = false
        },
        // 上拉菜单选中
        onSelect(item) {
            this.showSheet = false
            // let that = this
            if (item.value) {
                this.$router.push({
                    path: 'customerInfo',
                    query: {
                        customerId: this.customerId,
                        userId: this.userId,
                        customerUserId: this.customerUserId
                    }
                })
            } else {
                // 关闭对话
                this.closeChat()
            }
        },
        // 获取更早的信息
        getEarlyMsg() {
            let that = this
            this.fetchTime = this.messageList[0].createTime

            // 获取和某个客户的对话消息列表
            this.socket.emit('getMsgList', that.encodeData(that.getMsgListData, { createTime: that.fetchTime, customerId: that.customerId }), function(data) {
                let msgData = that.decodeData(that.msg_list_data, data)
                // console.log('GOOGLE: getEarlyMsg -> msgData', msgData)
                // 处理消息类型 2img套上img标签
                for (let i = 0; i < msgData.msgList.length; i++) {
                    const element = msgData.msgList[i]
                    element.id = that.msgID
                    that.msgID++
                    if (element.type == 2) {
                        element.content = `<img class="ximg" width="100" height="100" src="${element.content}" />`
                    }
                }
                msgData.msgList.reverse()
                // 获取新列表末条ID
                if (msgData.msgList.length == 0) {
                    that.$toast('已全部加载')
                    return
                }
                let msgID = msgData.msgList[msgData.msgList.length - 1].id
                that.messageList.unshift(...msgData.msgList)
                that.$toast('信息加载成功')

                // 滚动到该id dom
                that.$nextTick(() => {
                    document.getElementById('id' + msgID).scrollIntoView()
                })
            })
        },
        onRefresh() {
            setTimeout(() => {
                this.isLoading = false
                this.getEarlyMsg()
            }, 500)
        },
        openKonw() {
            this.show = true
        },
        // 上传图片
        onRead(file) {
            // console.log('GOOGLE: file', file)
            // 上传图片到图片服务器
            // let url = 'http://192.168.199.30:8000/api/resources/consultUpload'
            let url = base_url + uploadFile
            let fd = new FormData()
            fd.append('file', file.file)
            axios
                .post(url, fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(res => {
                    this.sendMessageImg(res.data.data)
                })
                .catch(err => {
                    alert(err)
                })
        },
        senImage(img) {
            this.show = false
            this.sendMessageImg(img)
        },

        showPopImg(url) {
            this.showImg = true
            this.showImgUrl = url
        },

        // 方案 方案PLAN = 1;
        sendPlan() {
            Dialog.confirm({
                // title: '标题',
                message: '是否发送方案链接',
                confirmButtonText: '是',
                confirmButtonColor: '#2EE2AC',
                cancelButtonText: '否',
                cancelButtonColor: '#FEA03A'
            })
                .then(() => {
                    // on confirm
                    let that = this

                    // let link = 'http://app.shuangzixinggame.com/#/programmeList?userId=' + that.userId
                    getPlan(that.customerUserId)
                        .then(res => {
                            console.log('GOOGLE: res', res)
                            if (res.status == 0) {
                                let link = res.message // 发送链接给客户
                                let a = '<a class="amsg" href="' + link + '">点击查看方案</a>'
                                that.content = '你的专属定制方案已经生成！' + '<br><br>' + a
                                that.sendMessageLink()
                            } else {
                                Notify({ type: 'danger', message: res.message })
                            }
                        })
                        .catch(err => {
                            // console.log(err.response.data.message)
                        })
                })
                .catch(() => {
                    // on cancel
                })
        },
        // 问卷 问卷QA = 2;
        sendQA() {
            Dialog.confirm({
                // title: '标题',
                message: '是否发送问卷链接',
                confirmButtonText: '是',
                confirmButtonColor: '#2EE2AC',
                cancelButtonText: '否',
                cancelButtonColor: '#FEA03A'
            })
                .then(() => {
                    // on confirm
                    let that = this

                    let link = 'http://app.shuangzixinggame.com/#/programme?openId=' + that.customerId
                    // 发送链接给客户

                    that.socket.emit(
                        'putLink',
                        that.encodeData(that.putLinkData, {
                            customerId: that.customerId,
                            type: 2, // PLAN = 1; QA = 2;
                            url: link
                        }),
                        function(data) {}
                    )
                    let a = '<a class="amsg" href="' + link + '">点击填写问卷</a>'
                    that.content = '科学定制保障方案，为每个家庭保驾护航！' + '<br><br>' + a
                    that.sendMessageLink()
                })
                .catch(() => {
                    // on cancel
                })
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.navbar {
    background-color: #00d6fb;
}
.navbar >>> .van-nav-bar__title {
    color: #fff;
}
.navbar >>> .van-nav-bar__text {
    color: #fff;
}
.navbar >>> .van-icon {
    color: #fff;
}
.hello {
    overflow: auto;
    width: 100%;
    height: 100%;
}
.message {
    /* overflow: scroll; */
    padding: 60px 15px 80px;
    background-color: #f7f7f7;
}
.message li {
    margin-bottom: 15px;
}
.message ul {
    margin: 0px;
    padding: 0px;
    list-style: none;
}
.message .main {
    position: relative;
    margin-bottom: 10px;
}
.message .time {
    margin: 7px 0;
    text-align: center;
}
.message .time > span {
    display: inline-block;
    padding: 3px 18px;
    border-radius: 2px;
    color: #fff;
    color: #c1c1c1;
    font-size: 12px;
    /* background-color: #dadada; */
}

.message .text >>> a {
    color: #fea03a;
}
.message .text {
    position: relative;
    /* position: absolute; */
    top: 0px;
    display: inline-block;
    padding: 10px 14px;
    min-height: 30px;
    /* min-width: 30px; */
    max-width: calc(100% - 100px);
    border-radius: 16px 16px 0px 16px;
    background-color: #fff;
    color: #666;
    text-align: left;
    word-break: break-all;
    font-size: 12px;
    line-height: 16px;
}
.message .leftmsg .text {
    border-radius: 16px 16px 16px 0px;
}

.message .textimg img {
    border-radius: 16px 16px 0px 16px;
}

/* .message .text:before {
    content: ' ';
    position: absolute;
    top: 9px;
    right: 100%;
    border: 6px solid transparent;
    border-right-color: #fafafa;
} */
.message .system {
    /* text-align: center; */
    margin: 10px 12px;
    border-radius: 4px;
    background-color: #eeeeee;
}
.message .system .text {
    max-width: 100%;
    width: 100%;
    background-color: #eeeeee;
    color: #fea03a;
    line-height: 18px;
}
.message .system .text >>> a {
    padding: 0 2px;
    text-decoration: underline;
}
.message .self {
    text-align: right;
}
.message .avatar {
    position: absolute;
    bottom: -20px;
    float: left;
    margin: 0 10px 0 0;
    border-radius: 20px;
}
.message .leftmsg .avatar {
    left: 0px;
}
.message .rightmsg .avatar {
    right: 0px;
}
.message .avatarplace {
    float: left;
    margin: 0 10px 0 0;
    width: 40px;
    height: 40px;
    border-radius: 20px;
}
.message .self .avatar {
    float: right;
    margin: 0 0 0 10px;
}
.message .self .avatarplace {
    float: right;
    margin: 0 0 0 10px;
}

.message .self .text {
    background-color: #1da5fe;
    color: #fff;
}
.message .self .text:before {
    right: inherit;
    left: 100%;
    border-right-color: transparent;
    border-left-color: #1da5fe;
}
.imputtext {
    /* border-top: solid 1px #ddd; */
    position: fixed;
    bottom: 0;
    box-sizing: border-box;
    padding: 7px 0 0 12px;
    width: 100%;
    height: 71px;
    background-color: #efefef;
}
.imputtext textarea {
    padding: 0 0 0 10px;
    /* margin: 12px 20px 12 8px; */
    /* height: 100%; */
    width: calc(96% - 92px);
    height: 35px;
    outline: none;
    border: none;
    border-radius: 17px;
    font-family: 'Micrsofot Yahei';
    line-height: 35px;
    resize: none;
}
.send {
    float: right;
    margin-top: 3px;
    margin-right: 12px;
}
.bar {
    width: 100%;
    height: 36px;
    /* background-color: #e5e5e5; */
}
.barlist {
    display: flex;
    /* justify-content: space-around; */
    align-items: center;
    padding: 6px 8px 0;
}
.ltime {
    padding-left: 42px;
    color: #999;
    font-size: 12px;
}
.rtime {
    padding-right: 42px;
    color: #999;
    font-size: 12px;
}
.rightmsg {
    text-align: right;
}
.popwrap {
    height: 480px;
}
.message .slef .textimg {
    position: relative;
    /* position: absolute; */
    top: 0px;
    display: inline-block;
    min-height: 30px;
    /* padding: 10px 14px; */
    /* min-width: 30px; */
    max-width: calc(100% - 100px);
    /* background-color: #fff; */
    border-radius: 16px 16px 0px 16px;
    color: #666;
    text-align: left;
    word-break: break-all;
    font-size: 12px;
    line-height: 16px;
}
.message .self .textlink {
    position: relative;
    /* position: absolute; */
    top: 0px;
    display: inline-block;
    padding: 10px 14px;
    min-height: 30px;
    /* min-width: 30px; */
    max-width: calc(100% - 100px);
    border-radius: 16px 16px 0px 16px;
    background: #fff;
    background-color: #fff;
    color: #000;
    text-align: left;
    word-break: break-all;
    font-size: 12px;
    line-height: 16px;
}
.message >>> .amsg {
    color: #fea03a;
}

.message >>> .ximg {
    /* width: 100px; */
    margin-top: 10px;
}
.message .rightmsg >>> .ximg {
    border-radius: 16px 16px 0px 16px;
}
.message .lrftmsg >>> .ximg {
    border-radius: 16px 16px 16px 0px;
}
.popImg {
    width: 100%;
}
.popImg div {
    padding: 10px;
    /* max-width: 90%; */
    /* width: 90%; */
}
.popImg >>> div img {
    width: 100%;
    height: auto;
}
.iconfont {
    margin-right: 40px;
    font-size: 16px;
}
.icon-camera {
    font-size: 18px;
}

.sheet {
    right: 0;
    left: 0;
    margin: auto;
    width: 90%;
    background: transparent;
}
.sheet.van-popup--bottom.van-popup--round {
    border-radius: 10px;
}

.sheet >>> .van-action-sheet__item + .van-action-sheet__item {
    /* border-radius: 0 0 30px 30px; */
    border-radius: 0 0 10px 10px;
}
.sheet >>> .van-action-sheet__cancel {
    margin-top: 7px;
    border-radius: 10px;
}
.sheet >>> .van-action-sheet__cancel::before {
    display: none;
}
/* 可以设置不同的进入和离开动画 */
/* 设置持续时间和动画函数 */
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
    /* transition: all 80s cubic-bezier(1, 0.5, 0.8, 1); */
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active for below version 2.1.8 */ {
    opacity: 1;
    transform: translateY(-20px);
}
</style>
