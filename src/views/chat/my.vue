<template>
    <div class="contanter">
        <!-- NavBar -->
        <!-- <van-nav-bar title="我的" /> -->
        <!-- NavBar -->
        <div class="mytop">
            <div class="img">
                <van-image class="topimg" round width="5rem" height="5rem" :src="user.avatar" />
                <van-tag class="rtag" round type="danger" v-if="status">在线</van-tag>
                <van-tag class="rtag ltag" round type="danger" v-if="!status">离线</van-tag>
            </div>
            <div class="name">{{ user.userName }}</div>
            <div class="status" @click="showSheet = true">
                <div class="text1">在线状态</div>
                <div class="text2">{{ status ? '在线' : '离线' }}</div>
                <div class="text3"><van-icon name="arrow" /></div>
            </div>
        </div>
        <!-- <van-grid>
            <van-grid-item icon="coupon" text="知识库" to="knowLedge" />
            <van-grid-item icon="weapp-nav" text="修改密码" to="password" />
            <van-grid-item icon="photo" text="全部已读" />
            <van-grid-item icon="photo-o" text="注销" />
            <van-grid-item icon="photo-o" text="文字" />
            <van-grid-item icon="photo-o" text="文字" />
            <van-grid-item icon="photo-o" text="文字" />
        </van-grid> -->
        <div class="grid">
            <router-link to="knowledgeMy">
                <div class="grid-item">
                    <p class="icon"><img class="fullimg" src="../../assets/img/icon_knowmy@2x.png" alt="" /></p>
                    <p class="text">知识库</p>
                    <p class="right"><img class="fullimg" src="../../assets/img/icon_left.png" alt="" /></p>
                </div>
            </router-link>
            <div class="grid-item" @click="showSheetRead = true">
                <p class="icon"><img class="fullimg" src="../../assets/img/icon_read@2x.png" alt="" /></p>
                <p class="text">全部已读</p>
                <p class="right"><img class="fullimg" src="../../assets/img/icon_left.png" alt="" /></p>
            </div>
            <router-link to="password">
                <div class="grid-item">
                    <p class="icon"><img class="fullimg" src="../../assets/img/icon_xgmm.png" alt="" /></p>
                    <p class="text">修改密码</p>
                    <p class="right"><img class="fullimg" src="../../assets/img/icon_left.png" alt="" /></p>
                </div>
            </router-link>
            <div class="grid-item" @click="showSheetLog = true">
                <p class="icon"><img class="fullimg" src="../../assets/img/icon_logout@2x.png" alt="" /></p>
                <p class="text">注销</p>
                <p class="right"><img class="fullimg" src="../../assets/img/icon_left.png" alt="" /></p>
            </div>
        </div>
        <!-- action-sheet -->
        <van-action-sheet class="sheet" v-model="showSheet" :actions="actions" cancel-text="取消" @cancel="onCancel" @select="onSelect" />
        <van-action-sheet class="sheet" v-model="showSheetRead" :actions="actionsRead" cancel-text="取消" @cancel="onCancel" @select="onSelectRead" />
        <van-action-sheet class="sheet" v-model="showSheetLog" :actions="actionsLog" cancel-text="取消" @cancel="onCancel" @select="onSelectLog" />
        <!-- action-sheet -->
        <!-- Tabbar -->
        <van-tabbar active-color="#06CCFC" inactive-color="#ccc" v-model="active">
            <van-tabbar-item :to="{ name: 'list' }">
                <van-icon class="iconfont" class-prefix="icon" slot="icon" slot-scope="props" name="Tabbar-icon_message_s"></van-icon>
                <span>消息</span>
            </van-tabbar-item>
            <van-tabbar-item :to="{ name: 'my' }">
                <van-icon class="iconfont" class-prefix="icon" slot="icon" slot-scope="props" name="mine"></van-icon>
                <span>我</span>
            </van-tabbar-item>
        </van-tabbar>
        <!-- Tabbar -->
    </div>
</template>

<script>
import io from 'socket.io-client'
import { load } from 'protobufjs'
import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)
export default {
    name: 'my',
    data() {
        return {
            status: this.$store.getters.getStatus,
            showSheet: false, //状态
            showSheetRead: false, //已读
            showSheetLog: false, //注销
            actions: [
                { name: '在线', color: '#2EE2AC', value: true },
                { name: '离线', color: '#FF631D', value: false }
            ],
            actionsRead: [
                { subname: '将把“消息列表”中的所有消息设为已读', color: '#999', value: true, disabled: true },
                { name: '全部已读', color: '#FF631D', value: false }
            ],
            actionsLog: [
                { subname: '注销后将退出账户', color: '#999', value: true, disabled: true },
                { name: '确认注销', color: '#FF631D', value: false }
            ],
            active: 1 //Tabbar 选中
            // 会话列表
        }
    },

    mounted: function() {
        this.checkSocket()
    },
    filters: {},
    methods: {
        logout() {
            this.socket.close()
            this.socket.disconnect()
            this.$router.push({
                name: 'login'
            })
        },
        allRead() {
            // 全部已读
            this.socket.emit('clearUnReadMsg', function(data) {
                Notify({ type: 'success', message: '已设置为全部已读' })
            })
        },
        onCancel() {
            // this.showSheet = false
        },
        onSelect(item) {
            this.showSheet = false
            let that = this
            load('./static/common.proto', function(err, root) {
                if (err) throw err
                let setOnlineState = root.lookupType('SetOnlineState')
                let common_data = root.lookupType('CommonMessage')

                // 设置在线状态
                that.socket.emit('setOnlineState', that.encodeData(setOnlineState, { state: item.value }), function(data) {
                    let reply = that.decodeData(common_data, data)
                    if (reply.message == 'OK') {
                        that.$store.commit('setStatus', item.value)
                        that.status = item.value
                        Notify({ type: 'success', message: '设置成功' })
                    } else {
                        Notify({ type: 'danger', message: '设置失败' })
                    }
                })
            })
        },
        onSelectRead(item) {
            if (item.value) {
                return
            }
            this.allRead()
            this.showSheetRead = false
        },
        onSelectLog(item) {
            if (item.value) {
                return
            }
            this.logout()
            this.showSheetLog = false
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.contanter {
    height: 100vh;
    background: #f7f7f7 url(~@/assets/img/bg_my.png) no-repeat;
    background-size: 100%;
}
.mytop {
    padding-top: 80px;
    width: 100%;
    height: 300px;
    text-align: center;
    /* display: flex; */
    /* justify-content: flex-start; */
}
.mytop .img {
    position: relative;
    margin: 0 auto;
    width: 100px;
}

.mytop .img >>> .van-image__img {
    border: 3px solid #fff;
}

.mytop .rtag {
    position: absolute;
    top: 18px;
    right: -10px;
    padding: 0 6px;
    min-width: 15px;
    height: 22px;
    background-color: #2ee2ac;
    text-align: center;
    /* border: 3px solid #fff; */
}
.mytop .rtag.ltag {
    background-color: #ff631d;
}
.mytop .topimg {
    margin: 18px 0px 0 0px;
}
.mytop .name {
    margin-top: 10px;
    color: #181818;
    font-size: 18px;
}
.grid {
    margin-top: 40px;
}
.grid-item {
    display: flex;
    height: 60px;
    background: #fff;
    line-height: 60px;
}
.grid-item .icon {
    margin: 8px 8px 0 12px;
    width: 44px;
    height: 44px;
}
.grid-item .right {
    margin: 8px 8px 0 auto;
    margin-left: auto;
    width: 44px;
    height: 44px;
}
.grid-item .text {
    color: #000;
    font-size: 14px;
}
.fullimg {
    width: 100%;
}
.iconfont {
    font-size: 22px;
}
.status {
    display: flex;
    margin: 20px auto 40px;
    width: 180px;
    height: 30px;
    border-radius: 30px;
    background-color: #91ceff;
    color: #fff;
    line-height: 30px;
}
.status .text1 {
    padding-left: 24px;
    font-size: 14px;
}
.status .text2 {
    padding-top: 0px;
    padding-left: 45px;
    font-size: 12px;
}
.status .text3 {
    padding-top: 2px;
    padding-left: 10px;
    font-size: 12px;
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
.sheet >>> .van-action-sheet__item {
    /* border-radius: 30px; */
    /* margin-bottom: 20px; */
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
</style>
