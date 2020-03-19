<template>
    <div class="contanter">
        <!-- NavBar -->
        <van-nav-bar class="navbar" :title="'历史消息' + ''" left-arrow @click-left="onClickLeft" />
        <!-- NavBar -->
        <div class="list">
            <van-swipe-cell v-if="1"> </van-swipe-cell>
            <van-swipe-cell v-for="(item, index) in fedlist.customerList" :key="index" v-if="item.lastMsgTime">
                <div class="item" @click="toMessage(item.customerId, item.userId, item.customerUserId, index)">
                    <div class="img">
                        <img class="timg" :src="item.customerHeadImg" alt="" />
                        <van-tag class="rtag" round type="danger" v-if="item.unReadCount > 0">{{ item.unReadCount }}</van-tag>
                    </div>
                    <div class="info">
                        <p class="line1">
                            {{ item.customerNickName }}
                            <span class="stime">
                                {{ item.lastMsgTime }}
                            </span>
                        </p>
                        <p class="line2">{{ item.lastMsgContent }}</p>
                    </div>
                </div>
            </van-swipe-cell>
        </div>
        <!-- Tabbar -->
        <van-tabbar active-color="#06CCFC" inactive-color="#ccc" v-model="active">
            <van-tabbar-item :to="{ name: 'list' }">
                <van-icon class="iconfont" class-prefix="icon" slot="icon" name="Tabbar-icon_message_s"></van-icon>
                <span>消息</span>
            </van-tabbar-item>
            <van-tabbar-item :to="{ name: 'my' }">
                <van-icon class="iconfont" class-prefix="icon" slot="icon" name="mine"></van-icon>
                <span>我</span>
            </van-tabbar-item>
        </van-tabbar>
        <!-- Tabbar -->
    </div>
</template>

<script>
import io from 'socket.io-client'
import { load } from 'protobufjs'

export default {
    name: 'friendList',
    data() {
        return {
            closeNum: 0,
            active: 0, //Tabbar 选中
            fedlist: {} // 会话列表
        }
    },

    mounted() {
        let that = this
        this.checkSocket()

        load('./static/common.proto', function(err, root) {
            if (err) throw err
            let getCustomerListData = root.lookupType('ConsultCustomerList')
            let getCustomerListParam = root.lookupType('GetCustomerList')
            let message_data = root.lookupType('ConsultMessage')

            // 获取客户列表
            that.socket.emit('getCustomerList', that.encodeData(getCustomerListParam, { closed: true }), function(data) {
                that.fedlist = that.decodeData(getCustomerListData, data)
                console.log('GOOGLE: that.fedlist', that.fedlist)
            })
            // 计算关闭会话的数量
            // that.socket.emit('getCustomerList', that.encodeData(getCustomerListParam, { closed: true }), function(data) {
            //     let list = that.decodeData(getCustomerListData, data)
            //     that.closeNum = list.customerList.length
            //     console.log('GOOGLE: that.fedlistfalse', list)
            // })
            // that.socket.emit('getCustomerList', function(data) {
            //     console.log('GOOGLE: data', data)
            //     that.fedlist = that.decodeData(getCustomerListData, data)
            //     console.log('GOOGLE: that.fedlist', that.fedlist)
            // })

            // 接收客户消息
            that.socket.on('consult', function(data) {
                let userMsg = that.decodeData(message_data, data)
                let mark = true
                for (let i = 0; i < that.fedlist.customerList.length; i++) {
                    if (userMsg.customerId == that.fedlist.customerList[i].customerId) {
                        that.fedlist.customerList[i].unReadCount++
                        that.fedlist.customerList[i].lastMsgContent = userMsg.messageContent
                        // mark = false
                    }
                }
                // 收到列表中没有的用户信息 刷新列表以显示
                if (mark) {
                    // 重新获取客户列表
                    that.socket.emit('getCustomerList', function(data) {
                        that.fedlist = that.decodeData(getCustomerListData, data)
                    })
                    // that.fedlist.customerList.push({
                    //     // adviserId: 6,
                    //     customerId: userMsg.customerId,
                    //     customerNickName: 'Mr.Hu💦',
                    //     customerHeadImg: 'http://q18u4vwh7.bkt.clouddn.com/132-20191217142739.132',
                    //     lastMsgContent: '123',
                    //     lastMsgTime: '2019-12-17 14:27:40',
                    //     unReadCount: 1
                    // })
                }
            })
        })
    },
    filters: {},
    methods: {
        onClickLeft() {
            this.$router.push({
                name: 'list'
            })
        },
        // 进入会话
        toMessage(customerId, userId, customerUserId, index) {
            // 存储头像
            this.$store.commit('setCustomerImg', this.fedlist.customerList[index].customerHeadImg)
            this.$router.push({
                path: 'message',
                query: {
                    customerId: customerId,
                    userId: userId,
                    customerUserId: customerUserId
                }
            })
        }
    }
}
</script>

<style scoped>
.contanter {
    background-color: #e6e6e6;
}
.navbar {
    background-color: #ededed;
}
.item {
    /* margin-bottom: 2px; */
    /* border-radius: 5px; */
    overflow: hidden;
    box-sizing: border-box;
    width: 100%;
    height: 80px;
    border-bottom: 1px solid #e6e6e6;
    /* padding: 6px; */
    background-color: #fff;
    font-size: 14px;
}
.item p {
    margin: 0;
}
.img {
    overflow: hidden;
    flex-grow: 0;
    margin: 18px 0 0 12px;
    width: 44px;
    height: 44px;
    border-radius: 100px;
}
.imghis {
    border-radius: 0;
}
.info {
    flex-grow: 1;
    padding-left: 14px;
}
.item .time {
    flex-grow: 1;
    margin-top: 6px;
    margin-top: 18px;
    text-align: right;
    font-size: 12px;
}
.item .stime {
    float: right;
    padding-top: 4px;
    padding-right: 12px;
    color: #a8a8a8;
    font-size: 12px;
}
.item .line1 {
    margin-top: 18px;
    color: #000;
    /* max-width: 100px; */
    font-size: 17px;
}
.item .line2 {
    overflow: hidden;
    margin-top: 8px;
    max-width: 250px;
    max-height: 16px;
    color: #717171;
    font-size: 14px;
    line-height: 16px;
}
.item .timg {
    width: 100%;
    height: 100%;
}
.list {
    width: 100%;
}
.item {
    position: relative;
    display: flex;
    justify-content: flex-start;
    width: 100%;
}
.rtag {
    position: absolute;
    top: 18px;
    left: 39px;
    display: block;
    min-width: 25px;
    height: 25px;
    border: 3px solid #fff;
    background-color: #fc6666;
    text-align: center;
}
.iconfont {
    font-size: 22px;
}
</style>
